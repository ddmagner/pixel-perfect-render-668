import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { InvoicePreview } from '@/components/InvoicePreview';
import { TimeEntry, AppSettings, ViewMode } from '@/types';

async function canvasToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 612pt
  const pageHeight = pdf.internal.pageSize.getHeight(); // 792pt

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;

  // If taller than one page, scale to page height instead and center horizontally
  if (imgHeight > pageHeight) {
    const scaleToHeight = pageHeight;
    const scaledWidth = (canvas.width / canvas.height) * scaleToHeight;
    const x = (pageWidth - scaledWidth) / 2;
    pdf.addImage(imgData, 'PNG', x, 0, scaledWidth, scaleToHeight);
  } else {
    // Center vertically if shorter than page height
    const y = 0; // align to top for consistent margins embedded in the capture
    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
  }

  return pdf.output('blob');
}

export async function createPdfFromPreview(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode
): Promise<Blob> {
  if (viewMode === 'invoice') {
    // Load the dedicated invoice page in a hidden iframe for pixel-perfect capture
    const key = `key_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const payload = JSON.stringify({ entries, settings });
    try {
      localStorage.setItem(`invoice:${key}`, payload);
      localStorage.setItem(key, payload); // legacy fallback supported by the page
    } catch {}

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '816px'; // 8.5in * 96dpi
    iframe.style.height = '1056px'; // 11in * 96dpi
    iframe.style.visibility = 'hidden';
    iframe.src = `/invoice?k=${encodeURIComponent(key)}`;
    document.body.appendChild(iframe);

    const blob = await new Promise<Blob>((resolve, reject) => {
      iframe.onload = async () => {
        try {
          // Wait for the invoice page to signal readiness (fonts/images rendered)
          await new Promise<void>((done) => {
            const onMessage = (e: MessageEvent) => {
              if (e.origin !== window.location.origin) return;
              if (e.data && e.data.type === 'invoice-ready') {
                window.removeEventListener('message', onMessage);
                done();
              }
            };
            window.addEventListener('message', onMessage);
            // Fallback timeout in case message doesn't arrive
            window.setTimeout(() => {
              window.removeEventListener('message', onMessage);
              done();
            }, 6000);
          });

          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          const el = (doc?.querySelector('.invoice-content') as HTMLElement) || (doc?.body as HTMLElement);
          if (!el) throw new Error('Invoice content not found');

          const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, letterRendering: true } as any);
          const pdfBlob = await canvasToPdfBlob(canvas);
          resolve(pdfBlob);
        } catch (e) {
          reject(e);
        } finally {
          iframe.remove();
        }
      };
      iframe.onerror = () => {
        iframe.remove();
        reject(new Error('Failed to load invoice page'));
      };
    });

    return blob;
  }

  // Time Card: render the existing InvoicePreview component offscreen and capture it
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.height = '1056px';
  document.body.appendChild(container);

  // Ensure correct mode
  const injectedSettings: AppSettings = { ...settings, invoiceMode: viewMode as string === 'invoice' } as AppSettings;

  const root = createRoot(container);
  root.render(
    React.createElement(InvoicePreview, {
      selectedEntries: entries,
      settings: injectedSettings,
      onClose: () => {}
    })
  );

  // Wait a tick for layout and fonts
  await new Promise(r => setTimeout(r, 350));

  const el = container.querySelector('#document-preview') as HTMLElement | null;
  if (!el) {
    root.unmount();
    container.remove();
    throw new Error('Document preview element not found');
  }

  try {
    // Wait for web fonts
    // @ts-ignore
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      // @ts-ignore
      await document.fonts.ready;
    }
    // Wait for images inside the preview
    const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              const done = () => res();
              img.onload = done;
              img.onerror = done;
            })
      )
    );
  } catch {}

  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, letterRendering: true } as any);
  const blob = await canvasToPdfBlob(canvas);

  root.unmount();
  container.remove();

  return blob;
}
