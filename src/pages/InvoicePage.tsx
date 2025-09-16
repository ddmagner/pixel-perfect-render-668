import React, { useEffect, useState } from 'react';
import { TimeEntry, AppSettings } from '@/types';
import { format } from 'date-fns';
import { formatCurrency, formatHours } from '@/lib/utils';

const InvoicePage: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
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

  const calculateAmount = (entry: TimeEntry): number => {
    const rate = entry.hourlyRate || 0;
    return entry.duration * rate;
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalAmount = entries.reduce((sum, entry) => sum + calculateAmount(entry), 0);
  const currentDate = new Date();

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print fixed top-4 right-4 z-10">
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Invoice
        </button>
      </div>

      {/* Invoice Content - Letter Size (8.5" x 11") */}
      <div className="px-[72px] py-8 max-w-[8.5in] mx-auto">
        {/* Invoice Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">INVOICE</h1>
            <div className="text-sm text-black">
              <p>Invoice Date: {format(currentDate, 'MM/dd/yy')}</p>
              <p>Due Date: {format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yy')}</p>
            </div>
            <div className="text-sm text-black">Invoice #001</div>
            <div className="text-sm text-black">
              Period: {entries.length > 0 ? format(new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'} - {entries.length > 0 ? format(new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'}
            </div>
          </div>
        </div>

        {/* From/To Section */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <div className="col-span-2">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-1.5">From</h3>
            <div className="text-sm text-black">
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
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-1.5">Bill To</h3>
            <div className="text-sm text-black">
              <p>Client Name</p>
              <p>Client Company</p>
              <p>Client Address Line 1</p>
              <p>City, State 12345</p>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-6">
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="border-t border-b border-black">
              <div className="grid grid-cols-12 gap-4 py-1 text-xs font-bold text-black uppercase tracking-wider">
                <div className="col-span-2 text-left">Date</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-3 -ml-[25px]">Task</div>
                <div className="col-span-1 text-left">Hours</div>
                <div className="col-span-1 flex justify-end pl-[75px]">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {entries.map((entry, index) => {
                const rate = entry.hourlyRate || 0;
                const amount = calculateAmount(entry);
                
                return (
                  <div key={entry.id || index} className="grid grid-cols-12 gap-4 py-1 text-sm text-black">
                    <div className="col-span-2">{format(new Date(entry.date), 'MM/dd/yy')}</div>
                    <div className="col-span-3 font-medium">{entry.project}</div>
                    <div className="col-span-3 -ml-[25px]">{entry.task}</div>
                    <div className="col-span-1 text-left">{formatHours(entry.duration)}</div>
                    <div className="col-span-1 flex justify-end pl-[75px]">{formatCurrency(rate)}</div>
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
        <div className="mb-12">
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
                          <div className="col-span-2 text-right font-medium">{formatCurrency(totalAmount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
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
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>MADE WITH</span>
              <div className="flex items-center gap-1">
                <img 
                  src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
                  alt="Logo" 
                  className="w-[9px] h-[9px]"
                  style={{ filter: 'grayscale(100%) brightness(0) invert(60%)' }}
                />
                <img 
                  src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
                  alt="TIME IN Logo" 
                  className="h-[9px] w-auto"
                  style={{ filter: 'grayscale(100%) brightness(0) invert(60%)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;