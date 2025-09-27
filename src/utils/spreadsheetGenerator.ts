import * as XLSX from 'xlsx';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { format } from 'date-fns';

export async function generateSpreadsheet(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode
): Promise<Blob> {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data for spreadsheet matching InvoicePreview layout
  const data: any[] = [];
  
  // Title
  data.push([viewMode === 'invoice' ? 'INVOICE' : 'TIME CARD']);
  data.push([]); // Empty row
  
  // Date and period info
  const currentDate = new Date();
  const minDate = entries.length > 0 ? new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))) : currentDate;
  const maxDate = entries.length > 0 ? new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))) : currentDate;
  
  if (viewMode === 'invoice') {
    data.push([`Invoice Date: ${format(currentDate, 'MM/dd/yy')}`]);
    data.push([`Due Date: ${format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yy')}`]);
    data.push(['Invoice #001']);
  }
  data.push([`Period: ${format(minDate, 'MM/dd/yy')} - ${format(maxDate, 'MM/dd/yy')}`]);
  data.push([]); // Empty row
  
  // From section
  data.push(['FROM']);
  if (settings.userProfile.name) data.push([settings.userProfile.name]);
  if (settings.userProfile.email) data.push([settings.userProfile.email]);
  if (settings.userProfile.address) data.push([settings.userProfile.address]);
  if (settings.userProfile.city || settings.userProfile.state || settings.userProfile.zipCode) {
    const location = `${settings.userProfile.city || ''}${settings.userProfile.city && settings.userProfile.state ? ', ' : ''}${settings.userProfile.state || ''}${settings.userProfile.zipCode ? ` ${settings.userProfile.zipCode}` : ''}`;
    data.push([location]);
  }
  if (settings.userProfile.phone) data.push([`Phone: ${settings.userProfile.phone}`]);
  data.push([]); // Empty row
  
  // To section - Find primary client
  data.push([viewMode === 'invoice' ? 'BILL TO' : 'TO']);
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

  if (primaryClient) {
    data.push([primaryClient.name]);
    if (primaryClient.attention) data.push([`Attention: ${primaryClient.attention}`]);
    if (primaryClient.email) data.push([primaryClient.email]);
    if (primaryClient.address) data.push([primaryClient.address]);
    if (primaryClient.city || primaryClient.state || primaryClient.zip_code) {
      const clientLocation = `${primaryClient.city || ''}${primaryClient.city && primaryClient.state ? ', ' : ''}${primaryClient.state || ''}${primaryClient.zip_code ? ` ${primaryClient.zip_code}` : ''}`;
      data.push([clientLocation]);
    }
  } else {
    data.push(['Client Name']);
    data.push(['Client Company']);
    data.push(['Client Address Line 1']);
    data.push(['City, State 12345']);
  }
  
  data.push([]); // Empty row
  
  // Table headers
  const headers = viewMode === 'invoice' 
    ? ['Date', 'Project', 'Task', 'Hours', 'Rate', 'Amount']
    : ['Date', 'Project', 'Task', 'Hours'];
  
  data.push(headers);
  
  // Add entries
  let subtotalAmount = 0;
  entries.forEach(entry => {
    const rate = entry.hourlyRate || 0;
    const amount = entry.duration * rate;
    subtotalAmount += amount;
    
    const row = [
      format(new Date(entry.date), 'MM/dd/yy'),
      entry.project,
      entry.task,
      entry.duration
    ];
    
    if (viewMode === 'invoice') {
      row.push(rate, amount);
    }
    
    data.push(row);
  });
  
  data.push([]); // Empty row
  
  // Totals section
  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  
  if (viewMode === 'invoice') {
    // Subtotal
    const subtotalRow = ['', '', 'Subtotal:', totalHours, '', subtotalAmount];
    data.push(subtotalRow);
    
    // Tax calculations
    const taxCalculations = (settings.taxTypes || []).map(taxType => ({
      name: taxType.name,
      rate: taxType.rate || 0,
      amount: subtotalAmount * (taxType.rate || 0) / 100
    }));
    
    const totalTaxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);
    
    if (taxCalculations.length === 0) {
      data.push(['', '', 'Tax (0%):', '', '', 0]);
    } else {
      taxCalculations.forEach(tax => {
        data.push(['', '', `${tax.name} (${tax.rate}%):`, '', '', tax.amount]);
      });
    }
    
    // Total
    data.push(['', '', 'Total Due:', '', '', subtotalAmount + totalTaxAmount]);
  } else {
    data.push(['', '', 'Total Hours:', totalHours]);
  }
  
  data.push([]); // Empty row
  data.push(['MADE WITH TIME IN']);
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Auto-size columns
  const colWidths = headers.map(() => ({ wch: 15 }));
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, viewMode === 'invoice' ? 'Invoice' : 'Time Card');
  
  // Generate file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}