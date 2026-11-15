export type Role = 'PARTICIPANT' | 'PROGRAM_MANAGER';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; fullName: string; role: Role }) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

