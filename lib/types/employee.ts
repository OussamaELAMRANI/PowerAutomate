export interface RoleDocument {
  id: string;
  name: string;
  fileName: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  documents: RoleDocument[];
}

export interface AppointmentDocument {
  id: string;
  name: string;
  fileName: string;
}

export interface Appointment {
  id: string;
  name: string;
  description?: string;
  documents: AppointmentDocument[];
}

export interface Employee {
  id: string;
  fullName: string;
  birthday: string;
  startDate: string;
  trainingDuration: string;
  roleId: string;
  appointmentIds: string[];
  /** IDs of role docs to include (filtered by user) */
  selectedRoleDocIds: string[];
  /** IDs of appointment docs to include (filtered by user) */
  selectedAppointmentDocIds: string[];
}

export interface GlobalProperties {
  companyName: string;
  companyEmail: string;
  companyAddress: string;
}

export interface TrainingDurationOption {
  id: string;
  name: string;
}

export interface ScannedTemplates {
  roles: Role[];
  appointments: Appointment[];
}
