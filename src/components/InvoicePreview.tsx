import React, { useEffect, useState } from 'react';
import { TimeEntry, AppSettings } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatHours } from '@/lib/utils';

interface InvoicePreviewProps {
  settings: AppSettings;
  onClose: () => void;
  selectedEntries?: TimeEntry[]; // Optional pre-selected entries
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ selectedEntries, settings, onClose }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState(settings.invoiceNumber);
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
        const transformedEntries: TimeEntry[] = data.map(entry => {
          // Get rate from entry first, then from linked task type, then from settings task types by name
          let hourlyRate = Number(entry.hourly_rate) || 0;
          
          if (!hourlyRate && entry.task_types?.hourly_rate) {
            hourlyRate = Number(entry.task_types.hourly_rate);
          }
          
          // If still no rate, try to find in settings by task name
          if (!hourlyRate) {
            const taskType = settings.taskTypes.find(t => t.name === entry.task);
            if (taskType?.hourlyRate) {
              hourlyRate = Number(taskType.hourlyRate);
            }
          }
          
          return {
            id: entry.id,
            duration: Number(entry.duration),
            task: entry.task,
            project: entry.project,
            client: entry.client,
            date: entry.date,
            submittedAt: entry.submitted_at,
            hourlyRate,
            archived: entry.archived
          };
        });

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
    // Use the hourlyRate from the entry first, then fallback to task type rate from settings
    let rate = entry.hourlyRate || 0;
    
    // Additional fallback: try to find rate from settings by task name
    if (!rate) {
      const taskType = settings.taskTypes.find(t => t.name === entry.task);
      rate = taskType?.hourlyRate || 0;
    }
    
    return entry.duration * rate;
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const subtotalAmount = entries.reduce((sum, entry) => sum + calculateAmount(entry), 0);
  
  // Calculate tax amounts
  const taxCalculations = (settings.taxTypes || []).map(taxType => ({
    name: taxType.name,
    rate: taxType.rate || 0,
    amount: subtotalAmount * (taxType.rate || 0) / 100
  }));
  
  const totalTaxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);
  const totalAmount = subtotalAmount + totalTaxAmount;

  // Determine primary client for BILL TO section
  const primaryClient = React.useMemo(() => {
    if (entries.length === 0) return null;
    
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
  }, [entries, settings.clients, settings.projects]);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-transparent">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] overflow-auto rounded-lg shadow-2xl print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* Header Controls - Hidden when printing */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-900">
            {settings.invoiceMode ? 'Invoice Preview (Letter Size)' : 'Time Card Preview (Letter Size)'}
          </h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
          >
            Close
          </button>
        </div>

        {/* Invoice Content - Letter Size (8.5" x 11") */}
        <div id="document-preview" className="invoice-content mx-auto bg-white" style={{ width: '8.5in', maxWidth: '8.5in', padding: '0.75in 0.5in', boxSizing: 'border-box', fontSize: '12pt', lineHeight: 1.2 }}>
          {/* Header */}
          <div className="mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black mb-2">
                {settings.invoiceMode ? 'INVOICE' : 'TIME CARD'}
              </h1>
              {settings.invoiceMode && (
                <>
                  <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    <p>Invoice Date: {format(currentDate, 'MM/dd/yy')}</p>
                    <p>Due Date: {format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yy')}</p>
                  </div>
                  <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    Invoice #{String(invoiceNumber).padStart(4, '0')}
                  </div>
                </>
              )}
              <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                Period: {entries.length > 0 ? format(new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'} - {entries.length > 0 ? format(new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'}
              </div>
            </div>
          </div>

          {/* From/To Section */}
          <div className="grid grid-cols-5 gap-6 mb-6">
            <div className="col-span-2">
              <h3 className="font-bold text-black uppercase tracking-wider mb-1.5" style={{ fontSize: '11px', lineHeight: '1.2' }}>From</h3>
              <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
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
                {settings.userProfile.phone && <p>{settings.userProfile.phone}</p>}
                {/* Custom Fields */}
                {settings.userProfile.customFields && settings.userProfile.customFields.length > 0 && settings.userProfile.customFields
                  .filter(field => field.label && field.value)
                  .map((field) => (
                    <React.Fragment key={field.id}>
                      <p>{field.label}</p>
                      <p>{field.value}</p>
                    </React.Fragment>
                  ))}
              </div>
            </div>
            <div className="col-span-3 -ml-[15px]">
              <h3 className="font-bold text-black uppercase tracking-wider mb-1.5" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                {settings.invoiceMode ? 'Bill To' : 'To'}
              </h3>
              <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
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
              <div className="border-t border-b border-black">
                {settings.invoiceMode ? (
                  <div className="grid grid-cols-12 gap-4 py-1 font-bold text-black uppercase tracking-wider items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    <div className="col-span-2 text-left">Date</div>
                    <div className="col-span-3">Project</div>
                    <div className="col-span-3 -ml-[25px]">Task</div>
                    <div className="col-span-1 text-left">Hours</div>
                    <div className="col-span-1 flex justify-end pl-[75px]">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-4 py-1 font-bold text-black uppercase tracking-wider items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    <div className="col-span-2 text-left">Date</div>
                    <div className="col-span-3">Project</div>
                    <div className="col-span-2">Task</div>
                    <div className="col-span-1 text-left">Hours</div>
                  </div>
                )}
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {entries.map((entry, index) => {
                  const rate = entry.hourlyRate || 0;
                  const amount = calculateAmount(entry);
                  
                  return settings.invoiceMode ? (
                    <div key={entry.id || index} className="grid grid-cols-12 gap-4 py-1 text-black items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                      <div className="col-span-2">{format(new Date(entry.date), 'MM/dd/yy')}</div>
                      <div className="col-span-3 font-medium">{entry.project}</div>
                      <div className="col-span-3 -ml-[25px]">{entry.task}</div>
                      <div className="col-span-1 text-left">{formatHours(entry.duration)}</div>
                      <div className="col-span-1 flex items-center justify-end pl-[75px]">{formatCurrency(rate)}</div>
                      <div className="col-span-2 text-right font-medium">{formatCurrency(amount)}</div>
                    </div>
                  ) : (
                    <div key={entry.id || index} className="grid grid-cols-8 gap-4 py-1 text-black items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                      <div className="col-span-2">{format(new Date(entry.date), 'MM/dd/yy')}</div>
                      <div className="col-span-3 font-medium">{entry.project}</div>
                      <div className="col-span-2">{entry.task}</div>
                      <div className="col-span-1 text-left">{formatHours(entry.duration)}</div>
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
              {settings.invoiceMode ? (
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <div className="space-y-0">
                      <div className="grid grid-cols-12 gap-4 py-1 text-black items-center border-t border-gray-300" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                        <div className="col-span-2"></div>
                        <div className="col-span-3"></div>
                        <div className="col-span-3 -ml-[25px]">Subtotal:</div>
                        <div className="col-span-1 text-left">{formatHours(totalHours)}</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-2 text-right font-medium">{formatCurrency(subtotalAmount)}</div>
                      </div>
                      {taxCalculations.map((tax, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 py-1 text-black items-center border-t border-gray-300" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                          <div className="col-span-2"></div>
                          <div className="col-span-3"></div>
                          <div className="col-span-3 -ml-[25px]">{tax.name} ({tax.rate}%):</div>
                          <div className="col-span-1"></div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2 text-right font-medium">{formatCurrency(tax.amount)}</div>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-4 py-1 text-black items-center border-t border-black" style={{ borderTopWidth: '1pt', fontSize: '11px', lineHeight: '1.2' }}>
                        <div className="col-span-2"></div>
                        <div className="col-span-3"></div>
                        <div className="col-span-3 -ml-[25px] font-bold">Total Due:</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-1"></div>
                        <div className="col-span-2 text-right font-bold">{formatCurrency(totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-4">
                  <div className="col-span-8">
                    <div className="grid grid-cols-8 gap-4 py-1 text-black items-center border-t border-black" style={{ borderTopWidth: '1pt', fontSize: '11px', lineHeight: '1.2' }}>
                      <div className="col-span-2"></div>
                      <div className="col-span-3"></div>
                      <div className="col-span-2 font-bold">Total Hours:</div>
                      <div className="col-span-1 text-left font-bold">{formatHours(totalHours)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="mt-4" data-pdf-context="footer">
              <div className="text-muted-foreground" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                <span className="inline-flex items-baseline gap-1 leading-4 align-baseline">
                  <span>MADE WITH</span>
                  <img 
                    src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
                    alt="Time In icon" 
                    className="inline-block w-[9px] h-[9px] align-text-bottom"
                    style={{ filter: 'grayscale(100%) brightness(0) invert(60%)' }}
                  />
                  <img 
                    src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
                    alt="TIME IN wordmark" 
                    className="inline-block h-[9px] w-auto align-baseline pdf-wordmark-offset"
                    style={{ filter: 'grayscale(100%) brightness(0) invert(60%)' }}
                  />
                </span>
              </div>
            </div>
          </div>
          
          
        </div>
      </div>
    </div>
  );
};