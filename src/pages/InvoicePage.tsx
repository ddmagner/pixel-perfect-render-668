import React, { useEffect, useState } from 'react';
import { TimeEntry, AppSettings } from '@/types';
import { format } from 'date-fns';
import { formatCurrency, formatHours } from '@/lib/utils';

const InvoicePage: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prefer data via localStorage key for reliability across mobile browsers
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('k') || urlParams.get('key');

    if (keyParam) {
      const storageKey = `invoice:${keyParam}`;
      try {
        const stored = localStorage.getItem(storageKey) || localStorage.getItem(keyParam);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.entries && parsed?.settings) {
            setEntries(parsed.entries);
            setSettings(parsed.settings);
            setLoading(false);
            // Clean up
            localStorage.removeItem(storageKey);
            localStorage.removeItem(keyParam);
            return; // Done
          }
        }
      } catch (e) {
        console.error('Error loading invoice data from localStorage:', e);
      }
    }

    // Fallback: Get data from URL parameters (legacy)
    const entriesParam = urlParams.get('entries');
    const settingsParam = urlParams.get('settings');

    if (entriesParam && settingsParam) {
      try {
        const parsedEntries = JSON.parse(decodeURIComponent(entriesParam));
        const parsedSettings = JSON.parse(decodeURIComponent(settingsParam));
        setEntries(parsedEntries);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing URL parameters:', error);
      }
    }
    setLoading(false);
  }, []);

  // Also support receiving data via postMessage from the opener window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data && data.type === 'invoice-data' && data.payload) {
        try {
          const { entries: incomingEntries, settings: incomingSettings } = data.payload;
          if (Array.isArray(incomingEntries) && incomingSettings) {
            setEntries(incomingEntries);
            setSettings(incomingSettings);
            setLoading(false);
          }
        } catch (e) {
          console.error('Error handling invoice-data message:', e);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Notify parent (domPdf) when invoice is fully ready for capture
  useEffect(() => {
    if (loading || !settings) return;

    const waitForReady = async () => {
      try {
        // Wait for web fonts to be ready (if supported)
        // @ts-ignore
        if (document.fonts && typeof document.fonts.ready?.then === 'function') {
          // @ts-ignore
          await document.fonts.ready;
        }
      } catch {}

      // Wait for all images within the invoice content to finish loading
      const container = document.querySelector('.invoice-content') as HTMLElement | null;
      const imgs = Array.from(container?.querySelectorAll('img') || []);
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                const done = () => res();
                img.onload = done;
                img.onerror = done;
              })
        )
      );

      // Double RAF to ensure layout is fully flushed before capture
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.parent?.postMessage({ type: 'invoice-ready' }, window.location.origin);
        });
      });
    };

    waitForReady();
  }, [loading, settings]);

  const getRate = (entry: TimeEntry): number => {
    const rate = settings?.taskTypes?.find(t => t.name === entry.task)?.hourlyRate ?? 0;
    return rate;
  };

  const calculateAmount = (entry: TimeEntry): number => entry.duration * getRate(entry);

const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
const subtotalAmount = entries.reduce((sum, entry) => sum + calculateAmount(entry), 0);
// Calculate tax amounts from settings
const taxCalculations = (settings?.taxTypes || []).map(taxType => ({
  name: taxType.name,
  rate: taxType.rate || 0,
  amount: subtotalAmount * ((taxType.rate || 0) / 100),
}));
const totalTaxAmount = taxCalculations.reduce((sum, t) => sum + t.amount, 0);
const totalAmount = subtotalAmount + totalTaxAmount;

