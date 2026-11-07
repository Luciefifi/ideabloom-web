'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hardNavigate } from '@/lib/navigation';
import {
  authApi,
  type ChangePasswordInput,
  type LoginInput,
  type ProfileInput,
  type RegisterInput,
} from './api';

export const currentUserQueryKey = ['auth', 'me'] as const;

/** The logged-in user. Shared by every component that needs it (one request, cached). */
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    // The response already contains the user, so no extra request is needed.
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: authApi.logout,
    // A full page load (not a client-side navigation) guarantees no personal
    // data stays in memory after logging out, even if the request failed.
    onSettled: () => hardNavigate('/login'),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}

export function useLogoutAll() {
  return useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => hardNavigate('/login'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => authApi.updateProfile(input),
    // Everywhere that shows the user (e.g. the sidebar menu) updates instantly.
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  });
}
