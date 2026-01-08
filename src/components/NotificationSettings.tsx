import React from 'react';
import { useApp } from '@/context/AppContext';
import { Switch } from '@/components/ui/switch';
import { NotificationPreferences } from '@/types';

interface CircularCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

const CircularCheckbox: React.FC<CircularCheckboxProps> = ({ 
  checked, 
  onCheckedChange, 
  label 
}) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-[15px] font-medium text-[#09121F]">{label}</span>
    <div 
      className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${checked ? 'bg-gray-300' : 'bg-white'}`}
      onClick={() => onCheckedChange(!checked)}
    >
      {checked && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
    </div>
  </div>
);

interface NestedToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

const NestedToggle: React.FC<NestedToggleProps> = ({ 
  checked, 
  onCheckedChange, 
  label 
}) => (
  <div className="flex items-center justify-between py-3 pl-4">
    <span className="text-[15px] font-medium text-[#09121F]">{label}</span>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
    />
  </div>
);

export function NotificationSettings() {
  const { settings, updateSettings } = useApp();
  const prefs = settings.notificationPreferences;

  const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
    updateSettings({
      notificationPreferences: {
        ...prefs,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-0">
      {/* Push notifications section */}
      <div>
        <h2 className="text-[15px] font-bold text-[#09121F] pb-2">Push notifications</h2>
        <div className="h-px bg-[#09121F] mb-1" />
        
        {/* Use-based reminders with nested Include weekends */}
        <CircularCheckbox
          checked={prefs.useBasedReminders}
          onCheckedChange={(checked) => updatePref('useBasedReminders', checked)}
          label="Use-based reminders"
        />
        
        {prefs.useBasedReminders && (
          <NestedToggle
            checked={prefs.includeWeekends}
            onCheckedChange={(checked) => updatePref('includeWeekends', checked)}
            label="Include weekends"
          />
        )}
        
        <CircularCheckbox
          checked={prefs.subscriptionAlerts}
          onCheckedChange={(checked) => updatePref('subscriptionAlerts', checked)}
          label="Subscription alerts"
        />
        
        <CircularCheckbox
          checked={prefs.productUpdates}
          onCheckedChange={(checked) => updatePref('productUpdates', checked)}
          label="Product updates & news"
        />
        
        <CircularCheckbox
          checked={prefs.recommendations}
          onCheckedChange={(checked) => updatePref('recommendations', checked)}
          label="Recommendations"
        />
        
        <CircularCheckbox
          checked={prefs.userFeedbackSurveys}
          onCheckedChange={(checked) => updatePref('userFeedbackSurveys', checked)}
          label="User feedback surveys"
        />
        
        <CircularCheckbox
          checked={prefs.discountsRewards}
          onCheckedChange={(checked) => updatePref('discountsRewards', checked)}
          label="Discounts, rewards & referral offers"
        />
      </div>

      {/* Email section */}
      <div className="pt-6">
        <h2 className="text-[15px] font-bold text-[#09121F] pb-2">Email</h2>
        <div className="h-px bg-[#09121F] mb-1" />
        
        <CircularCheckbox
          checked={prefs.emailSubscriptionAlerts}
          onCheckedChange={(checked) => updatePref('emailSubscriptionAlerts', checked)}
          label="Subscription alerts"
        />
        
        <CircularCheckbox
          checked={prefs.emailProductUpdates}
          onCheckedChange={(checked) => updatePref('emailProductUpdates', checked)}
          label="Product updates & news"
        />
        
        <CircularCheckbox
          checked={prefs.emailMarketingOffers}
          onCheckedChange={(checked) => updatePref('emailMarketingOffers', checked)}
          label="Marketing offers"
        />
      </div>
    </div>
  );
}
