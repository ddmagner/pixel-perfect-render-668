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
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      letterRendering: true,
      foreignObjectRendering: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: liveEl.scrollWidth,
      windowHeight: liveEl.scrollHeight,
      logging: false,
      onclone: (doc: Document, clonedEl: HTMLElement) => {
        // Find the cloned preview element
        const el = clonedEl;
        if (el) {
          try {
            // Remove box shadow
            el.style.boxShadow = 'none';

            // Force all computed styles to be inline for accurate capture
            const allElements = el.querySelectorAll('*');
            allElements.forEach((element) => {
              const htmlEl = element as HTMLElement;
              const computed = window.getComputedStyle(element);
              
              // Preserve all color properties
              if (computed.color) htmlEl.style.color = computed.color;
              if (computed.backgroundColor) htmlEl.style.backgroundColor = computed.backgroundColor;
              if (computed.opacity) htmlEl.style.opacity = computed.opacity;
              
              // Preserve filters (for the logo)
              if (computed.filter && computed.filter !== 'none') {
                htmlEl.style.filter = computed.filter;
              }
              
            // Preserve text properties
            if (computed.textAlign) htmlEl.style.textAlign = computed.textAlign;
            if (computed.fontSize) htmlEl.style.fontSize = computed.fontSize;
            if (computed.fontWeight) htmlEl.style.fontWeight = computed.fontWeight;
            if (computed.fontFamily) htmlEl.style.fontFamily = computed.fontFamily;
            if (computed.lineHeight) htmlEl.style.lineHeight = computed.lineHeight;
            if (computed.letterSpacing) htmlEl.style.letterSpacing = computed.letterSpacing;
            if (computed.textTransform) htmlEl.style.textTransform = computed.textTransform;
            if (computed.textDecoration) htmlEl.style.textDecoration = computed.textDecoration;
            if (computed.whiteSpace) htmlEl.style.whiteSpace = computed.whiteSpace;
            if (computed.wordSpacing) htmlEl.style.wordSpacing = computed.wordSpacing;
              
              // Preserve spacing and positioning
              if (computed.padding) htmlEl.style.padding = computed.padding;
              if (computed.paddingTop) htmlEl.style.paddingTop = computed.paddingTop;
              if (computed.paddingBottom) htmlEl.style.paddingBottom = computed.paddingBottom;
              if (computed.paddingLeft) htmlEl.style.paddingLeft = computed.paddingLeft;
              if (computed.paddingRight) htmlEl.style.paddingRight = computed.paddingRight;
              if (computed.margin) htmlEl.style.margin = computed.margin;
              if (computed.marginTop) htmlEl.style.marginTop = computed.marginTop;
              if (computed.marginBottom) htmlEl.style.marginBottom = computed.marginBottom;
              if (computed.marginLeft) htmlEl.style.marginLeft = computed.marginLeft;
              if (computed.marginRight) htmlEl.style.marginRight = computed.marginRight;
              
              // Preserve layout properties
              if (computed.display) htmlEl.style.display = computed.display;
              if (computed.verticalAlign) htmlEl.style.verticalAlign = computed.verticalAlign;
              if (computed.alignItems) htmlEl.style.alignItems = computed.alignItems;
              if (computed.justifyContent) htmlEl.style.justifyContent = computed.justifyContent;
              if (computed.gap) htmlEl.style.gap = computed.gap;
              if (computed.flexDirection) htmlEl.style.flexDirection = computed.flexDirection;
              
              // Preserve dimensions
              if (computed.width && computed.width !== 'auto') htmlEl.style.width = computed.width;
              if (computed.height && computed.height !== 'auto') htmlEl.style.height = computed.height;
            });

            // Fix image URLs for CORS
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
              } catch {}
            });
          } catch (err) {
            console.error('Error in onclone:', err);
          }
        }
      }
    } as any);

    // Slice the big canvas into page-sized canvases
    const canvases: HTMLCanvasElement[] = [];
    const scale = 3; // matches html2canvas scale
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
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    letterRendering: true,
    foreignObjectRendering: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
    logging: false,
    onclone: (doc: Document, clonedEl: HTMLElement) => {
      const n = clonedEl;
      if (n) {
        try {
          // Remove box shadow
          n.style.boxShadow = 'none';
          
          // Force all computed styles to be inline for accurate capture
          const allElements = n.querySelectorAll('*');
          allElements.forEach((element) => {
            const htmlEl = element as HTMLElement;
            const computed = window.getComputedStyle(element);
            
            // Preserve all color properties
            if (computed.color) htmlEl.style.color = computed.color;
            if (computed.backgroundColor) htmlEl.style.backgroundColor = computed.backgroundColor;
            if (computed.opacity) htmlEl.style.opacity = computed.opacity;
            
            // Preserve filters (for the logo)
            if (computed.filter && computed.filter !== 'none') {
              htmlEl.style.filter = computed.filter;
            }
            
            // Preserve text properties
            if (computed.textAlign) htmlEl.style.textAlign = computed.textAlign;
            if (computed.fontSize) htmlEl.style.fontSize = computed.fontSize;
            if (computed.fontWeight) htmlEl.style.fontWeight = computed.fontWeight;
            if (computed.fontFamily) htmlEl.style.fontFamily = computed.fontFamily;
            if (computed.lineHeight) htmlEl.style.lineHeight = computed.lineHeight;
            if (computed.letterSpacing) htmlEl.style.letterSpacing = computed.letterSpacing;
            if (computed.textTransform) htmlEl.style.textTransform = computed.textTransform;
            if (computed.textDecoration) htmlEl.style.textDecoration = computed.textDecoration;
            if (computed.whiteSpace) htmlEl.style.whiteSpace = computed.whiteSpace;
            if (computed.wordSpacing) htmlEl.style.wordSpacing = computed.wordSpacing;
            
            // Preserve spacing and positioning
            if (computed.padding) htmlEl.style.padding = computed.padding;
            if (computed.paddingTop) htmlEl.style.paddingTop = computed.paddingTop;
            if (computed.paddingBottom) htmlEl.style.paddingBottom = computed.paddingBottom;
            if (computed.paddingLeft) htmlEl.style.paddingLeft = computed.paddingLeft;
            if (computed.paddingRight) htmlEl.style.paddingRight = computed.paddingRight;
            if (computed.margin) htmlEl.style.margin = computed.margin;
            if (computed.marginTop) htmlEl.style.marginTop = computed.marginTop;
            if (computed.marginBottom) htmlEl.style.marginBottom = computed.marginBottom;
            if (computed.marginLeft) htmlEl.style.marginLeft = computed.marginLeft;
            if (computed.marginRight) htmlEl.style.marginRight = computed.marginRight;
            
            // Preserve layout properties
            if (computed.display) htmlEl.style.display = computed.display;
            if (computed.verticalAlign) htmlEl.style.verticalAlign = computed.verticalAlign;
            if (computed.alignItems) htmlEl.style.alignItems = computed.alignItems;
            if (computed.justifyContent) htmlEl.style.justifyContent = computed.justifyContent;
            if (computed.gap) htmlEl.style.gap = computed.gap;
            if (computed.flexDirection) htmlEl.style.flexDirection = computed.flexDirection;
            
            // Preserve dimensions
            if (computed.width && computed.width !== 'auto') htmlEl.style.width = computed.width;
            if (computed.height && computed.height !== 'auto') htmlEl.style.height = computed.height;
          });

          // Fix image URLs for CORS
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
            } catch {}
          });
        } catch (err) {
          console.error('Error in onclone:', err);
        }
      }
    }
  } as any);

  const canvases: HTMLCanvasElement[] = [];
  const scale = 3; // matches html2canvas scale
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
