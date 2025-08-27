import React from 'react';
import { TimeEntry, AppSettings } from '@/types';
import { format } from 'date-fns';

interface InvoicePreviewProps {
  entries: TimeEntry[];
  settings: AppSettings;
  onClose: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ entries, settings, onClose }) => {
  const calculateAmount = (entry: TimeEntry): number => {
    const taskType = settings.taskTypes.find(t => t.name === entry.task);
    const rate = taskType?.hourlyRate || 0;
    return entry.duration * rate;
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalAmount = entries.reduce((sum, entry) => sum + calculateAmount(entry), 0);

  const currentDate = new Date();

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
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-lg font-bold text-black mb-2">INVOICE</h1>
              <div className="text-sm text-black">
                <p>Invoice Date: {format(currentDate, 'MMMM d, yyyy')}</p>
                <p>Due Date: {format(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-black mb-1">Invoice #001</div>
              <div className="text-sm text-black">
                Period: {entries.length > 0 ? format(new Date(Math.min(...entries.map(e => new Date(e.date).getTime()))), 'MMM d') : 'N/A'} - {entries.length > 0 ? format(new Date(Math.max(...entries.map(e => new Date(e.date).getTime()))), 'MMM d, yyyy') : 'N/A'}
              </div>
            </div>
          </div>

          {/* From/To Section */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">From</h3>
              <div className="text-sm text-black">
                <p className="font-semibold">{settings.userProfile.name || 'Your Name'}</p>
                <p>{settings.userProfile.email || 'your.email@example.com'}</p>
                <p>Your Address Line 1</p>
                <p>City, State 12345</p>
                <p>Phone: (555) 123-4567</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Bill To</h3>
              <div className="text-sm text-black">
                <p className="font-semibold">Client Name</p>
                <p>Client Company</p>
                <p>Client Address Line 1</p>
                <p>City, State 12345</p>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="mb-12">
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="border-t border-b border-black">
                <div className="grid grid-cols-12 gap-4 pr-6 py-2 text-sm font-bold text-black uppercase tracking-wider">
                  <div className="col-span-2 text-left">Date</div>
                  <div className="col-span-3">Project</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1 text-center">Hours</div>
                  <div className="col-span-1 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {entries.map((entry, index) => {
                  const taskType = settings.taskTypes.find(t => t.name === entry.task);
                  const rate = taskType?.hourlyRate || 0;
                  const amount = calculateAmount(entry);
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm text-black">
                      <div className="col-span-2">{format(new Date(entry.date), 'MMM d, yyyy')}</div>
                      <div className="col-span-3 font-medium">{entry.project}</div>
                      <div className="col-span-3">{entry.task}</div>
                      <div className="col-span-1 text-center">{entry.duration.toFixed(2)}</div>
                      <div className="col-span-1 text-right">${rate.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-medium">${amount.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-12">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-black">Subtotal:</span>
                  <span className="text-sm font-medium">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-black">Tax (0%):</span>
                  <span className="text-sm font-medium">$0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900">
                  <span className="text-sm font-bold text-black">Total Due:</span>
                  <span className="text-sm font-bold text-black">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-black">
                <p><strong>Total Hours:</strong> {totalHours.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="border-t border-gray-200 pt-8">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Payment Terms</h3>
                <div className="text-sm text-black space-y-1">
                  <p>• Payment is due within 30 days</p>
                  <p>• Late payments subject to 1.5% monthly fee</p>
                  <p>• Please include invoice number with payment</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Payment Methods</h3>
                <div className="text-sm text-black space-y-1">
                  <p>• Check payable to: {settings.userProfile.name || 'Your Name'}</p>
                  <p>• Wire transfer details available upon request</p>
                  <p>• Online payment: [Payment Portal URL]</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-black mt-12 pt-8 border-t border-gray-200">
            <p>Thank you for your business!</p>
            <p className="mt-2">Questions? Contact us at {settings.userProfile.email || 'your.email@example.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};