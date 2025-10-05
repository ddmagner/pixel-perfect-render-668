import ExcelJS from 'exceljs';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { format } from 'date-fns';
import { formatCurrency, formatHours } from '@/lib/utils';
import { BRAND, FONTS } from '@/utils/documentLayout';

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string; // data:image/png;base64,....
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export async function generateSpreadsheet(
  entries: TimeEntry[],
  settings: AppSettings,
  viewMode: ViewMode
): Promise<Blob> {
  const isInvoice = viewMode === 'invoice';

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(isInvoice ? 'Invoice' : 'Time Card', {
    pageSetup: { 
      paperSize: 'LETTER' as any, 
      orientation: 'portrait', 
      margins: { 
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.5,
        footer: 0.5,
      } 
    },
    views: [{ showGridLines: false }],
  });

  // Fonts
  const fontTitle: Partial<ExcelJS.Font> = { name: 'Helvetica', bold: true, size: FONTS.title, color: { argb: 'FF000000' } };
  const fontMeta: Partial<ExcelJS.Font> = { name: 'Helvetica', size: FONTS.meta, color: { argb: 'FF000000' } };
  const fontHeader: Partial<ExcelJS.Font> = { name: 'Helvetica', bold: true, size: FONTS.header, color: { argb: 'FF000000' } };
  const fontBody: Partial<ExcelJS.Font> = { name: 'Helvetica', size: FONTS.body, color: { argb: 'FF000000' } };
  const fontFooter: Partial<ExcelJS.Font> = { name: 'Helvetica', size: FONTS.footer, color: { argb: 'FF9CA3AF' } };

  const currentDate = new Date();
  const minDate = entries.length > 0 ? new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))) : currentDate;
  const maxDate = entries.length > 0 ? new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))) : currentDate;

  let rowIdx = 1;

  // Title
  sheet.getCell(rowIdx, 1).value = isInvoice ? 'INVOICE' : 'TIME CARD';
  sheet.getCell(rowIdx, 1).font = fontTitle;
  rowIdx += 2;

  // Meta
  if (isInvoice) {
    sheet.getCell(rowIdx++, 1).value = `Invoice Date: ${format(currentDate, 'MM/dd/yy')}`;
    sheet.getCell(rowIdx++, 1).value = `Due Date: ${format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yy')}`;
    sheet.getCell(rowIdx++, 1).value = 'Invoice #001';
  }
  sheet.getCell(rowIdx++, 1).value = `Period: ${format(minDate, 'MM/dd/yy')} - ${format(maxDate, 'MM/dd/yy')}`;
  sheet.getRow(rowIdx - (isInvoice ? 4 : 1)).font = fontMeta;

  rowIdx++;

  // From/To headers
  const fromCol = 1;
  const toCol = 4; // split columns A-C (From) and D-F (To)

  sheet.getCell(rowIdx, fromCol).value = 'FROM';
  sheet.getCell(rowIdx, fromCol).font = fontHeader;
  sheet.getCell(rowIdx, toCol).value = isInvoice ? 'BILL TO' : 'TO';
  sheet.getCell(rowIdx, toCol).font = fontHeader;
  rowIdx++;

  // From values
  const fromLines: string[] = [];
  if (settings.userProfile.name) fromLines.push(settings.userProfile.name);
  if (settings.userProfile.email) fromLines.push(settings.userProfile.email);
  if (settings.userProfile.address) fromLines.push(settings.userProfile.address);
  if (settings.userProfile.city || settings.userProfile.state || settings.userProfile.zipCode) {
    fromLines.push(`${settings.userProfile.city || ''}${settings.userProfile.city && settings.userProfile.state ? ', ' : ''}${settings.userProfile.state || ''}${settings.userProfile.zipCode ? ` ${settings.userProfile.zipCode}` : ''}`);
  }
  if (settings.userProfile.phone) fromLines.push(`Phone: ${settings.userProfile.phone}`);

  fromLines.forEach((l) => {
    sheet.getCell(rowIdx, fromCol).value = l;
    sheet.getCell(rowIdx, fromCol).font = fontBody;
    rowIdx++;
  });

  // Determine primary client (same as preview)
  let primaryClient: any = null;
  if (entries.length > 0) {
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      let name = entry.client || '';
      if (!name) {
        const project = settings.projects.find((p) => p.name === entry.project);
        if (project?.clientId) {
          const client = settings.clients.find((c) => c.id === project.clientId);
          name = client?.name || '';
        }
      }
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    const primaryName = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b), '');
    if (primaryName) primaryClient = settings.clients.find((c) => c.name === primaryName) || null;
  }

  let toRow = rowIdx - fromLines.length; // start row of To
  const addTo = (txt: string) => {
    sheet.getCell(toRow, toCol).value = txt;
    sheet.getCell(toRow, toCol).font = fontBody;
    toRow++;
  };
  if (primaryClient) {
    addTo(primaryClient.name);
    if (primaryClient.attention) addTo(`Attention: ${primaryClient.attention}`);
    if (primaryClient.email) addTo(primaryClient.email);
    if (primaryClient.address) addTo(primaryClient.address);
    if (primaryClient.city || primaryClient.state || primaryClient.zip_code) {
      addTo(`${primaryClient.city || ''}${primaryClient.city && primaryClient.state ? ', ' : ''}${primaryClient.state || ''}${primaryClient.zip_code ? ` ${primaryClient.zip_code}` : ''}`);
    }
  } else {
    addTo('Client Name');
    addTo('Client Company');
    addTo('Client Address Line 1');
    addTo('City, State 12345');
  }

  rowIdx = Math.max(rowIdx, toRow) + 2;

  // Table columns (approximate spans using widths)
  if (isInvoice) {
    sheet.columns = [
      { header: 'DATE', key: 'date', width: 16 },
      { header: 'PROJECT', key: 'project', width: 24 },
      { header: 'TASK', key: 'task', width: 24 },
      { header: 'HOURS', key: 'hours', width: 8 },
      { header: 'RATE', key: 'rate', width: 8 },
      { header: 'AMOUNT', key: 'amount', width: 16 },
    ];
  } else {
    sheet.columns = [
      { header: 'DATE', key: 'date', width: 16 },
      { header: 'PROJECT', key: 'project', width: 24 },
      { header: 'TASK', key: 'task', width: 16 },
      { header: 'HOURS', key: 'hours', width: 8 },
    ];
  }

  // Header styles with top & bottom border
  const headerRow = sheet.getRow(rowIdx);
  (sheet.columns || []).forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = (col as any).header;
    cell.font = fontHeader;
    cell.alignment = { horizontal: idx >= (isInvoice ? 4 : 3) ? 'right' : 'left', vertical: 'middle' };
    cell.border = { top: { style: 'thin', color: { argb: 'FF000000' } }, bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  });
  headerRow.height = 20;
  rowIdx++;

  // Body rows
  let subtotalAmount = 0;
  entries.forEach((entry) => {
    const rate = entry.hourlyRate || 0;
    const amount = entry.duration * rate;
    subtotalAmount += amount;

    const values = isInvoice
      ? [
          format(new Date(entry.date), 'MM/dd/yy'),
          entry.project,
          entry.task,
          formatHours(entry.duration),
          formatCurrency(rate),
          formatCurrency(amount),
        ]
      : [
          format(new Date(entry.date), 'MM/dd/yy'),
          entry.project,
          entry.task,
          formatHours(entry.duration),
        ];

    const row = sheet.getRow(rowIdx);
    values.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v as any;
      c.font = fontBody;
      const align: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left' };
      if (isInvoice && (i === 4 || i === 5)) align.horizontal = 'right';
      c.alignment = align as ExcelJS.Alignment;
    });
    row.height = 20;
    rowIdx++;
  });

  // Totals
  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  rowIdx++;

  // Separator line (top border)
  const sepRow = sheet.getRow(rowIdx);
  for (let i = 1; i <= (sheet.columns?.length || 0); i++) {
    sepRow.getCell(i).border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
  }
  rowIdx++;

  if (isInvoice) {
    // Subtotal
    const labelCol = 3; // align with TASK area like preview
    const hoursCol = 4;
    const amountCol = 6;
    sheet.getCell(rowIdx, labelCol).value = 'Subtotal:';
    sheet.getCell(rowIdx, labelCol).font = fontBody;
    sheet.getCell(rowIdx, hoursCol).value = formatHours(totalHours);
    sheet.getCell(rowIdx, hoursCol).font = fontBody;
    sheet.getCell(rowIdx, amountCol).value = formatCurrency(subtotalAmount);
    sheet.getCell(rowIdx, amountCol).alignment = { horizontal: 'right' };
    sheet.getCell(rowIdx, amountCol).font = fontBody;
    rowIdx++;

    // Taxes
    const taxCalculations = (settings.taxTypes || []).map((t) => ({ name: t.name, rate: t.rate || 0, amount: subtotalAmount * (t.rate || 0) / 100 }));
    let totalTax = 0;
    if (taxCalculations.length === 0) {
      sheet.getCell(rowIdx, labelCol).value = 'Tax (0%):';
      sheet.getCell(rowIdx, amountCol).value = '$0.00';
      sheet.getCell(rowIdx, amountCol).alignment = { horizontal: 'right' };
      rowIdx++;
    } else {
      taxCalculations.forEach((tax) => {
        totalTax += tax.amount;
        sheet.getCell(rowIdx, labelCol).value = `${tax.name} (${tax.rate}%):`;
        sheet.getCell(rowIdx, amountCol).value = formatCurrency(tax.amount);
        sheet.getCell(rowIdx, amountCol).alignment = { horizontal: 'right' };
        rowIdx++;
      });
    }

    // Total Due (thick top border)
    for (let i = 1; i <= (sheet.columns?.length || 0); i++) {
      sheet.getCell(rowIdx, i).border = { top: { style: 'medium', color: { argb: 'FF000000' } } };
    }
    sheet.getCell(rowIdx, labelCol).value = 'Total Due:';
    sheet.getCell(rowIdx, labelCol).font = { ...fontBody, bold: true };
    sheet.getCell(rowIdx, amountCol).value = formatCurrency(subtotalAmount + totalTax);
    sheet.getCell(rowIdx, amountCol).alignment = { horizontal: 'right' };
    sheet.getCell(rowIdx, amountCol).font = { ...fontBody, bold: true };
    rowIdx++;
  } else {
    const labelCol = 3;
    const hoursCol = 4;
    for (let i = 1; i <= (sheet.columns?.length || 0); i++) {
      sheet.getCell(rowIdx, i).border = { top: { style: 'medium', color: { argb: 'FF000000' } } };
    }
    sheet.getCell(rowIdx, labelCol).value = 'Total Hours:';
    sheet.getCell(rowIdx, labelCol).font = { ...fontBody, bold: true };
    sheet.getCell(rowIdx, hoursCol).value = formatHours(totalHours);
    sheet.getCell(rowIdx, hoursCol).font = { ...fontBody, bold: true };
    rowIdx++;
  }

  rowIdx += 2;

  // Footer brand: MADE WITH [icon][wordmark]
  sheet.getCell(rowIdx, 1).value = 'MADE WITH';
  sheet.getCell(rowIdx, 1).font = fontFooter;
  sheet.getRow(rowIdx).height = 14; // ensure enough height for 9px images

  try {
    const [iconB64, wordmarkB64] = await Promise.all([
      fetchAsBase64(BRAND.icon),
      fetchAsBase64(BRAND.wordmark),
    ]);

    const iconId = workbook.addImage({ base64: iconB64, extension: 'png' });
    const wordmarkId = workbook.addImage({ base64: wordmarkB64, extension: 'png' });

    // Position images to align with text baseline and slight gap
    // Using 'absolute' to lock spacing between icon and wordmark
    sheet.addImage(iconId, {
      tl: { col: 1.65, row: rowIdx - 0.70 },
      ext: { width: 9, height: 9 },
      editAs: 'absolute',
    });
    sheet.addImage(wordmarkId, {
      tl: { col: 1.86, row: rowIdx - 0.70 },
      ext: { width: 48, height: 9 },
      editAs: 'absolute',
    });
  } catch (e) {
    // If image embedding fails, we still keep the text footer
  }

  // Save workbook
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
