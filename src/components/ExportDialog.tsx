import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { generatePDF } from '@/utils/pdfGenerator';
import { generateSpreadsheet } from '@/utils/spreadsheetGenerator';
import { Share } from '@capacitor/share';
import { format } from 'date-fns';
import { FileText, FileSpreadsheet, Share2, Printer, X } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntries: TimeEntry[];
  settings: AppSettings;
  viewMode: ViewMode;
}

type FileFormat = 'pdf' | 'spreadsheet';
type ExportMethod = 'download' | 'share' | 'print';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  timeEntries,
  settings,
  viewMode
}) => {
  const [fileFormat, setFileFormat] = useState<FileFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (method: ExportMethod) => {
    if (timeEntries.length === 0) {
      alert('No time entries to export');
      return;
    }

    setIsExporting(true);
    
    try {
      let blob: Blob;
      let fileName: string;

      if (fileFormat === 'pdf') {
        blob = await generatePDF(timeEntries, settings, viewMode);
        fileName = `time-${viewMode}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      } else {
        blob = await generateSpreadsheet(timeEntries, settings, viewMode);
        fileName = `time-${viewMode}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      }

      const url = URL.createObjectURL(blob);

      switch (method) {
        case 'download':
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          break;

        case 'share':
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
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="mx-0 border-none bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Export/Share/Print</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Format Selection */}
          <div className="flex gap-3">
            <Button
              variant={fileFormat === 'pdf' ? 'default' : 'outline'}
              onClick={() => setFileFormat('pdf')}
              className="flex-1 h-14 text-base font-medium"
              style={fileFormat === 'pdf' ? { backgroundColor: settings.accentColor, color: 'white' } : {}}
            >
              <FileText className="h-5 w-5 mr-2" />
              PDF
            </Button>
            <Button
              variant={fileFormat === 'spreadsheet' ? 'default' : 'outline'}
              onClick={() => setFileFormat('spreadsheet')}
              className="flex-1 h-14 text-base font-medium"
              style={fileFormat === 'spreadsheet' ? { backgroundColor: settings.accentColor, color: 'white' } : {}}
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Excel
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-2">
            <Button
              variant="outline"
              onClick={() => handleExport('download')}
              disabled={isExporting}
              className="flex-1 h-20 flex flex-col items-center justify-center gap-2 border-2"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm font-medium">Save</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('share')}
              disabled={isExporting}
              className="flex-1 h-20 flex flex-col items-center justify-center gap-2 border-2"
            >
              <Share2 className="h-6 w-6" />
              <span className="text-sm font-medium">Share</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('print')}
              disabled={isExporting}
              className="flex-1 h-20 flex flex-col items-center justify-center gap-2 border-2"
            >
              <Printer className="h-6 w-6" />
              <span className="text-sm font-medium">Print</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};