// Determine primary client for BILL TO section
const primaryClient = React.useMemo(() => {
  if (entries.length === 0 || !settings) return null;
  
  // Get all unique clients from entries
  const clientCounts: { [key: string]: number } = {};
  entries.forEach(entry => {
    let clientName = entry.client || '';
    
    // If no direct client, try to find via project mapping
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
  
  // Find the client with the most entries (primary client)
  const primaryClientName = Object.keys(clientCounts).reduce((a, b) => 
    clientCounts[a] > clientCounts[b] ? a : b, '');
  
  if (primaryClientName) {
    return settings.clients.find(c => c.name === primaryClientName) || null;
  }
  
  return null;
}, [entries, settings?.clients, settings?.projects]);

const currentDate = new Date();

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">{/* Removed min-h-screen to hug content */}
      {/* Print styles */}
      <style>{`
        @media print {
          @page { 
            size: letter portrait;
            margin: 0.75in 0.5in;
          }
          /* Reset problematic global styles for print */
          html, body, #root {
            position: static !important;
            width: auto !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            filter: none !important;
          }
          body { 
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .invoice-content { 
            width: 7.5in !important;
            max-width: 7.5in !important;
            margin: 0 !important;
            padding: 0.75in 0.5in !important;
            background: white !important;
            color: black !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          .print-text {
            color: black !important;
          }
          .print-border {
            border-color: black !important;
          }
        }
        @media screen {
          .invoice-content {
            width: 7.5in;
            max-width: 7.5in;
          }
        }
      `}</style>


      {/* Invoice Content - Letter Size (8.5" x 11") */}
      <div className="invoice-content mx-auto bg-white" style={{ padding: '0.75in 0.5in' }}>{/* Removed minHeight: '11in' to hug content */}
        {/* Invoice Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black print-text mb-2">INVOICE</h1>
            <div className="text-sm text-black print-text">
              <p>Invoice Date: {format(currentDate, 'MM/dd/yy')}</p>
              <p>Due Date: {format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yy')}</p>
            </div>
            <div className="text-sm text-black print-text">Invoice #001</div>
            <div className="text-sm text-black print-text">
              Period: {entries.length > 0 ? format(new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'} - {entries.length > 0 ? format(new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'}
            </div>
          </div>
        </div>

        {/* From/To Section */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <div className="col-span-2">
            <h3 className="text-sm font-bold text-black print-text uppercase tracking-wider mb-1.5">From</h3>
            <div className="text-sm text-black print-text">
              <p>{settings.userProfile.name || 'Your Name'}</p>
              <p>{settings.userProfile.email || 'your.email@example.com'}</p>
              {settings.userProfile.address && <p>{settings.userProfile.address}</p>}
              {(settings.userProfile.city || settings.userProfile.state || settings.userProfile.zipCode) && (
                <p>
                  {settings.userProfile.city && settings.userProfile.city}
                  {settings.userProfile.city && settings.userProfile.state && ', '}
                  {settings.userProfile.state && settings.userProfile.state}
                  {settings.userProfile.zipCode && ` ${settings.userProfile.zipCode}`}
                </p>
              )}
              {settings.userProfile.phone && <p>Phone: {settings.userProfile.phone}</p>}
            </div>
          </div>
          <div className="col-span-3 -ml-[15px]">
            <h3 className="text-sm font-bold text-black print-text uppercase tracking-wider mb-1.5">Bill To</h3>
            <div className="text-sm text-black print-text">
                 {primaryClient ? (
                   <>
                     <p>{primaryClient.name}</p>
                     {primaryClient.attention && <p>Attention: {primaryClient.attention}</p>}
                     {primaryClient.email && <p>{primaryClient.email}</p>}
                     {primaryClient.address && <p>{primaryClient.address}</p>}
                  {(primaryClient.city || primaryClient.state || primaryClient.zip_code) && (
                    <p>
                      {primaryClient.city && primaryClient.city}
                      {primaryClient.city && primaryClient.state && ', '}
                      {primaryClient.state && primaryClient.state}
                      {primaryClient.zip_code && ` ${primaryClient.zip_code}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>Client Name</p>
                  <p>Client Company</p>
                  <p>Client Address Line 1</p>
                  <p>City, State 12345</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-6">
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="border-t border-b border-black print-border">
              <div className="grid grid-cols-12 gap-4 py-1 text-xs font-bold text-black print-text uppercase tracking-wider items-center">
                <div className="col-span-2 text-left">Date</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-3 -ml-[25px]">Task</div>
                <div className="col-span-1 text-left">Hours</div>
                <div className="col-span-1 flex items-center justify-end pl-[75px]">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {entries.map((entry, index) => {
                const rate = getRate(entry);
                const amount = calculateAmount(entry);
                
                return (
                  <div key={entry.id || index} className="grid grid-cols-12 gap-4 py-1 text-sm text-black print-text items-center">
                    <div className="col-span-2">{format(new Date(entry.date), 'MM/dd/yy')}</div>
                    <div className="col-span-3 font-medium">{entry.project}</div>
                    <div className="col-span-3 -ml-[25px]">{entry.task}</div>
                    <div className="col-span-1 text-left">{formatHours(entry.duration)}</div>
                    <div className="col-span-1 flex items-center justify-end pl-[75px]">{formatCurrency(rate)}</div>
                    <div className="col-span-2 text-right font-medium">{formatCurrency(amount)}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer divider */}
            <div className="border-b border-gray-200"></div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="mb-6">{/* Reduced bottom margin from mb-12 to mb-6 */}
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <div className="space-y-0">
                  <div className="grid grid-cols-12 gap-4 py-1 text-sm text-black items-center">
                    <div className="col-span-2"></div>
                    <div className="col-span-3"></div>
                    <div className="col-span-7 -ml-[25px] border-t border-gray-300">
                      <div className="ml-[25px]">
                        <div className="grid grid-cols-7 gap-4 items-center text-sm text-black pt-1">
                          <div className="col-span-3 -ml-[25px]">Subtotal:</div>
                          <div className="col-span-1 text-left">{formatHours(totalHours)}</div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2 text-right font-medium">{formatCurrency(subtotalAmount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Tax lines */}
                  {taxCalculations.map((tax, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 py-1 text-sm text-black items-center">
                      <div className="col-span-2"></div>
                      <div className="col-span-3"></div>
                      <div className="col-span-7 -ml-[25px] border-t border-gray-300">
                        <div className="ml-[25px]">
                          <div className="grid grid-cols-7 gap-4 items-center text-sm text-black pt-1">
                            <div className="col-span-3 -ml-[25px]">{tax.name} ({tax.rate}%):</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-1"></div>
                            <div className="col-span-2 text-right font-medium">{formatCurrency(tax.amount)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {taxCalculations.length === 0 && (
                    <div className="grid grid-cols-12 gap-4 py-1 text-sm text-black items-center">
                      <div className="col-span-2"></div>
                      <div className="col-span-3"></div>
                      <div className="col-span-7 -ml-[25px] border-t border-gray-300">
                        <div className="ml-[25px]">
                          <div className="grid grid-cols-7 gap-4 items-center text-sm text-black pt-1">
                            <div className="col-span-3 -ml-[25px]">Tax (0%):</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-1"></div>
                            <div className="col-span-2 text-right font-medium">$0.00</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-4 py-1 text-sm text-black items-center">
                    <div className="col-span-2"></div>
                    <div className="col-span-3"></div>
                    <div className="col-span-7 -ml-[25px] border-t border-black" style={{ borderTopWidth: '1pt' }}>
                      <div className="ml-[25px]">
                        <div className="grid grid-cols-7 gap-4 items-center text-sm text-black pt-1">
                          <div className="col-span-3 -ml-[25px] font-bold">Total Due:</div>
                          <div className="col-span-1"></div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2 text-right font-bold">{formatCurrency(totalAmount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-4">
            <div className="text-xs text-gray-400 flex items-baseline gap-1">
              <span className="leading-4">MADE WITH</span>
              <img 
                src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
                alt="Time In icon" 
                className="w-[9px] h-[9px] align-baseline"
                style={{ filter: 'grayscale(100%) brightness(0) invert(60%)' }}
              />
              <img 
                src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
                alt="TIME IN wordmark" 
                className="h-[9px] w-auto align-baseline"
                style={{ filter: 'grayscale(100%) brightness(0) invert(60%)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;