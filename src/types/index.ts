export interface TimeEntry {
  id: string;
  duration: number; // in hours
  task: string;
  project: string;
  client?: string;
  date: string; // ISO date string
  submittedAt: string; // ISO datetime string
  hourlyRate?: number; // for invoice mode
  archived?: boolean; // for archive functionality
  noCharge?: boolean; // for no-charge entries (fee = $0, doesn't affect hourly rate settings)
}

export interface TaskType {
  id: string;
  name: string;
  hourlyRate?: number;
}

export interface TaxType {
  id: string;
  name: string;
  rate?: number; // percentage rate
}

export interface Project {
  id: string;
  name: string;
  clientId?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  attention?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  customFields?: CustomField[];
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  reminderFrequency: 'never' | 'daily' | 'weekdays' | 'weekly';
  reminderTime: string; // HH:mm format
  weekendReminders: boolean;
  // Push notification preferences
  useBasedReminders: boolean;
  includeWeekends: boolean;
  subscriptionAlerts: boolean;
  productUpdates: boolean;
  recommendations: boolean;
  userFeedbackSurveys: boolean;
  discountsRewards: boolean;
  // Email preferences
  emailSubscriptionAlerts: boolean;
  emailProductUpdates: boolean;
  emailMarketingOffers: boolean;
}

export interface AppSettings {
  accentColor: string;
  invoiceMode: boolean;
  invoiceNumber: number;
  taskTypes: TaskType[];
  taxTypes: TaxType[];
  projects: Project[];
  clients: Client[];
  userProfile: UserProfile;
  notificationPreferences: NotificationPreferences;
}

export type SortOption = 'date' | 'project' | 'task' | 'client';
export type ViewMode = 'timecard' | 'invoice';