import { Preferences } from '@capacitor/preferences';

export const syncWidgetData = async (settings: { accentColor: string }) => {
  try {
    // Store widget data in shared preferences for iOS widget to access
    await Preferences.set({
      key: 'widget_accent_color',
      value: settings.accentColor || '#09121F'
    });
    
    // Store current time tracking status
    await Preferences.set({
      key: 'widget_status',
      value: 'ready' // could be 'ready', 'recording', etc.
    });
    
    console.log('Widget data synced:', settings.accentColor);
  } catch (error) {
    console.error('Failed to sync widget data:', error);
  }
};

export const getWidgetData = async () => {
  try {
    const accentColor = await Preferences.get({ key: 'widget_accent_color' });
    const status = await Preferences.get({ key: 'widget_status' });
    
    return {
      accentColor: accentColor.value || '#09121F',
      status: status.value || 'ready'
    };
  } catch (error) {
    console.error('Failed to get widget data:', error);
    return {
      accentColor: '#09121F',
      status: 'ready'
    };
  }
};