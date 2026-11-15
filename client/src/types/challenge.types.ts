import { FrequencyType } from './habit.js';

export type ProgramStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProgramActivity {
  id?: number;
  programId?: number;
  title: string;
  description?: string | null;
  frequency: FrequencyType;
  daysOfWeek?: number[];
  targetCount: number;
  createdAt?: string;
}

export interface ChallengeProgram {
  id: number;
  managerId?: number;
  title: string;
  description: string | null;
  category: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  previouslyPublished?: boolean;
  enrollmentsCount?: number;
  activitiesCount?: number;
  activities?: ProgramActivity[];
  inviteUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProgramPayload {
  title: string;
  category: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  activities: {
    title: string;
    description?: string | null;
    frequency?: FrequencyType;
    daysOfWeek?: number[];
    targetCount?: number;
  }[];
}

export interface UpdateProgramPayload extends CreateProgramPayload {}

export interface PublicChallengeActivity {
  id: number;
  title: string;
  description: string | null;
  frequency: FrequencyType;
  daysOfWeek?: number[];
  targetCount: number;
}

export interface PublicChallenge {
  id: number;
  title: string;
  description: string | null;
  category: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  manager: {
    fullName: string;
  };
  activities: PublicChallengeActivity[];
}

export interface JoinChallengeResponse {
  enrollmentId: number;
  programId: number;
  participantId: number;
  enrolledAt: string;
  habitsCreatedCount: number;
  message: string;
}
