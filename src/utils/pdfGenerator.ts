import jsPDF from 'jspdf';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { format } from 'date-fns';

export async function generatePDF(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode
): Promise<Blob> {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(viewMode === 'invoice' ? 'Invoice' : 'Time Report', 20, 20);
  
  // Add user info
  doc.setFontSize(12);
  let yPos = 40;
  if (settings.userProfile.name) {
    doc.text(`Name: ${settings.userProfile.name}`, 20, yPos);
    yPos += 10;
  }
  if (settings.userProfile.email) {
    doc.text(`Email: ${settings.userProfile.email}`, 20, yPos);
    yPos += 10;
  }
  
  // Add entries
  yPos += 10;
  doc.setFontSize(14);
  doc.text('Time Entries:', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  entries.forEach(entry => {
    const taskType = settings.taskTypes.find(t => t.name === entry.task);
    const rate = taskType?.hourlyRate || 0;
    const amount = entry.duration * rate;
    
    doc.text(`${entry.task} - ${entry.project}`, 20, yPos);
    doc.text(`${entry.duration}h`, 120, yPos);
    if (viewMode === 'invoice') {
      doc.text(`$${amount.toFixed(2)}`, 160, yPos);
    }
    doc.text(format(new Date(entry.date), 'MMM d, yyyy'), 200, yPos);
    yPos += 10;
  });
  
  // Add totals
  yPos += 10;
  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalAmount = entries.reduce((sum, entry) => {
    const taskType = settings.taskTypes.find(t => t.name === entry.task);
    const rate = taskType?.hourlyRate || 0;
    return sum + (entry.duration * rate);
  }, 0);
  
  doc.setFontSize(12);
  doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 20, yPos);
  if (viewMode === 'invoice') {
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 120, yPos);
  }
  
  return doc.output('blob');
}