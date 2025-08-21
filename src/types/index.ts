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
}

export interface TaskType {
  id: string;
  name: string;
  hourlyRate?: number;
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
  address?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

export interface AppSettings {
  accentColor: string;
  invoiceMode: boolean;
  taskTypes: TaskType[];
  projects: Project[];
  clients: Client[];
  userProfile: UserProfile;
}

export type SortOption = 'date' | 'project' | 'task' | 'client';
export type ViewMode = 'timecard' | 'invoice';