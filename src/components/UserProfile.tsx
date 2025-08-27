import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Edit3, Plus, X } from 'lucide-react';
import { CustomField } from '@/types';

export const UserProfile: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [profile, setProfile] = useState(settings.userProfile);

  const handleInputChange = (field: string, value: string) => {
    const updatedProfile = {
      ...profile,
      [field]: value,
    };
    setProfile(updatedProfile);
    updateSettings({
      userProfile: updatedProfile,
    });
  };

  const handleCustomFieldChange = (id: string, field: 'label' | 'value', newValue: string) => {
    const updatedCustomFields = (profile.customFields || []).map(customField =>
      customField.id === id ? { ...customField, [field]: newValue } : customField
    );
    const updatedProfile = {
      ...profile,
      customFields: updatedCustomFields,
    };
    setProfile(updatedProfile);
    updateSettings({
      userProfile: updatedProfile,
    });
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: '',
      value: '',
    };
    const updatedProfile = {
      ...profile,
      customFields: [...(profile.customFields || []), newField],
    };
    setProfile(updatedProfile);
    updateSettings({
      userProfile: updatedProfile,
    });
  };

  const removeCustomField = (id: string) => {
    const updatedCustomFields = (profile.customFields || []).filter(field => field.id !== id);
    const updatedProfile = {
      ...profile,
      customFields: updatedCustomFields,
    };
    setProfile(updatedProfile);
    updateSettings({
      userProfile: updatedProfile,
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
    <div className="px-2.5">
      <div className="pt-5 mb-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[#09121F] text-[28px] font-bold leading-8">User profile</h1>
          <p className="text-[#09121F] text-sm">for display on your invoice</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-[#09121F] text-sm font-medium mb-2">Name</h3>
          <div className="flex items-center justify-between h-5">
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
          <div className="flex items-center justify-between h-5">
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
          <div className="flex items-center justify-between h-5">
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
          <div className="flex items-center justify-between h-5">
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
          <div className="flex items-center justify-between h-5">
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

        {/* Custom Fields */}
        {profile.customFields && profile.customFields.length > 0 && (
          <div className="space-y-4">
            {profile.customFields.map((customField) => (
              <div key={customField.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={customField.label}
                    onChange={(e) => handleCustomFieldChange(customField.id, 'label', e.target.value)}
                    placeholder="Field name"
                    className="text-[#09121F] text-sm font-medium bg-transparent border-none outline-none flex-1"
                  />
                  <button
                    onClick={() => removeCustomField(customField.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between h-5">
                  <input
                    type="text"
                    value={customField.value}
                    onChange={(e) => handleCustomFieldChange(customField.id, 'value', e.target.value)}
                    placeholder="Field value"
                    className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
                  />
                  <Edit3 size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Field Button */}
        <button
          onClick={addCustomField}
          className="flex items-center gap-2 text-[#09121F] text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <Plus size={16} />
          Custom Field
        </button>

      </div>
    </div>
  );
};