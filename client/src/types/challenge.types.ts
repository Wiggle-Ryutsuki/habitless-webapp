import { FrequencyType } from './habit.js';

export type ProgramStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ChallengeHabitStatus = 'ACTIVE' | 'ENDED';
export type EnrollmentStatus = 'ACTIVE' | 'LEFT' | 'COMPLETED';

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
  version?: number;
  hasTemplateEditsSincePublish?: boolean;
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
    id?: number;
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

export interface ChallengeAuthor {
  id: number;
  fullName: string;
  role: 'PARTICIPANT' | 'PROGRAM_MANAGER';
}

export interface ChallengeCommentItem {
  id: number;
  programId: number;
  parentCommentId: number | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author: ChallengeAuthor;
  replies?: ChallengeCommentItem[];
}

export interface ChallengeEnrollmentInfo {
  id?: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  leftAt?: string | null;
  isActive?: boolean;
  hasUnresolvedEndedHabits?: boolean;
  updateAvailable?: boolean;
}

export interface ChallengeItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  version: number;
  manager: {
    fullName: string;
  };
  activitiesCount: number;
  enrollmentsCount: number;
  averageRating: number;
  ratingsCount: number;
  myEnrollment: ChallengeEnrollmentInfo | null;
}

export interface PublicChallenge extends ChallengeItem {
  myRating?: number | null;
  activities: PublicChallengeActivity[];
  comments?: ChallengeCommentItem[];
}

export interface JoinChallengeResponse {
  enrollmentId: number;
  programId: number;
  participantId: number;
  enrolledAt: string;
  habitsCreatedCount: number;
  message: string;
}

export interface LeaveChallengeResponse {
  programId: number;
  action: 'KEEP' | 'REMOVE';
  affectedHabitsCount: number;
  message: string;
}

export interface SyncChallengeResponse {
  programId: number;
  syncedVersion: number;
  updatedCount: number;
  addedCount: number;
}

export interface RateChallengeResponse {
  programId: number;
  rating: number;
  averageRating: number;
  ratingsCount: number;
}
