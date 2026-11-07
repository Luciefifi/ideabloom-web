import { api } from '@/lib/api-client';

/** The user profile returned by the API (see ideabloom-api UserResponseDto). */
export interface User {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  timezone: string;
  createdAt: string;
}

interface AuthResponse {
  user: User;
}

interface MessageResponse {
  message: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileInput {
  displayName?: string;
  bio?: string | null;
  timezone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Calls to the auth endpoints. Tokens never appear here: the API sets them
 * as httpOnly cookies, which the browser stores and sends automatically.
 */
export const authApi = {
  me: () => api.get<User>('/users/me'),

  login: (input: LoginInput) =>
    api.post<AuthResponse>('/auth/login', input).then((r) => r.user),

  register: (input: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', input).then((r) => r.user),

  logout: () => api.post<void>('/auth/logout'),

  logoutAll: () => api.post<void>('/auth/logout-all'),

  updateProfile: (input: ProfileInput) => api.patch<User>('/users/me', input),

  /** Other devices are logged out; this one receives fresh session cookies. */
  changePassword: (input: ChangePasswordInput) =>
    api.post<AuthResponse>('/auth/change-password', input).then((r) => r.user),

  forgotPassword: (email: string) =>
    api.post<MessageResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<MessageResponse>('/auth/reset-password', { token, newPassword }),
};
