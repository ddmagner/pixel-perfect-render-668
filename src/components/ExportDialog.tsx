import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { TimeEntry, AppSettings, ViewMode } from '@/types';
import { createPdfFromPreview } from '@/utils/domPdf';
import { generateSpreadsheet } from '@/utils/spreadsheetGenerator';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Share } from '@capacitor/share';
import { format } from 'date-fns';
import { X, Download, Mail, Printer, Eye } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntries: TimeEntry[];
  selectedEntries?: TimeEntry[];
  settings: AppSettings;
  viewMode: ViewMode;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  timeEntries,
  selectedEntries,
  settings,
  viewMode
}) => {
  const [isPdfFormat, setIsPdfFormat] = useState(true);
  const [exportMethod, setExportMethod] = useState<'download' | 'email' | 'print' | 'preview'>('preview');
  const [fileName, setFileName] = useState(`${settings.userProfile.name || 'User'} ${viewMode === 'invoice' ? 'Invoice' : 'Time Card'} ${format(new Date(), 'yyyy-MM-dd')}`);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Use selected entries if available, otherwise use all time entries
  const entriesToUse = selectedEntries && selectedEntries.length > 0 ? selectedEntries : timeEntries;

  const handleExport = async () => {
    if (entriesToUse.length === 0) {
      alert('No time entries to export');
      return;
    }

    if (exportMethod === 'preview') {
      setShowPreview(true);
      onClose();
      return;
    }

    // Store current tab before export
    try {
      localStorage.setItem('activeTab', 'time-tally');
    } catch (error) {
      console.warn('Could not save tab state:', error);
    }

    setIsExporting(true);
    
    try {
      let blob: Blob;
      let fileExtension: string;

      if (isPdfFormat) {
        // Render hidden InvoicePreview so createPdfFromPreview captures the exact on-screen layout
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '0';
        container.style.width = '816px';
        container.style.height = '1056px';
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(
          React.createElement(InvoicePreview, {
            selectedEntries: entriesToUse,
            settings: { ...settings, invoiceMode: viewMode === 'invoice' },
            onClose: () => {}
          })
        );

        // Wait a tick for layout and fonts
        await new Promise(r => setTimeout(r, 350));

        try {
          const el = container.querySelector('#document-preview') as HTMLElement | null;
          if (!el) throw new Error('Document preview element not found');

          // Ensure fonts and images are ready and sanitize images for html2canvas
          // @ts-ignore
          if (document.fonts && typeof document.fonts.ready?.then === 'function') {
            // @ts-ignore
            await document.fonts.ready;
          }
          const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
          await Promise.all(
            imgs.map((img) =>
              img.complete ? Promise.resolve() : new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); })
            )
          );
          imgs.forEach((img) => {
            try {
              const raw = img.getAttribute('src') || '';
              if (raw.startsWith('/')) {
                img.src = window.location.origin + raw;
              }
              // Remove CORS attribute for same-origin assets to avoid tainting
              try {
                const u = new URL(img.src, window.location.origin);
                if (u.origin === window.location.origin) {
                  img.removeAttribute('crossorigin');
                }
              } catch {}
              // Remove filters so rasterization keeps the image
              img.style.filter = 'none';
            } catch {}
          });

          blob = await createPdfFromPreview(entriesToUse, settings, viewMode, el);
        } finally {
          root.unmount();
          container.remove();
        }
        fileExtension = 'pdf';
      } else {
        blob = await generateSpreadsheet(entriesToUse, settings, viewMode);
        fileExtension = 'xlsx';
      }

      const finalFileName = `${fileName}.${fileExtension}`;
      const url = URL.createObjectURL(blob);

      if (exportMethod === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      if (exportMethod === 'email') {
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

      if (exportMethod === 'print') {
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
      try { window.dispatchEvent(new CustomEvent('set-active-tab', { detail: 'time-tally' })); } catch {}
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (showPreview) {
    return (
      <InvoicePreview 
        selectedEntries={entriesToUse}
        settings={settings}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="mx-2 border-none bg-background rounded-t-[20px] max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Export/Share/Print</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Format Toggle */}
          <div className="space-y-4">
            <div className="flex justify-center items-center gap-4">
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

          {/* Divider */}
          <div className="h-px bg-[#09121F] mx-0" />

          {/* Export Method */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Export Method</h3>
            
            {/* Export Methods */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5" />
                  <span className="text-base">Preview document</span>
                </div>
                <div 
                  className={`w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${exportMethod === 'preview' ? 'bg-gray-300' : 'bg-white'}`}
                  onClick={() => setExportMethod('preview')}
                >
                  {exportMethod === 'preview' && <div className="w-3 h-3 rounded-full bg-[#09121F]"></div>}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5" />
                  <span className="text-base">Download to device</span>
                </div>
                <div 
                  className={`w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${exportMethod === 'download' ? 'bg-gray-300' : 'bg-white'}`}
                  onClick={() => setExportMethod('download')}
                >
                  {exportMethod === 'download' && <div className="w-3 h-3 rounded-full bg-[#09121F]"></div>}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5" />
                  <span className="text-base">Share via email</span>
                </div>
                <div 
                  className={`w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${exportMethod === 'email' ? 'bg-gray-300' : 'bg-white'}`}
                  onClick={() => setExportMethod('email')}
                >
                  {exportMethod === 'email' && <div className="w-3 h-3 rounded-full bg-[#09121F]"></div>}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Printer className="h-5 w-5" />
                  <span className="text-base">Print</span>
                </div>
                <div 
                  className={`w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${exportMethod === 'print' ? 'bg-gray-300' : 'bg-white'}`}
                  onClick={() => setExportMethod('print')}
                >
                  {exportMethod === 'print' && <div className="w-3 h-3 rounded-full bg-[#09121F]"></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#09121F] mx-0" />

          {/* Save As */}
          <div>
            <div className="space-y-3">
              <label className="text-base font-medium">Save as</label>
              <Input 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="h-12 text-base bg-[#BFBFBF]/25 rounded-[8px] border-none outline-none"
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
              {isExporting ? 'Exporting...' : exportMethod === 'preview' ? 'Preview' : 'Next'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};