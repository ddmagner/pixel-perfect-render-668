import jsPDF from 'jspdf';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { format } from 'date-fns';
import { PAGE, HEADERS, GRID_SPANS, OFFSETS, FONTS, BRAND } from './documentLayout';

export async function generatePDF(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode
): Promise<Blob> {
  const pdf = new jsPDF({
    unit: PAGE.unit,
    format: PAGE.format,
  });

  // Calculate page dimensions to match preview exactly
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (PAGE.marginX * 2);
  let y = PAGE.marginY;
  
  // Use exact grid system from preview
  const isInvoice = viewMode === 'invoice';
  const spans = isInvoice ? GRID_SPANS.invoice : GRID_SPANS.timecard;
  const totalSpans = spans.reduce((sum, span) => sum + span, 0);
  const columnWidths = spans.map(span => (contentWidth * span) / totalSpans);

  // Title - match preview exactly (text-3xl font-bold)
  pdf.setFontSize(24); // 3xl = 24px
  pdf.setFont('helvetica', 'bold');
  const title = viewMode === 'invoice' ? 'Invoice' : 'Time Card';
  pdf.text(title, PAGE.marginX, y);
  y += 36; // Spacing to match preview

  // Date range - match preview exactly (text-sm text-muted-foreground)
  pdf.setFontSize(12); // sm = 12px
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(115, 115, 115); // muted-foreground color
  const dateRange = `${format(new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))), 'MMM d, yyyy')} - ${format(new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))), 'MMM d, yyyy')}`;
  pdf.text(dateRange, PAGE.marginX, y);
  pdf.setTextColor(0, 0, 0); // Reset to black
  y += 48; // Spacing to match preview

  // From/To sections in two columns - match preview grid exactly (grid-cols-2)
  const leftColWidth = contentWidth * 0.5;
  const rightColWidth = contentWidth * 0.5;
  const rightColX = PAGE.marginX + leftColWidth;
  
  // FROM section - match preview styling
  pdf.setFontSize(10); // text-xs
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(115, 115, 115); // muted-foreground
  pdf.text('FROM', PAGE.marginX, y);
  let fromY = y + 18; // Spacing to match preview
  
  pdf.setFontSize(12); // text-sm
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0); // Reset to black
  if (settings.userProfile.name) {
    pdf.text(settings.userProfile.name, PAGE.marginX, fromY);
    fromY += 16; // Line height to match preview
  }
  if (settings.userProfile.address) {
    pdf.text(settings.userProfile.address, PAGE.marginX, fromY);
    fromY += 16;
  }
  if (settings.userProfile.email) {
    pdf.text(settings.userProfile.email, PAGE.marginX, fromY);
    fromY += 16;
  }
  if (settings.userProfile.phone) {
    pdf.text(settings.userProfile.phone, PAGE.marginX, fromY);
    fromY += 16;
  }
  
  // TO section - match preview styling
  pdf.setFontSize(10); // text-xs
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(115, 115, 115); // muted-foreground
  const toLabel = viewMode === 'invoice' ? 'BILL TO' : 'TO';
  pdf.text(toLabel, rightColX, y);
  let toY = y + 18; // Spacing to match preview
  
  pdf.setFontSize(12); // text-sm
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0); // Reset to black
  
  // Find primary client
  const clientCounts = entries.reduce((acc, entry) => {
    acc[entry.client] = (acc[entry.client] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const primaryClient = Object.entries(clientCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown Client';
  
  pdf.text(primaryClient, rightColX, toY);
  
  y = Math.max(fromY, toY) + 32; // Spacing to match preview

  // Table headers - match preview grid exactly
  const headers = viewMode === 'invoice' ? HEADERS.invoice : HEADERS.timecard;
  
  // Header background - match preview border
  pdf.setFillColor(248, 249, 250); // border color from preview
  pdf.rect(PAGE.marginX, y - 8, contentWidth, 24, 'F');
  
  pdf.setFontSize(10); // text-xs
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(115, 115, 115); // muted-foreground
  
  let x = PAGE.marginX + 8; // Padding to match preview
  headers.forEach((header, index) => {
    pdf.text(header, x, y + 6); // Vertical centering
    x += columnWidths[index];
  });
  
  pdf.setTextColor(0, 0, 0); // Reset to black
  y += 32; // Spacing to match preview

  // Table rows - match preview exactly with alternating backgrounds
  pdf.setFontSize(12); // text-sm
  pdf.setFont('helvetica', 'normal');
  
  entries.forEach((entry, index) => {
    // Alternating row backgrounds to match preview
    if (index % 2 === 1) {
      pdf.setFillColor(249, 250, 251); // even row background
      pdf.rect(PAGE.marginX, y - 6, contentWidth, 20, 'F');
    }
    
    let x = PAGE.marginX + 8; // Padding to match preview
    const rowData = viewMode === 'invoice' 
      ? [
          format(new Date(entry.date), 'MMM d'),
          entry.project,
          entry.task,
          entry.duration.toString(),
          `$${entry.hourlyRate?.toFixed(2) || '0.00'}`,
          `$${((entry.duration * (entry.hourlyRate || 0))).toFixed(2)}`
        ]
      : [
          format(new Date(entry.date), 'MMM d'),
          entry.project,
          entry.task,
          entry.duration.toString()
        ];
    
    rowData.forEach((data, index) => {
      // Apply text alignment and offsets to match preview
      let textX = x;
      if (viewMode === 'invoice' && index === 2) {
        textX += OFFSETS.invoice.task; // Task column offset
      }
      if (viewMode === 'invoice' && index === 4) {
        textX += OFFSETS.invoice.ratePadding; // Rate column padding
      }
      
      pdf.text(data, textX, y + 2); // Vertical centering
      x += columnWidths[index];
    });
    
    y += 20; // Row height to match preview
  });

  y += 24; // Spacing to match preview
  
  // Totals section - match preview exactly
  if (viewMode === 'invoice') {
    const subtotal = entries.reduce((sum, entry) => sum + (entry.duration * (entry.hourlyRate || 0)), 0);
    const taxCalculations = (settings.taxTypes || []).map(taxType => ({
      name: taxType.name,
      rate: taxType.rate || 0,
      amount: subtotal * (taxType.rate || 0) / 100
    }));
    const taxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + taxAmount;
    
    // Right-align totals to match preview layout
    const totalsX = PAGE.marginX + contentWidth - 120;
    const labelX = totalsX - 60;
    
    pdf.setFontSize(12); // text-sm
    pdf.setFont('helvetica', 'normal');
    
    // Subtotal
    pdf.text('Subtotal:', labelX, y);
    pdf.text(`$${subtotal.toFixed(2)}`, totalsX, y, { align: 'right' });
    y += 20;
    
    // Tax (if applicable)
    if (taxCalculations.length === 0) {
      pdf.text('Tax (0%):', labelX, y);
      pdf.text('$0.00', totalsX, y, { align: 'right' });
      y += 20;
    } else {
      taxCalculations.forEach(tax => {
        pdf.text(`${tax.name} (${tax.rate}%):`, labelX, y);
        pdf.text(`$${tax.amount.toFixed(2)}`, totalsX, y, { align: 'right' });
        y += 20;
      });
    }
    
    // Total with border to match preview
    pdf.setDrawColor(229, 231, 235); // border color
    pdf.line(labelX - 8, y - 8, totalsX + 8, y - 8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', labelX, y + 8);
    pdf.text(`$${total.toFixed(2)}`, totalsX, y + 8, { align: 'right' });
    y += 28;
  } else {
    // Total hours for time card mode
    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalsX = PAGE.marginX + contentWidth - 80;
    const labelX = totalsX - 80;
    
    pdf.setDrawColor(229, 231, 235); // border color
    pdf.line(labelX - 8, y - 8, totalsX + 8, y - 8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Hours:', labelX, y + 8);
    pdf.text(totalHours.toString(), totalsX, y + 8, { align: 'right' });
    y += 28;
  }

  // Footer with branding - match preview exactly
  const footerY = pageHeight - 40;
  pdf.setFontSize(8); // Very small to match preview
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(156, 163, 175); // text-gray-400 to match preview
  
  // "MADE WITH" text centered
  const madeWithText = 'MADE WITH ';
  const textWidth = pdf.getTextWidth(madeWithText);
  const logoSize = 10; // Smaller to match preview
  const wordmarkWidth = 24;
  const totalWidth = textWidth + logoSize + wordmarkWidth + 8; // 8 for spacing
  const startX = (pageWidth - totalWidth) / 2;
  
  pdf.text(madeWithText, startX, footerY);
  
  // TIME IN icon
  try {
    pdf.addImage(BRAND.icon, 'PNG', startX + textWidth, footerY - 7, logoSize, logoSize);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
  }
  
  // TIME IN wordmark
  try {
    pdf.addImage(BRAND.wordmark, 'PNG', startX + textWidth + logoSize + 4, footerY - 5, wordmarkWidth, 6);
  } catch (error) {
    console.warn('Could not add wordmark to PDF:', error);
  }

  return pdf.output('blob');
}