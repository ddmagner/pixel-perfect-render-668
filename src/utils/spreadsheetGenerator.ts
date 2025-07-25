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
  
  // Prepare data for spreadsheet
  const data: any[] = [];
  
  // Add headers
  const headers = viewMode === 'invoice' 
    ? ['Date', 'Task', 'Project', 'Client', 'Hours', 'Rate', 'Amount']
    : ['Date', 'Task', 'Project', 'Client', 'Hours'];
  
  data.push(headers);
  
  // Add user info if available
  if (settings.userProfile.name || settings.userProfile.email) {
    data.push([]); // Empty row
    if (settings.userProfile.name) data.push(['Name:', settings.userProfile.name]);
    if (settings.userProfile.email) data.push(['Email:', settings.userProfile.email]);
    data.push([]); // Empty row
  }
  
  // Add entries
  entries.forEach(entry => {
    const taskType = settings.taskTypes.find(t => t.name === entry.task);
    const rate = taskType?.hourlyRate || 0;
    const amount = entry.duration * rate;
    
    const project = settings.projects.find(p => p.name === entry.project);
    const client = project?.clientId 
      ? settings.clients.find(c => c.id === project.clientId)?.name || ''
      : '';
    
    const row = [
      format(new Date(entry.date), 'MM/dd/yyyy'),
      entry.task,
      entry.project,
      client,
      entry.duration
    ];
    
    if (viewMode === 'invoice') {
      row.push(rate, amount);
    }
    
    data.push(row);
  });
  
  // Add totals
  data.push([]); // Empty row
  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  
  if (viewMode === 'invoice') {
    const totalAmount = entries.reduce((sum, entry) => {
      const taskType = settings.taskTypes.find(t => t.name === entry.task);
      const rate = taskType?.hourlyRate || 0;
      return sum + (entry.duration * rate);
    }, 0);
    
    data.push(['', '', '', 'TOTAL:', totalHours, '', totalAmount]);
  } else {
    data.push(['', '', 'TOTAL:', '', totalHours]);
  }
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Auto-size columns
  const colWidths = headers.map(() => ({ wch: 15 }));
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, viewMode === 'invoice' ? 'Invoice' : 'Time Report');
  
  // Generate file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}