import jsPDF from 'jspdf';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { format } from 'date-fns';
import { formatCurrency, formatHours } from '@/lib/utils';

export async function generatePDF(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode
): Promise<Blob> {
  console.log('PDF Generator - Starting generation with:', { 
    entriesCount: entries.length, 
    viewMode, 
    userProfile: settings.userProfile 
  });
  
  const doc = new jsPDF();
  console.log('jsPDF instance created');
  
  // Document title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(viewMode === 'invoice' ? 'INVOICE' : 'TIME CARD', 20, 25);
  
  // Date and period info
  const currentDate = new Date();
  const minDate = entries.length > 0 ? new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))) : currentDate;
  const maxDate = entries.length > 0 ? new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))) : currentDate;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 35;
  
  if (viewMode === 'invoice') {
    doc.text(`Invoice Date: ${format(currentDate, 'MM/dd/yy')}`, 20, yPos);
    yPos += 7;
    doc.text(`Due Date: ${format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yy')}`, 20, yPos);
    yPos += 7;
    doc.text('Invoice #001', 20, yPos);
    yPos += 7;
  }
  
  doc.text(`Period: ${format(minDate, 'MM/dd/yy')} - ${format(maxDate, 'MM/dd/yy')}`, 20, yPos);
  yPos += 15;

  // From/To sections
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', 20, yPos);
  doc.text(viewMode === 'invoice' ? 'BILL TO' : 'TO', 120, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const fromYStart = yPos;
  
  // From section
  if (settings.userProfile.name) {
    doc.text(settings.userProfile.name, 20, yPos);
    yPos += 5;
  }
  if (settings.userProfile.email) {
    doc.text(settings.userProfile.email, 20, yPos);
    yPos += 5;
  }
  if (settings.userProfile.address) {
    doc.text(settings.userProfile.address, 20, yPos);
    yPos += 5;
  }
  if (settings.userProfile.city || settings.userProfile.state || settings.userProfile.zipCode) {
    const location = `${settings.userProfile.city || ''}${settings.userProfile.city && settings.userProfile.state ? ', ' : ''}${settings.userProfile.state || ''}${settings.userProfile.zipCode ? ` ${settings.userProfile.zipCode}` : ''}`;
    doc.text(location, 20, yPos);
    yPos += 5;
  }
  if (settings.userProfile.phone) {
    doc.text(`Phone: ${settings.userProfile.phone}`, 20, yPos);
  }

  // To section - Find primary client
  let primaryClient = null;
  if (entries.length > 0) {
    const clientCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      let clientName = entry.client || '';
      if (!clientName) {
        const project = settings.projects.find(p => p.name === entry.project);
        if (project?.clientId) {
          const client = settings.clients.find(c => c.id === project.clientId);
          clientName = client?.name || '';
        }
      }
      if (clientName) {
        clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
      }
    });
    
    const primaryClientName = Object.keys(clientCounts).reduce((a, b) => 
      clientCounts[a] > clientCounts[b] ? a : b, '');
    
    if (primaryClientName) {
      primaryClient = settings.clients.find(c => c.name === primaryClientName);
    }
  }

  let toYPos = fromYStart;
  if (primaryClient) {
    doc.text(primaryClient.name, 120, toYPos);
    toYPos += 5;
    if (primaryClient.attention) {
      doc.text(`Attention: ${primaryClient.attention}`, 120, toYPos);
      toYPos += 5;
    }
    if (primaryClient.email) {
      doc.text(primaryClient.email, 120, toYPos);
      toYPos += 5;
    }
    if (primaryClient.address) {
      doc.text(primaryClient.address, 120, toYPos);
      toYPos += 5;
    }
    if (primaryClient.city || primaryClient.state || primaryClient.zip_code) {
      const clientLocation = `${primaryClient.city || ''}${primaryClient.city && primaryClient.state ? ', ' : ''}${primaryClient.state || ''}${primaryClient.zip_code ? ` ${primaryClient.zip_code}` : ''}`;
      doc.text(clientLocation, 120, toYPos);
    }
  } else {
    doc.text('Client Name', 120, toYPos);
    toYPos += 5;
    doc.text('Client Company', 120, toYPos);
    toYPos += 5;
    doc.text('Client Address Line 1', 120, toYPos);
    toYPos += 5;
    doc.text('City, State 12345', 120, toYPos);
  }

  yPos = Math.max(yPos, toYPos) + 15;

  // Table header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.line(20, yPos, 190, yPos); // Top border
  yPos += 5;
  
  if (viewMode === 'invoice') {
    doc.text('DATE', 20, yPos);
    doc.text('PROJECT', 40, yPos);
    doc.text('TASK', 80, yPos);
    doc.text('HOURS', 120, yPos);
    doc.text('RATE', 140, yPos);
    doc.text('AMOUNT', 165, yPos, { align: 'right' });
  } else {
    doc.text('DATE', 20, yPos);
    doc.text('PROJECT', 45, yPos);
    doc.text('TASK', 95, yPos);
    doc.text('HOURS', 145, yPos);
  }
  
  yPos += 3;
  doc.line(20, yPos, 190, yPos); // Bottom header border
  yPos += 8;

  // Table entries
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  let subtotalAmount = 0;
  
  entries.forEach(entry => {
    const rate = entry.hourlyRate || 0;
    const amount = entry.duration * rate;
    subtotalAmount += amount;
    
    if (viewMode === 'invoice') {
      doc.text(format(new Date(entry.date), 'MM/dd/yy'), 20, yPos);
      doc.text(entry.project, 40, yPos);
      doc.text(entry.task, 80, yPos);
      doc.text(formatHours(entry.duration), 120, yPos);
      doc.text(formatCurrency(rate), 140, yPos);
      doc.text(formatCurrency(amount), 185, yPos, { align: 'right' });
    } else {
      doc.text(format(new Date(entry.date), 'MM/dd/yy'), 20, yPos);
      doc.text(entry.project, 45, yPos);
      doc.text(entry.task, 95, yPos);
      doc.text(formatHours(entry.duration), 145, yPos);
    }
    yPos += 7;
  });

  // Totals section
  yPos += 5;
  doc.line(20, yPos, 190, yPos); // Separator line
  yPos += 8;

  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);

  if (viewMode === 'invoice') {
    // Subtotal
    doc.text('Subtotal:', 120, yPos);
    doc.text(formatHours(totalHours), 140, yPos);
    doc.text(formatCurrency(subtotalAmount), 185, yPos, { align: 'right' });
    yPos += 7;
    
    // Tax calculations
    const taxCalculations = (settings.taxTypes || []).map(taxType => ({
      name: taxType.name,
      rate: taxType.rate || 0,
      amount: subtotalAmount * (taxType.rate || 0) / 100
    }));
    
    const totalTaxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);
    
    if (taxCalculations.length === 0) {
      doc.text('Tax (0%):', 120, yPos);
      doc.text('$0.00', 185, yPos, { align: 'right' });
      yPos += 7;
    } else {
      taxCalculations.forEach(tax => {
        doc.text(`${tax.name} (${tax.rate}%):`, 120, yPos);
        doc.text(formatCurrency(tax.amount), 185, yPos, { align: 'right' });
        yPos += 7;
      });
    }
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.line(120, yPos, 190, yPos); // Total line
    yPos += 5;
    doc.text('Total Due:', 120, yPos);
    doc.text(formatCurrency(subtotalAmount + totalTaxAmount), 185, yPos, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.line(120, yPos, 190, yPos); // Total line
    yPos += 5;
    doc.text('Total Hours:', 120, yPos);
    doc.text(formatHours(totalHours), 145, yPos);
  }

  // Footer
  yPos = 280; // Near bottom of page
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('MADE WITH TIME IN', 20, yPos);

  console.log('PDF generation complete, creating blob...');
  const blob = doc.output('blob');
  console.log('Blob created with size:', blob.size);
  return blob;
}