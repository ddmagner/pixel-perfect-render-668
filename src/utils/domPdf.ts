import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { InvoicePreview } from '@/components/InvoicePreview';
import { TimeEntry, AppSettings, ViewMode } from '@/types';

const LOGO_MATCHERS = [
  '8829a351-d8df-4d66-829d-f34b1754bd35',
  '21706651-e7f7-4eec-b5d7-cd8ccf2a385f'
];

async function greyifyImageElement(img: HTMLImageElement): Promise<void> {
  try {
    // Ensure the image is decoded
    // @ts-ignore
    if (typeof img.decode === 'function') {
      try { await img.decode(); } catch {}
    }
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise<void>((res) => {
        const done = () => res();
        img.onload = done;
        img.onerror = done;
      });
    }
    if (img.naturalWidth === 0) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;
    if (!tempCtx) return;

    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    tempCtx.drawImage(img, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const grey = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      const inverted = 255 - grey;
      const final = grey + (inverted - grey) * 0.6;
      pixels[i] = final;
      pixels[i + 1] = final;
      pixels[i + 2] = final;
    }
    tempCtx.putImageData(imageData, 0, 0);

    // Swap to processed data URL and wait until it's ready
    const dataUrl = tempCanvas.toDataURL('image/png');
    await new Promise<void>((res) => {
      const done = () => res();
      img.onload = done;
      img.onerror = done;
      img.src = dataUrl;
      if (img.complete) res();
    });
  } catch (e) {
    console.error('Preprocess logo to grey failed:', e);
  }
}

