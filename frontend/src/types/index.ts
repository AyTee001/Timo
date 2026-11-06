export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  timeEntriesCount: number;
}

export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  projectId: string;
  projectName: string;
  durationMinutes: number;
  description: string;
}

export type Page = 'dashboard' | 'time-entries' | 'projects';

export interface TimeEntryFormData {
  projectId: string;
  date: string;
  duration: string;
  description: string;
}

export interface TimeEntryInput {
  projectId: string;
  date: string;
  durationMinutes: number;
  description: string;
}

export type TimeEntryFormErrors = Partial<Record<keyof TimeEntryFormData, string>>;

export interface ProjectFormData {
  name: string;
  description: string;
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;
