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
      <DrawerContent className="p-0">
        <DrawerHeader className="flex flex-row items-center justify-between p-4 pb-0">
          <DrawerTitle className="text-lg font-semibold text-foreground">
            Export/Share/Print
          </DrawerTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>
        
        <div className="p-4 space-y-4">
          {/* File Format Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Choose format</h3>
            <div className="flex gap-2">
              <Button
                variant={fileFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFileFormat('pdf')}
                className="flex-1 h-12 flex items-center gap-2"
                style={fileFormat === 'pdf' ? { backgroundColor: settings.accentColor } : {}}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant={fileFormat === 'spreadsheet' ? 'default' : 'outline'}
                onClick={() => setFileFormat('spreadsheet')}
                className="flex-1 h-12 flex items-center gap-2"
                style={fileFormat === 'spreadsheet' ? { backgroundColor: settings.accentColor } : {}}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>

          {/* Export Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Export options</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('download')}
                disabled={isExporting}
                className="h-16 flex flex-col items-center gap-1 p-2"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Save</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('share')}
                disabled={isExporting}
                className="h-16 flex flex-col items-center gap-1 p-2"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Share</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('print')}
                disabled={isExporting}
                className="h-16 flex flex-col items-center gap-1 p-2"
              >
                <Printer className="h-5 w-5" />
                <span className="text-xs">Print</span>
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};