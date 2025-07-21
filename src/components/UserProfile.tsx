import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Edit3 } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [profile, setProfile] = useState(settings.userProfile);

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateSettings({
      userProfile: profile,
    });
  };

  // Auto-populate city and state based on zip code (simplified version)
  useEffect(() => {
    if (profile.zipCode && profile.zipCode.length === 5) {
      // This is a simplified example. In a real app, you'd use a zip code API
      const zipToLocation: { [key: string]: { city: string; state: string } } = {
        '10001': { city: 'New York', state: 'NY' },
        '90210': { city: 'Beverly Hills', state: 'CA' },
        '60601': { city: 'Chicago', state: 'IL' },
        '02101': { city: 'Boston', state: 'MA' },
        '33101': { city: 'Miami', state: 'FL' },
      };

      const location = zipToLocation[profile.zipCode];
      if (location) {
        setProfile(prev => ({
          ...prev,
          city: location.city,
          state: location.state,
        }));
      }
    }
  }, [profile.zipCode]);

  return (
    <div className="px-5">
      <div className="pt-5 mb-3">
        <h3 className="text-[#09121F] text-sm font-bold">User profile</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-[#09121F] text-sm font-medium mb-2">Name</h3>
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              value={profile.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Full name"
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <Edit3 size={16} className="text-gray-400" />
          </div>
        </div>

        <div>
          <h3 className="text-[#09121F] text-sm font-medium mb-2">Address</h3>
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              value={profile.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Address"
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <Edit3 size={16} className="text-gray-400" />
          </div>
        </div>

        <div>
          <h3 className="text-[#09121F] text-sm font-medium mb-2">Zip Code</h3>
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              value={profile.zipCode || ''}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="Zip code"
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <Edit3 size={16} className="text-gray-400" />
          </div>
        </div>

        <div>
          <h3 className="text-[#09121F] text-sm font-medium mb-2">Email</h3>
          <div className="flex items-center justify-between py-2">
            <input
              type="email"
              value={profile.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Email"
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <Edit3 size={16} className="text-gray-400" />
          </div>
        </div>

        <div>
          <h3 className="text-[#09121F] text-sm font-medium mb-2">Phone</h3>
          <div className="flex items-center justify-between py-2">
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="000-000-0000"
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <Edit3 size={16} className="text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-[#09121F] text-white py-4 px-4 rounded-lg font-bold text-sm mt-8"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
};