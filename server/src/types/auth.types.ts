import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResponseDto {
  user: UserDto;
  token: string;
}

export interface StandardErrorEnvelope {
  error: {
    code: string;
    message: string;
    fieldErrors?: Array<{ field: string; message: string }>;
    correlationId?: string;
  };
}

