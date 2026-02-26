import React, { useEffect, useState } from 'react';
import { TimeEntry, AppSettings, SortOption } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatHours } from '@/lib/utils';

interface InvoicePreviewProps {
  settings: AppSettings;
  onClose: () => void;
  selectedEntries?: TimeEntry[];
  sortOption?: SortOption;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ selectedEntries, settings, onClose, sortOption = 'project' }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState(settings.invoiceNumber);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true);
        
        if (selectedEntries) {
          // Ensure selectedEntries have hourly rates populated from settings
          const enrichedEntries = selectedEntries.map(entry => {
            let hourlyRate = entry.hourlyRate || 0;
            
            // Try to find rate from settings by task name if not already present
            if (!hourlyRate) {
              const taskType = settings.taskTypes.find(t => t.name === entry.task);
              if (taskType?.hourlyRate) {
                hourlyRate = Number(taskType.hourlyRate);
              }
            }
            
            return {
              ...entry,
              hourlyRate,
              noCharge: entry.noCharge || false
            };
          });
          
          setEntries(enrichedEntries);
          setLoading(false);
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
            archived: entry.archived,
            noCharge: (entry as any).no_charge || false
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
  }, [selectedEntries, toast, settings.taskTypes]);

  const calculateAmount = (entry: TimeEntry): number => {
    // No-charge entries always return 0
    if (entry.noCharge) return 0;
    
    // Use the hourlyRate from the entry first, then fallback to task type rate from settings
    let rate = entry.hourlyRate || 0;
    
    // Additional fallback: try to find rate from settings by task name
    if (!rate) {
      const taskType = settings.taskTypes.find(t => t.name === entry.task);
      rate = taskType?.hourlyRate || 0;
    }
    
    return entry.duration * rate;
  };

  // Sort entries based on sortOption
  const sortedEntries = React.useMemo(() => {
    const sorted = [...entries];
    if (sortOption === 'project') {
      sorted.sort((a, b) => a.project.localeCompare(b.project) || new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortOption === 'task') {
      sorted.sort((a, b) => a.task.localeCompare(b.task) || new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.project.localeCompare(b.project));
    }
    return sorted;
  }, [entries, sortOption]);

  // Group entries by project (alphabetically) for "By Project" view
  const groupedByProject = React.useMemo(() => {
    const groups: { project: string; entries: TimeEntry[] }[] = [];
    const projectMap = new Map<string, TimeEntry[]>();
    sortedEntries.forEach(entry => {
      if (!projectMap.has(entry.project)) projectMap.set(entry.project, []);
      projectMap.get(entry.project)!.push(entry);
    });
    // Sort project names alphabetically
    [...projectMap.keys()].sort((a, b) => a.localeCompare(b)).forEach(project => {
      groups.push({ project, entries: projectMap.get(project)! });
    });
    return groups;
  }, [sortedEntries]);

  // Column order helpers based on sortOption
  const getColumnLabels = () => {
    if (sortOption === 'project') return { col1: 'Project', col2: 'Date', col3: 'Task' };
    if (sortOption === 'task') return { col1: 'Task', col2: 'Date', col3: 'Project' };
    return { col1: 'Date', col2: 'Project', col3: 'Task' }; // default 'date'
  };
  const getColumnValues = (entry: TimeEntry, isFirstInGroup = false) => {
    if (sortOption === 'project') return { col1: isFirstInGroup ? entry.project : '', col2: format(new Date(entry.date), 'MM/dd/yy'), col3: entry.task };
    if (sortOption === 'task') return { col1: entry.task, col2: format(new Date(entry.date), 'MM/dd/yy'), col3: entry.project };
    return { col1: format(new Date(entry.date), 'MM/dd/yy'), col2: entry.project, col3: entry.task };
  };
  const columnLabels = getColumnLabels();

  const totalHours = sortedEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const subtotalAmount = sortedEntries.reduce((sum, entry) => sum + calculateAmount(entry), 0);
  
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
    if (sortedEntries.length === 0) return null;
    
    // Get all unique clients from entries
    const clientCounts: { [key: string]: number } = {};
    sortedEntries.forEach(entry => {
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
  }, [sortedEntries, settings.clients, settings.projects]);

  const currentDate = new Date();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg">
          <p>Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 print:p-0 print:bg-transparent print:backdrop-blur-none" style={{ paddingTop: 'calc(64px + var(--safe-area-top, 0px))' }}>
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
                  </div>
                  <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    Invoice #{String(invoiceNumber).padStart(4, '0')}
                  </div>
                </>
              )}
              <div className="text-black" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                Period: {sortedEntries.length > 0 ? format(new Date(Math.min(...sortedEntries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'} - {sortedEntries.length > 0 ? format(new Date(Math.max(...sortedEntries.map(e => new Date(e.date).getTime()))), 'MM/dd/yy') : 'N/A'}
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
                    <div className={`${sortOption === 'project' ? 'col-span-3' : 'col-span-2'} text-left`}>{columnLabels.col1}</div>
                    <div className={sortOption === 'project' ? 'col-span-2' : 'col-span-3'}>{columnLabels.col2}</div>
                    <div className={`${sortOption === 'project' ? 'col-span-3' : 'col-span-3'}`}>{columnLabels.col3}</div>
                    <div className="col-span-1 text-right">Hours</div>
                    <div className="col-span-1 flex justify-end">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-4 py-1 font-bold text-black uppercase tracking-wider items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    <div className={`${sortOption === 'project' ? 'col-span-3' : 'col-span-2'} text-left`}>{columnLabels.col1}</div>
                    <div className={sortOption === 'project' ? 'col-span-2' : 'col-span-3'}>{columnLabels.col2}</div>
                    <div className="col-span-2">{columnLabels.col3}</div>
                    <div className="col-span-1 text-right">Hours</div>
                  </div>
                )}
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {sortOption === 'project' ? (
                  // Grouped by project: show project name only on first row of each group
                  groupedByProject.map((group, groupIndex) => (
                    <React.Fragment key={group.project}>
                      {group.entries.map((entry, entryIndex) => {
                        const rate = entry.noCharge ? 0 : (entry.hourlyRate || 0);
                        const amount = calculateAmount(entry);
                        const isFirst = entryIndex === 0;
                        const cols = getColumnValues(entry, isFirst);

                        return settings.invoiceMode ? (
                          <div key={entry.id || `${groupIndex}-${entryIndex}`} className={`grid grid-cols-12 gap-4 py-1 text-black items-center ${isFirst && groupIndex > 0 ? 'border-t border-gray-300' : ''}`} style={{ fontSize: '11px', lineHeight: '1.2' }}>
                            <div className="col-span-3">{cols.col1}</div>
                            <div className="col-span-2 font-medium">{cols.col2}</div>
                            <div className="col-span-3">{cols.col3}</div>
                            <div className="col-span-1 text-right">{formatHours(entry.duration)}</div>
                            <div className="col-span-1 flex justify-end whitespace-nowrap">
                              {entry.noCharge ? <span className="italic text-gray-400">No-charge</span> : formatCurrency(rate)}
                            </div>
                            <div className="col-span-2 text-right font-medium whitespace-nowrap">
                              {entry.noCharge ? <span className="italic text-gray-400">No-charge</span> : formatCurrency(amount)}
                            </div>
                          </div>
                        ) : (
                          <div key={entry.id || `${groupIndex}-${entryIndex}`} className={`grid grid-cols-8 gap-4 py-1 text-black items-center ${isFirst && groupIndex > 0 ? 'border-t border-gray-300' : ''}`} style={{ fontSize: '11px', lineHeight: '1.2' }}>
                            <div className="col-span-3">{cols.col1}</div>
                            <div className="col-span-2 font-medium">{cols.col2}</div>
                            <div className="col-span-2">{cols.col3}</div>
                            <div className="col-span-1 text-right">{formatHours(entry.duration)}</div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  // Default flat rendering for date/task sort
                  sortedEntries.map((entry, index) => {
                    const rate = entry.noCharge ? 0 : (entry.hourlyRate || 0);
                    const amount = calculateAmount(entry);
                    const cols = getColumnValues(entry);

                    return settings.invoiceMode ? (
                      <div key={entry.id || index} className="grid grid-cols-12 gap-4 py-1 text-black items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                        <div className="col-span-2">{cols.col1}</div>
                        <div className="col-span-3 font-medium">{cols.col2}</div>
                        <div className="col-span-3">{cols.col3}</div>
                        <div className="col-span-1 text-right">{formatHours(entry.duration)}</div>
                        <div className="col-span-1 flex justify-end whitespace-nowrap">
                          {entry.noCharge ? <span className="italic text-gray-400">No-charge</span> : formatCurrency(rate)}
                        </div>
                        <div className="col-span-2 text-right font-medium whitespace-nowrap">
                          {entry.noCharge ? <span className="italic text-gray-400">No-charge</span> : formatCurrency(amount)}
                        </div>
                      </div>
                    ) : (
                      <div key={entry.id || index} className="grid grid-cols-8 gap-4 py-1 text-black items-center" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                        <div className="col-span-2">{cols.col1}</div>
                        <div className="col-span-3 font-medium">{cols.col2}</div>
                        <div className="col-span-2">{cols.col3}</div>
                        <div className="col-span-1 text-right">{formatHours(entry.duration)}</div>
                      </div>
                    );
                  })
                )}
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
                        <div className="col-span-3">Subtotal:</div>
                        <div className="col-span-1 text-right">{formatHours(totalHours)}</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-2 text-right font-medium">{formatCurrency(subtotalAmount)}</div>
                      </div>
                      {taxCalculations.map((tax, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 py-1 text-black items-center border-t border-gray-300" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                          <div className="col-span-2"></div>
                          <div className="col-span-3"></div>
                          <div className="col-span-3">{tax.name} ({tax.rate}%):</div>
                          <div className="col-span-1"></div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2 text-right font-medium">{formatCurrency(tax.amount)}</div>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-4 py-1 text-black items-center border-t border-black" style={{ borderTopWidth: '1pt', fontSize: '11px', lineHeight: '1.2' }}>
                        <div className="col-span-2"></div>
                        <div className="col-span-3"></div>
                        <div className="col-span-3 font-bold">Total Due:</div>
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
                      <div className="col-span-1 text-right font-bold">{formatHours(totalHours)}</div>
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
                    src="/time-in-logo.png" 
                    alt="Time In Logo" 
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