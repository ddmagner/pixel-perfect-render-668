import React from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FREQUENCY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays only' },
  { value: 'weekly', label: 'Weekly (Fridays)' },
];

const TIME_OPTIONS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
];

export function NotificationSettings() {
  const { settings, updateSettings } = useApp();
  const prefs = settings.notificationPreferences;

  const handleToggleNotifications = () => {
    updateSettings({
      notificationPreferences: {
        ...prefs,
        notificationsEnabled: !prefs.notificationsEnabled,
      },
    });
  };

  const handleFrequencyChange = (value: string) => {
    updateSettings({
      notificationPreferences: {
        ...prefs,
        reminderFrequency: value as 'never' | 'daily' | 'weekdays' | 'weekly',
      },
    });
  };

  const handleTimeChange = (value: string) => {
    updateSettings({
      notificationPreferences: {
        ...prefs,
        reminderTime: value,
      },
    });
  };

  const handleWeekendToggle = () => {
    updateSettings({
      notificationPreferences: {
        ...prefs,
        weekendReminders: !prefs.weekendReminders,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          {prefs.notificationsEnabled ? (
            <Bell size={20} className="text-foreground" />
          ) : (
            <BellOff size={20} className="text-muted-foreground" />
          )}
          <div>
            <div className="text-[15px] font-medium text-foreground">
              Push Notifications
            </div>
            <div className="text-sm text-muted-foreground">
              Get reminded to log your time
            </div>
          </div>
        </div>
        <Switch
          checked={prefs.notificationsEnabled}
          onCheckedChange={handleToggleNotifications}
        />
      </div>

      {prefs.notificationsEnabled && (
        <>
          {/* Frequency */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="text-[15px] text-foreground">Reminder frequency</div>
            <Select
              value={prefs.reminderFrequency}
              onValueChange={handleFrequencyChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          {prefs.reminderFrequency !== 'never' && (
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-muted-foreground" />
                <div className="text-[15px] text-foreground">Reminder time</div>
              </div>
              <Select value={prefs.reminderTime} onValueChange={handleTimeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Weekend toggle - only show for daily frequency */}
          {prefs.reminderFrequency === 'daily' && (
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div className="text-[15px] text-foreground">
                Include weekends
              </div>
              <Switch
                checked={prefs.weekendReminders}
                onCheckedChange={handleWeekendToggle}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
