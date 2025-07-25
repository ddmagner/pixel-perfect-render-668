import React, { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { generatePDF } from '@/utils/pdfGenerator';
import { generateSpreadsheet } from '@/utils/spreadsheetGenerator';
import { Share } from '@capacitor/share';
import { format } from 'date-fns';
import { X, Download, Mail, Printer } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntries: TimeEntry[];
  settings: AppSettings;
  viewMode: ViewMode;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  timeEntries,
  settings,
  viewMode
}) => {
  const [isPdfFormat, setIsPdfFormat] = useState(true);
  const [downloadToDevice, setDownloadToDevice] = useState(true);
  const [shareViaEmail, setShareViaEmail] = useState(false);
  const [printDocument, setPrintDocument] = useState(false);
  const [fileName, setFileName] = useState(`${settings.userProfile.name || 'User'} Time Report ${format(new Date(), 'yyyy-MM-dd')}`);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (timeEntries.length === 0) {
      alert('No time entries to export');
      return;
    }

    if (!downloadToDevice && !shareViaEmail && !printDocument) {
      alert('Please select at least one export method');
      return;
    }

    setIsExporting(true);
    
    try {
      let blob: Blob;
      let fileExtension: string;

      if (isPdfFormat) {
        blob = await generatePDF(timeEntries, settings, viewMode);
        fileExtension = 'pdf';
      } else {
        blob = await generateSpreadsheet(timeEntries, settings, viewMode);
        fileExtension = 'xlsx';
      }

      const finalFileName = `${fileName}.${fileExtension}`;
      const url = URL.createObjectURL(blob);

      if (downloadToDevice) {
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      if (shareViaEmail) {
        if (await Share.canShare()) {
          await Share.share({
            title: finalFileName,
            text: `Time ${viewMode} report`,
            url: url
          });
        } else {
          const subject = encodeURIComponent(`Time ${viewMode} Report`);
          const body = encodeURIComponent(`Please find attached the time ${viewMode} report.`);
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        }
      }

      if (printDocument) {
        if (isPdfFormat) {
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            newWindow.onload = () => {
              newWindow.print();
            };
          }
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = finalFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          alert('Spreadsheet downloaded. Please open it in your preferred app to print.');
        }
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
      <DrawerContent className="mx-0 border-none bg-background rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">Export/Share/Print</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Format Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium font-gilroy ${isPdfFormat ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>PDF Document</span>
              <button 
                onClick={() => setIsPdfFormat(!isPdfFormat)} 
                className={`w-12 h-6 rounded-full transition-colors ${!isPdfFormat ? 'bg-[#09121F]' : 'bg-[#BFBFBF]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${!isPdfFormat ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium font-gilroy ${!isPdfFormat ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>Excel Spreadsheet</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Export Method</h3>
            
            {/* Export Methods */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5" />
                  <span className="text-base">Download to device</span>
                </div>
                <Checkbox 
                  checked={downloadToDevice}
                  onCheckedChange={(checked) => setDownloadToDevice(checked === true)}
                  className="h-6 w-6 rounded-none border-2 border-foreground data-[state=checked]:bg-foreground"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5" />
                  <span className="text-base">Share via email</span>
                </div>
                <Checkbox 
                  checked={shareViaEmail}
                  onCheckedChange={(checked) => setShareViaEmail(checked === true)}
                  className="h-6 w-6 rounded-none border-2 border-foreground data-[state=checked]:bg-foreground"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Printer className="h-5 w-5" />
                  <span className="text-base">Print</span>
                </div>
                <Checkbox 
                  checked={printDocument}
                  onCheckedChange={(checked) => setPrintDocument(checked === true)}
                  className="h-6 w-6 rounded-none border-2 border-foreground data-[state=checked]:bg-foreground"
                />
              </div>
            </div>
          </div>

          {/* Save As */}
          <div className="border-t pt-6">
            <div className="space-y-3">
              <label className="text-base font-medium">Save as</label>
              <Input 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="h-12 text-base bg-muted rounded-none border-foreground"
                placeholder="Enter filename"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base font-medium rounded-none border-2 border-foreground"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1 h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-none"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};