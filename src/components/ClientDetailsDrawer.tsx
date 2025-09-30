import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Edit3, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';

interface ClientDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export const ClientDetailsDrawer: React.FC<ClientDetailsDrawerProps> = ({
  isOpen,
  onClose,
  client
}) => {
  const { settings, updateSettings } = useApp();
  const { toast } = useToast();
  
  const [attention, setAttention] = useState(client?.attention || '');
  const [address, setAddress] = useState(client?.address || '');
  const [city, setCity] = useState(client?.city || '');
  const [state, setState] = useState(client?.state || '');
  const [zipCode, setZipCode] = useState(client?.zip_code || '');

  // Update form when client changes
  useEffect(() => {
    if (client) {
      setAttention(client.attention || '');
      setAddress(client.address || '');
      setCity(client.city || '');
      setState(client.state || '');
      setZipCode(client.zip_code || '');
    }
  }, [client]);

  const handleSave = async () => {
    if (client) {
      const updatedClients = settings.clients.map(c => 
        c.id === client.id 
          ? { 
              ...c, 
              attention,
              address,
              city,
              state,
              zip_code: zipCode
            }
          : c
      );
      
      try {
        await updateSettings({ clients: updatedClients });
        toast({
          title: "Success",
          description: "Client details saved successfully",
        });
        onClose();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save client details",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'attention') setAttention(value);
    if (field === 'address') setAddress(value);
    if (field === 'city') setCity(value);
    if (field === 'state') setState(value);
    if (field === 'zipCode') setZipCode(value);
  };

  // Auto-populate city and state based on zip code
  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      const zipToLocation: { [key: string]: { city: string; state: string } } = {
        '10001': { city: 'New York', state: 'NY' },
        '90210': { city: 'Beverly Hills', state: 'CA' },
        '60601': { city: 'Chicago', state: 'IL' },
        '02101': { city: 'Boston', state: 'MA' },
        '33101': { city: 'Miami', state: 'FL' },
      };

      const location = zipToLocation[zipCode];
      if (location) {
        setCity(location.city);
        setState(location.state);
        handleInputChange('city', location.city);
        handleInputChange('state', location.state);
      }
    }
  }, [zipCode]);

  if (!client) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="mx-2 border-none bg-background rounded-t-[20px] max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[#09121F] text-xl font-bold">{client.name}</h1>
            <p className="text-[#09121F] text-sm">contact details</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-2 space-y-4">
          <div>
            <h3 className="text-[#09121F] text-sm font-medium mb-2">Attention</h3>
            <div className="flex items-center justify-between h-5">
              <input
                type="text"
                value={attention}
                onChange={(e) => handleInputChange('attention', e.target.value)}
                placeholder="Name"
                className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
              />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          <div>
            <h3 className="text-[#09121F] text-sm font-medium mb-2">Address</h3>
            <div className="flex items-center justify-between h-5">
              <input
                type="text"
                value={address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Address"
                className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
              />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          <div>
            <h3 className="text-[#09121F] text-sm font-medium mb-2">City</h3>
            <div className="flex items-center justify-between h-5">
              <input
                type="text"
                value={city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
              />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          <div>
            <h3 className="text-[#09121F] text-sm font-medium mb-2">State</h3>
            <div className="flex items-center justify-between h-5">
              <input
                type="text"
                value={state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
                className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
              />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          <div>
            <h3 className="text-[#09121F] text-sm font-medium mb-2">Zip Code</h3>
            <div className="flex items-center justify-between h-5">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="Zip code"
                className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
              />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 pb-6">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base font-medium rounded-none border-2 border-foreground"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-none"
            >
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};