async function greyifyLogosIn(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  const targets = imgs.filter((img) => {
    const src = img.getAttribute('src') || '';
    return LOGO_MATCHERS.some((m) => src.includes(m));
  });
  await Promise.all(targets.map((img) => greyifyImageElement(img)));
}

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
    
    await greyifyLogosIn(liveEl);
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
      removeContainer: true,
      textAlign: 'auto',
      onclone: async (doc: Document, clonedEl: HTMLElement) => {
        // Find the cloned preview element
        const el = clonedEl;
        if (el) {
          try {
            // Remove box shadow
            el.style.boxShadow = 'none';

            // Apply PDF-specific styles for logo alignment
            const pdfWordmarkOffset = el.querySelector('.pdf-wordmark-offset') as HTMLElement;
            if (pdfWordmarkOffset) {
              pdfWordmarkOffset.style.position = 'relative';
              pdfWordmarkOffset.style.top = '1px';
            }
            
            // Lower the icon by 1px in PDF
            const logoIcon = el.querySelector('img[alt="Time In icon"]') as HTMLElement;
            if (logoIcon) {
              logoIcon.style.position = 'relative';
              logoIcon.style.top = '1px';
            }

            // PRE-PROCESS LOGO IMAGES: Convert to grey at pixel level
            const logoImages = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
            for (const img of logoImages) {
              const src = img.getAttribute('src') || '';
              if (src.includes('8829a351-d8df-4d66-829d-f34b1754bd35') || 
                  src.includes('21706651-e7f7-4eec-b5d7-cd8ccf2a385f')) {
                try {
                  const tempCanvas = doc.createElement('canvas');
                  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                  if (tempCtx && img.complete && img.naturalWidth > 0) {
                    tempCanvas.width = img.naturalWidth;
                    tempCanvas.height = img.naturalHeight;
                    tempCtx.drawImage(img, 0, 0);
                    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                    const pixels = imageData.data;
                    
                    // Apply: grayscale -> brightness(0) -> invert(60%)
                    for (let i = 0; i < pixels.length; i += 4) {
                      const grey = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
                      const inverted = 255 - grey;
                      const final = grey + (inverted - grey) * 0.6;
                      pixels[i] = final;
                      pixels[i + 1] = final;
                      pixels[i + 2] = final;
                    }
                    
                    tempCtx.putImageData(imageData, 0, 0);
                    img.src = tempCanvas.toDataURL('image/png');
                  }
                } catch (err) {
                  console.error('Logo processing error:', err);
                }
              }
            }

            // Force all computed styles to be inline for accurate capture
            const allElements = el.querySelectorAll('*');
            allElements.forEach((element) => {
              const htmlEl = element as HTMLElement;
              const computed = window.getComputedStyle(element);
              
              // Preserve all color properties
              if (computed.color) htmlEl.style.color = computed.color;
              if (computed.backgroundColor) htmlEl.style.backgroundColor = computed.backgroundColor;
              if (computed.opacity) htmlEl.style.opacity = computed.opacity;
              
              // Force muted-foreground text to grey
              if (htmlEl.classList?.contains('text-muted-foreground')) {
                htmlEl.style.color = 'rgb(191, 191, 191)';
              }
              
              // Text rendering - disable all kerning and spacing variations
              if (computed.textAlign) htmlEl.style.textAlign = computed.textAlign;
              if (computed.fontSize) htmlEl.style.fontSize = computed.fontSize;
              if (computed.fontWeight) htmlEl.style.fontWeight = computed.fontWeight;
              if (computed.fontFamily) htmlEl.style.fontFamily = computed.fontFamily;
              if (computed.lineHeight) htmlEl.style.lineHeight = computed.lineHeight;
              
              // CRITICAL FIX: Force zero letter spacing to prevent kerning issues
              htmlEl.style.letterSpacing = '0';
              htmlEl.style.wordSpacing = '0';
              
              if (computed.textTransform) htmlEl.style.textTransform = computed.textTransform;
              if (computed.textDecoration) htmlEl.style.textDecoration = computed.textDecoration;
              if (computed.whiteSpace) htmlEl.style.whiteSpace = computed.whiteSpace;
              if (computed.textShadow && computed.textShadow !== 'none') htmlEl.style.textShadow = computed.textShadow;
              if (computed.textIndent && computed.textIndent !== '0px') htmlEl.style.textIndent = computed.textIndent;
              
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
                // Skip data URLs (already processed logos)
                if (raw.startsWith('data:')) return;
                
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
  
  await greyifyLogosIn(el);
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
    removeContainer: true,
    textAlign: 'auto',
    onclone: async (doc: Document, clonedEl: HTMLElement) => {
      const n = clonedEl;
      if (n) {
        try {
          // Remove box shadow
          n.style.boxShadow = 'none';
          
          // Apply PDF-specific styles for logo alignment
          const pdfWordmarkOffset = n.querySelector('.pdf-wordmark-offset') as HTMLElement;
          if (pdfWordmarkOffset) {
            pdfWordmarkOffset.style.position = 'relative';
            pdfWordmarkOffset.style.top = '1px';
          }
          
          // Lower the icon by 1px in PDF
          const logoIcon = n.querySelector('img[alt="Time In icon"]') as HTMLElement;
          if (logoIcon) {
            logoIcon.style.position = 'relative';
            logoIcon.style.top = '1px';
          }
          
          // PRE-PROCESS LOGO IMAGES: Convert to grey at pixel level
          const logoImages = Array.from(n.querySelectorAll('img')) as HTMLImageElement[];
          for (const img of logoImages) {
            const src = img.getAttribute('src') || '';
            if (src.includes('8829a351-d8df-4d66-829d-f34b1754bd35') || 
                src.includes('21706651-e7f7-4eec-b5d7-cd8ccf2a385f')) {
              try {
                const tempCanvas = doc.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                if (tempCtx && img.complete && img.naturalWidth > 0) {
                  tempCanvas.width = img.naturalWidth;
                  tempCanvas.height = img.naturalHeight;
                  tempCtx.drawImage(img, 0, 0);
                  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                  const pixels = imageData.data;
                  
                  // Apply: grayscale -> brightness(0) -> invert(60%)
                  for (let i = 0; i < pixels.length; i += 4) {
                    const grey = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
                    const inverted = 255 - grey;
                    const final = grey + (inverted - grey) * 0.6;
                    pixels[i] = final;
                    pixels[i + 1] = final;
                    pixels[i + 2] = final;
                  }
                  
                  tempCtx.putImageData(imageData, 0, 0);
                  img.src = tempCanvas.toDataURL('image/png');
                }
              } catch (err) {
                console.error('Logo processing error:', err);
              }
            }
          }
          
          // Force all computed styles to be inline for accurate capture
          const allElements = n.querySelectorAll('*');
          allElements.forEach((element) => {
            const htmlEl = element as HTMLElement;
            const computed = window.getComputedStyle(element);
            
            // Preserve all color properties
            if (computed.color) htmlEl.style.color = computed.color;
            if (computed.backgroundColor) htmlEl.style.backgroundColor = computed.backgroundColor;
            if (computed.opacity) htmlEl.style.opacity = computed.opacity;
            
            // Force muted-foreground text to grey
            if (htmlEl.classList?.contains('text-muted-foreground')) {
              htmlEl.style.color = 'rgb(191, 191, 191)';
            }
            
            // Text rendering - disable all kerning and spacing variations
            if (computed.textAlign) htmlEl.style.textAlign = computed.textAlign;
            if (computed.fontSize) htmlEl.style.fontSize = computed.fontSize;
            if (computed.fontWeight) htmlEl.style.fontWeight = computed.fontWeight;
            if (computed.fontFamily) htmlEl.style.fontFamily = computed.fontFamily;
            if (computed.lineHeight) htmlEl.style.lineHeight = computed.lineHeight;
            
            // CRITICAL FIX: Force zero letter spacing to prevent kerning issues
            htmlEl.style.letterSpacing = '0';
            htmlEl.style.wordSpacing = '0';
            
            if (computed.textTransform) htmlEl.style.textTransform = computed.textTransform;
            if (computed.textDecoration) htmlEl.style.textDecoration = computed.textDecoration;
            if (computed.whiteSpace) htmlEl.style.whiteSpace = computed.whiteSpace;
            if (computed.textShadow && computed.textShadow !== 'none') htmlEl.style.textShadow = computed.textShadow;
            if (computed.textIndent && computed.textIndent !== '0px') htmlEl.style.textIndent = computed.textIndent;
            
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
              // Skip data URLs (already processed logos)
              if (raw.startsWith('data:')) return;
              
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
