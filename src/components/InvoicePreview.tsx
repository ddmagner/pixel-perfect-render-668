import React, { useEffect, useState } from 'react';
import { TimeEntry, AppSettings } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoicePreviewProps {
  settings: AppSettings;
  onClose: () => void;
  selectedEntries?: TimeEntry[]; // Optional pre-selected entries
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ selectedEntries, settings, onClose }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true);
        
        if (selectedEntries) {
          setEntries(selectedEntries);
          return;
        }

        const { data, error } = await supabase
          .from('time_entries')
          .select(`
            *,
            task_types!left(name, hourly_rate)
          `)
          .eq('archived', false)
          .order('date', { ascending: false });

        if (error) throw error;

        // Transform database entries to match our TimeEntry interface
        const transformedEntries: TimeEntry[] = data.map(entry => ({
          id: entry.id,
          duration: Number(entry.duration),
          task: entry.task,
          project: entry.project,
          client: entry.client,
          date: entry.date,
          submittedAt: entry.submitted_at,
          hourlyRate: Number(entry.hourly_rate) || Number(entry.task_types?.hourly_rate) || 0,
          archived: entry.archived
        }));

        setEntries(transformedEntries);
      } catch (error) {
        console.error('Error fetching time entries:', error);
        toast({
          title: "Error",
          description: "Failed to load time entries for invoice",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();
  }, [selectedEntries, toast]);

  const calculateAmount = (entry: TimeEntry): number => {
    // Use the hourlyRate from the entry first, then fallback to task type rate
    const rate = entry.hourlyRate || 0;
    return entry.duration * rate;
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalAmount = entries.reduce((sum, entry) => sum + calculateAmount(entry), 0);

  const currentDate = new Date();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg">
          <p>Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] overflow-auto rounded-lg shadow-2xl">
        {/* Header Controls */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Invoice Preview (Letter Size)</h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
          >
            Close
          </button>
        </div>

        {/* Invoice Content - Letter Size (8.5" x 11") */}
        <div className="px-[72px] py-8" style={{ aspectRatio: '8.5/11', minHeight: '11in' }}>
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
                <p>Your Address Line 1</p>
                <p>City, State 12345</p>
                <p>Phone: (555) 123-4567</p>
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
                  <div className="col-span-1 text-right ml-[30px]">Rate</div>
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
                      <div className="col-span-1 text-left">{entry.duration.toFixed(2)}</div>
                      <div className="col-span-1 text-right ml-[30px]">${rate.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-medium">${amount.toFixed(2)}</div>
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
                    <div className="grid grid-cols-12 gap-4 h-6 items-center">
                      <div className="col-span-5"></div>
                      <div className="col-span-7 border-t border-gray-300 -ml-[25px]">
                        <div className="grid grid-cols-12 gap-4 h-6 items-center">
                          <div className="col-span-3">
                            <span className="text-sm text-black">Subtotal:</span>
                          </div>
                          <div className="col-span-1 text-left">
                            <span className="text-sm text-black">{totalHours.toFixed(2)}</span>
                          </div>
                          <div className="col-span-1 text-right ml-[30px]"></div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-medium">${totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 h-6 items-center">
                      <div className="col-span-5"></div>
                      <div className="col-span-7 border-t border-gray-300 -ml-[25px]">
                        <div className="grid grid-cols-12 gap-4 h-6 items-center">
                          <div className="col-span-3">
                            <span className="text-sm text-black">Tax (0%):</span>
                          </div>
                          <div className="col-span-1"></div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-medium">$0.00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 h-6 items-center">
                      <div className="col-span-5"></div>
                      <div className="col-span-7 border-t border-black -ml-[25px]" style={{ borderTopWidth: '1pt' }}>
                        <div className="grid grid-cols-12 gap-4 h-6 items-center">
                          <div className="col-span-3">
                            <span className="text-sm font-bold text-black">Total Due:</span>
                          </div>
                          <div className="col-span-1"></div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-bold text-black">${totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};