import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeEntrySettings } from './TimeEntrySettings';
import { UserProfile } from './UserProfile';
import { ColorCustomization } from './ColorCustomization';
import { TimeArchive } from './TimeArchive';
import { InvoicePreview } from './InvoicePreview';
import { ClientDetailsDrawer } from './ClientDetailsDrawer';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Clock, LogOut, FileText } from 'lucide-react';
import type { Client } from '@/types';
interface SettingsProps {
  highlightSection?: string | null;
}
export const Settings: React.FC<SettingsProps> = ({
  highlightSection
}) => {
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const {
    settings,
    updateSettings
  } = useApp();
  const [showColorOverlay, setShowColorOverlay] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientDetailsOpen = (client: Client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const handleModeToggle = () => {
    updateSettings({
      invoiceMode: !settings.invoiceMode
    });
  };
  return <div className="flex flex-col w-full bg-white overflow-x-hidden">
      {/* Mode Toggle */}
      <div className="flex justify-center items-center w-full px-2.5 py-4">
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${!settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Time Card Mode
          </span>
          <button onClick={handleModeToggle} className={`w-12 h-6 rounded-full transition-colors ${settings.invoiceMode ? 'bg-[#09121F]' : 'bg-[#BFBFBF]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.invoiceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Invoice Mode
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full px-2.5 mb-6"><div className="h-px bg-[#09121F]" /></div>

      {/* Settings Content */}
      <div className="w-full">
        {/* Header */}
        <div className="flex items-baseline justify-between px-2.5 pt-0.5 pb-1">
          <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time In settings</h1>
        </div>

        <TimeEntrySettings highlightSection={highlightSection} onClientDetailsOpen={handleClientDetailsOpen} />
        
        {/* User Profile Section */}
        <div className="w-full h-[10px] bg-[#E5E5E5]" />
        <div className="pt-0.5 pb-1">
          <UserProfile />
        </div>
        
        {/* Time Archive Section */}
        <div className="w-full h-[10px] bg-[#E5E5E5]" />
        <div className="px-2.5 pt-4 pb-4">
          <TimeArchive />
        </div>
        
        {/* Coloring Time Section */}
        <div className="w-full h-[10px] bg-[#E5E5E5]" />
        <div className="px-2.5 pt-0.5 pb-1">
          <div className="py-4 pb-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowColorOverlay(true)}>
              <div>
                <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Coloring time</h1>
                <p className="text-[#09121F] text-sm underline">Customize your accent color</p>
              </div>
              <div className="w-8 h-8 bg-white rounded-lg flex items-center ml-auto">
                <div dangerouslySetInnerHTML={{
                __html: `<svg width="32" height="32" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 32px; height: 32px; aspect-ratio: 1/1; fill: ${settings.accentColor};"> <path d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" fill="${settings.accentColor}"></path> </svg>`
              }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Sign Out Section */}
        <div className="w-full h-[10px] bg-[#E5E5E5]" />
        <div className="px-2.5 pt-0.5 pb-1">
            <div className="py-6 pb-4 space-y-6" style={{
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
        }}>
            <button onClick={handleSignOut} className="text-[#09121F] text-[15px] font-medium underline hover:opacity-70 transition-opacity">
              Sign out
            </button>
            {/* Preview Link - Show in both modes with different text */}
            
            <div className="space-y-6">
              <button onClick={() => navigate('/terms')} className="text-[#BFBFBF] text-xs font-normal underline hover:opacity-70 transition-opacity block">
                Terms of Use
              </button>
              <button onClick={() => navigate('/privacy')} className="text-[#BFBFBF] text-xs font-normal underline hover:opacity-70 transition-opacity block">
                Privacy Policy
              </button>
              <div className="text-[#BFBFBF] text-xs font-normal">
                Version 1.0.2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Overlay */}
      {showColorOverlay && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-[#09121F] text-lg font-bold">Coloring time</h2>
              <button onClick={() => setShowColorOverlay(false)} className="text-[#BFBFBF] text-base font-bold">
                Done
              </button>
            </div>
            <ColorCustomization onClose={() => setShowColorOverlay(false)} />
          </div>
        </div>}

      {/* Invoice Preview Overlay */}
      {showInvoicePreview && <InvoicePreview settings={settings} onClose={() => setShowInvoicePreview(false)} />}

      {/* Client Details Drawer */}
      <ClientDetailsDrawer 
        isOpen={showClientDetails} 
        onClose={() => {
          setShowClientDetails(false);
        }} 
        client={selectedClient} 
      />
    </div>;
};