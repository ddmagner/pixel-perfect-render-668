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

  // Fit image within page bounds preserving aspect ratio with a tiny safety inset
  const cW = canvas.width;
  const cH = canvas.height;
  const safety = 2; // pt inset to avoid right-edge clipping due to rounding
  const maxW = pageWidth - safety * 2;
  const maxH = pageHeight - safety * 2;
  const scale = Math.min(maxW / cW, maxH / cH);
  const drawW = Math.floor(cW * scale);
  const drawH = Math.floor(cH * scale);

  const x = Math.round((pageWidth - drawW) / 2);
  const y = Math.round((pageHeight - drawH) / 2);

  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);

  return pdf.output('blob');
}

async function canvasesToPdfBlob(canvases: HTMLCanvasElement[]): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  canvases.forEach((canvas, idx) => {
    const imgData = canvas.toDataURL('image/png');
    const cW = canvas.width;
    const cH = canvas.height;
    const safety = 2;
    const maxW = pageWidth - safety * 2;
    const maxH = pageHeight - safety * 2;
    const scale = Math.min(maxW / cW, maxH / cH);
    const drawW = Math.floor(cW * scale);
    const drawH = Math.floor(cH * scale);
    const x = Math.round((pageWidth - drawW) / 2);
    const y = Math.round((pageHeight - drawH) / 2);

    if (idx > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
  });

  return pdf.output('blob');
}

