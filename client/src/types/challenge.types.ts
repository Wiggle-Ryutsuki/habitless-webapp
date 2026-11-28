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
  durationDays?: number;
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
  durationDays?: number;
  startDate?: string;
  endDate?: string;
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
  durationDays?: number;
  currentDay?: number;
  daysRemaining?: number;
  isCompleted?: boolean;
  hasUnresolvedEndedHabits?: boolean;
  updateAvailable?: boolean;
}

export interface ChallengeItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  durationDays?: number;
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

export interface ManagerAnalyticsSummary {
  totalPublishedChallenges: number;
  totalActiveEnrollments: number;
  totalCompletedEnrollments: number;
}

export interface ManagerPopularChallenge {
  id: number;
  title: string;
  category: string;
  durationDays: number;
  managerName: string;
  enrollmentCount: number;
  averageRating: number;
}

export interface ManagerTopCategoryCustom {
  category: string;
  challengesCount: number;
  totalEnrollments: number;
  completionRate: number;
}

export interface ManagerTopCategory {
  category: string;
  isPreset: boolean;
  challengesCount: number;
  totalEnrollments: number;
  completionRate: number;
  customCategories?: ManagerTopCategoryCustom[];
}

export interface ManagerAnalyticsData {
  summary: ManagerAnalyticsSummary;
  mostPopularChallenges: ManagerPopularChallenge[];
  topCategories: ManagerTopCategory[];
}

export interface ManagerDirectoryItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  version: number;
  manager: {
    id: number;
    fullName: string;
  };
  isOwnedByMe: boolean;
  activitiesCount: number;
  enrollmentsCount: number;
  averageRating: number;
  ratingsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerDirectoryDetail {
  id: number;
  title: string;
  description: string | null;
  category: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  version: number;
  manager: {
    id: number;
    fullName: string;
  };
  isOwnedByMe: boolean;
  activities: PublicChallengeActivity[];
  averageRating: number;
  ratingsCount: number;
  comments: ChallengeCommentItem[];
  enrollmentsCount: number;
  createdAt: string;
  updatedAt: string;
}
