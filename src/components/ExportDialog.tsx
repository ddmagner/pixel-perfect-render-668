import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { generatePDF } from '@/utils/pdfGenerator';
import { generateSpreadsheet } from '@/utils/spreadsheetGenerator';
import { Share } from '@capacitor/share';
import { format } from 'date-fns';
import { FileText, FileSpreadsheet, Download, Mail, Printer } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntries: TimeEntry[];
  settings: AppSettings;
  viewMode: ViewMode;
}

type FileFormat = 'pdf' | 'spreadsheet';
type ExportMethod = 'download' | 'email' | 'print';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  timeEntries,
  settings,
  viewMode
}) => {
  const [fileFormat, setFileFormat] = useState<FileFormat>('pdf');
  const [exportMethod, setExportMethod] = useState<ExportMethod>('download');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (timeEntries.length === 0) {
      alert('No time entries to export');
      return;
    }

    setIsExporting(true);
    
    try {
      let blob: Blob;
      let fileName: string;
      let mimeType: string;

      if (fileFormat === 'pdf') {
        blob = await generatePDF(timeEntries, settings, viewMode);
        fileName = `time-${viewMode}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        mimeType = 'application/pdf';
      } else {
        blob = await generateSpreadsheet(timeEntries, settings, viewMode);
        fileName = `time-${viewMode}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      const url = URL.createObjectURL(blob);

      switch (exportMethod) {
        case 'download':
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          break;

        case 'email':
          if (await Share.canShare()) {
            await Share.share({
              title: fileName,
              text: `Time ${viewMode} report`,
              url: url
            });
          } else {
            // Fallback: create mailto link
            const subject = encodeURIComponent(`Time ${viewMode} Report`);
            const body = encodeURIComponent(`Please find attached the time ${viewMode} report.`);
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
          }
          break;

        case 'print':
          if (fileFormat === 'pdf') {
            // Open PDF in new window for printing
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
              newWindow.onload = () => {
                newWindow.print();
              };
            }
          } else {
            // For spreadsheets, download and inform user to print from app
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            alert('Spreadsheet downloaded. Please open it in your preferred app to print.');
          }
          break;
      }

      URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#09121F] font-bold">
            Export {viewMode === 'invoice' ? 'Invoice' : 'Time Report'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#09121F]">File Format</Label>
            <RadioGroup value={fileFormat} onValueChange={(value) => setFileFormat(value as FileFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spreadsheet" id="spreadsheet" />
                <Label htmlFor="spreadsheet" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel Spreadsheet
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#09121F]">Export Method</Label>
            <RadioGroup value={exportMethod} onValueChange={(value) => setExportMethod(value as ExportMethod)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="download" id="download" />
                <Label htmlFor="download" className="flex items-center gap-2 cursor-pointer">
                  <Download className="h-4 w-4" />
                  Download to Device
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Share via Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="print" />
                <Label htmlFor="print" className="flex items-center gap-2 cursor-pointer">
                  <Printer className="h-4 w-4" />
                  Print
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1 text-white"
              style={{ backgroundColor: settings.accentColor }}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};