export async function createPdfFromPreview(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode,
  targetEl?: HTMLElement | null
): Promise<Blob> {
  // If a live preview is visible on the page, capture it directly for a pixel-perfect match
  const liveEl = (targetEl as HTMLElement | null) || (document.querySelector('#document-preview') as HTMLElement | null) || (document.querySelector('.invoice-content') as HTMLElement | null);
  if (liveEl) {
    try {
      // Ensure fonts and images are fully ready before capture
      // @ts-ignore
      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        // @ts-ignore
        await document.fonts.ready;
      }
      const imgs = Array.from(liveEl.querySelectorAll('img')) as HTMLImageElement[];
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

    const PAGE_W = 816;
    const PAGE_H = 1056;

    // Capture the entire element into a single high-res canvas, then slice into pages
    const fullCanvas = await html2canvas(liveEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      letterRendering: true,
      foreignObjectRendering: false,
      scrollX: 0,
      scrollY: 0,
      onclone: (doc: Document) => {
        const el = (doc.querySelector('#document-preview') as HTMLElement) || (doc.querySelector('.invoice-content') as HTMLElement);
        if (el) {
          try {
            // Ensure predictable width; keep natural height
            el.style.width = `${PAGE_W - 2}px`;
            el.style.maxWidth = `${PAGE_W - 2}px`;
            el.style.boxShadow = 'none';
            el.style.margin = '0 auto';
            el.style.boxSizing = 'border-box';
            el.style.padding = '72px 48px';
            el.style.overflow = 'visible';

            // Normalize layout to avoid negative margin/padding clipping
            const style = doc.createElement('style');
            style.innerHTML = `
              .invoice-content { box-sizing: border-box !important; max-width: ${PAGE_W - 2}px !important; width: ${PAGE_W - 2}px !important; padding: 72px 48px !important; }
              .invoice-content .-ml-\\[25px\\] { margin-left: 0 !important; }
              .invoice-content .-ml-\\[15px\\] { margin-left: 0 !important; }
              .invoice-content .pl-\\[75px\\] { padding-left: 0 !important; }
              .invoice-content img { max-width: 100% !important; height: auto !important; object-fit: contain !important; }
            `;
            doc.head.appendChild(style);

            // Sanitize images for html2canvas
            const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
            imgs.forEach((img) => {
              try {
                const raw = img.getAttribute('src') || '';
                if (raw.startsWith('/')) {
                  img.src = window.location.origin + raw;
                }
                try {
                  const u = new URL(img.src, window.location.origin);
                  if (u.origin === window.location.origin) {
                    img.removeAttribute('crossorigin');
                  } else {
                    img.crossOrigin = 'anonymous';
                  }
                } catch {}
                img.style.filter = 'none';
              } catch {}
            });
          } catch {}
        }
      }
    } as any);

    // Slice the big canvas into page-sized canvases
    const canvases: HTMLCanvasElement[] = [];
    const scale = 2; // matches html2canvas scale
    const pageHeightPx = Math.floor(PAGE_H * scale);
    const totalHeightPx = fullCanvas.height;

    for (let y = 0; y < totalHeightPx; y += pageHeightPx) {
      const sliceHeight = Math.min(pageHeightPx, totalHeightPx - y);
      const slice = document.createElement('canvas');
      slice.width = fullCanvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          fullCanvas,
          0,
          y,
          fullCanvas.width,
          sliceHeight,
          0,
          0,
          fullCanvas.width,
          sliceHeight
        );
      }
      canvases.push(slice);
    }

    return canvasesToPdfBlob(canvases);
  }

  // Skip iframe capture to ensure the downloaded PDF matches the on-screen preview.
  // We fall through to the offscreen component capture below for all modes.

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

  const PAGE_W = 816;
  const PAGE_H = 1056;

  // Capture the entire element once, then slice into PDF pages
  const fullCanvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    letterRendering: true,
    foreignObjectRendering: false,
    scrollX: 0,
    scrollY: 0,
    onclone: (doc: Document) => {
      const n = (doc.querySelector('#document-preview') as HTMLElement) || (doc.querySelector('.invoice-content') as HTMLElement);
      if (n) {
        n.style.width = `${PAGE_W - 2}px`;
        n.style.maxWidth = `${PAGE_W - 2}px`;
        n.style.boxShadow = 'none';
        n.style.margin = '0 auto';
        n.style.boxSizing = 'border-box';
        n.style.padding = '72px 48px';
        n.style.overflow = 'visible';
        try {
          const style = doc.createElement('style');
          style.innerHTML = `
            .invoice-content { box-sizing: border-box !important; max-width: ${PAGE_W - 2}px !important; width: ${PAGE_W - 2}px !important; padding: 72px 48px !important; }
            .invoice-content .-ml-\\[25px\\] { margin-left: 0 !important; }
            .invoice-content .-ml-\\[15px\\] { margin-left: 0 !important; }
            .invoice-content .pl-\\[75px\\] { padding-left: 0 !important; }
            .invoice-content img { max-width: 100% !important; height: auto !important; object-fit: contain !important; }
          `;
          doc.head.appendChild(style);
        } catch {}
        try {
          const imgs = Array.from(n.querySelectorAll('img')) as HTMLImageElement[];
          imgs.forEach((img) => {
            try {
              const raw = img.getAttribute('src') || '';
              if (raw.startsWith('/')) {
                img.src = window.location.origin + raw;
              }
              try {
                const u = new URL(img.src, window.location.origin);
                if (u.origin === window.location.origin) {
                  img.removeAttribute('crossorigin');
                } else {
                  img.crossOrigin = 'anonymous';
                }
              } catch {}
              img.style.filter = 'none';
            } catch {}
          });
        } catch {}
      }
    }
  } as any);

  const canvases: HTMLCanvasElement[] = [];
  const scale = 2; // matches html2canvas scale
  const pageHeightPx = Math.floor(PAGE_H * scale);
  const totalHeightPx = fullCanvas.height;

  for (let y = 0; y < totalHeightPx; y += pageHeightPx) {
    const sliceHeight = Math.min(pageHeightPx, totalHeightPx - y);
    const slice = document.createElement('canvas');
    slice.width = fullCanvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        fullCanvas,
        0,
        y,
        fullCanvas.width,
        sliceHeight,
        0,
        0,
        fullCanvas.width,
        sliceHeight
      );
    }
    canvases.push(slice);
  }
  const blob = await canvasesToPdfBlob(canvases);

  root.unmount();
  container.remove();

  return blob;
}
