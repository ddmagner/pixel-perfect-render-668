import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ChevronLeft, Edit3 } from 'lucide-react';

const ClientAddressPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const clientId = searchParams.get('clientId');
  
  const client = settings.clients.find(c => c.id === clientId);
  const [attention, setAttention] = useState(client?.attention || '');
  const [address, setAddress] = useState(client?.address || '');
  const [city, setCity] = useState(client?.city || '');
  const [state, setState] = useState(client?.state || '');
  const [zipCode, setZipCode] = useState(client?.zip_code || '');

  const handleBack = () => {
    navigate('/?tab=settings');
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'attention') setAttention(value);
    if (field === 'address') setAddress(value);
    if (field === 'city') setCity(value);
    if (field === 'state') setState(value);
    if (field === 'zipCode') setZipCode(value);

    // Update client data
    if (client) {
      const updatedClients = settings.clients.map(c => 
        c.id === clientId 
          ? { 
              ...c, 
              attention: field === 'attention' ? value : attention,
              address: field === 'address' ? value : address,
              city: field === 'city' ? value : city,
              state: field === 'state' ? value : state,
              zip_code: field === 'zipCode' ? value : zipCode
            }
          : c
      );
      updateSettings({ clients: updatedClients });
    }
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
    return (
      <div className="flex w-full max-w-sm mx-auto flex-col items-start relative bg-white overflow-x-hidden"
           style={{ fontFamily: 'Gilroy, sans-serif' }}>
        <div className="p-4">Client not found</div>
      </div>
    );
  }

  return (
    <div
      className="flex w-full max-w-sm mx-auto flex-col items-start relative bg-white overflow-x-hidden"
      style={{ fontFamily: 'Gilroy, sans-serif' }}
    >
      {/* Navigation with back button */}
      <nav className="flex justify-center items-center self-stretch px-0 pt-4 pb-1 bg-white relative">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-[#09121F] absolute left-2.5"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex h-3.5 justify-end items-center">
          <div className="flex items-center gap-[9px]">
            <div>
              <img 
                src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
                alt="Logo" 
                className="w-[14px] h-[14px]"
              />
            </div>
            <div className="w-[91px] self-stretch">
              <img 
                src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
                alt="TIME IN Logo" 
                className="h-[14px] w-[91px]"
              />
            </div>
          </div>
        </div>
      </nav>
      
      <div className="px-2.5 w-full">
        <div className="pt-5 mb-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[#09121F] text-[28px] font-bold leading-8">{client.name}</h1>
            <p className="text-[#09121F] text-sm">contact details</p>
          </div>
        </div>
        
        <div className="space-y-4">
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
        </div>

        <div className="w-full px-2.5 pt-2.5 pb-1">
          <button 
            type="button" 
            className="w-full text-white py-3.5 font-bold text-[15px] transition-colors" 
            style={{
              backgroundColor: '#09121F'
            }} 
            aria-label="Save client details"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAddressPage;