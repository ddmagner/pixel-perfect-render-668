import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

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
    <div className="px-5 py-4">
      <div className="space-y-4">
        <div>
          <label className="block text-[#09121F] text-[15px] font-bold mb-2">
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
            className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF]"
          />
        </div>

        <div>
          <label className="block text-[#09121F] text-[15px] font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF]"
          />
        </div>

        <div>
          <label className="block text-[#09121F] text-[15px] font-bold mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF]"
          />
        </div>

        <div>
          <label className="block text-[#09121F] text-[15px] font-bold mb-2">
            Address
          </label>
          <input
            type="text"
            value={profile.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter your street address"
            className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF]"
          />
        </div>

        <div>
          <label className="block text-[#09121F] text-[15px] font-bold mb-2">
            Zip Code
          </label>
          <input
            type="text"
            value={profile.zipCode || ''}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="Enter your zip code"
            className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#09121F] text-[15px] font-bold mb-2">
              City
            </label>
            <input
              type="text"
              value={profile.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City"
              className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF] bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-[#09121F] text-[15px] font-bold mb-2">
              State
            </label>
            <input
              type="text"
              value={profile.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
              className="w-full p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF] bg-gray-50"
              readOnly
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-[#09121F] text-white py-3 px-4 rounded-lg font-bold text-[15px] hover:bg-[#1a1a1a] transition-colors"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
};