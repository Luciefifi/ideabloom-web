'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginInput, type RegisterInput } from './api';

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
    onSettled: () =>
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose: wipes all in-memory user data
      window.location.assign('/login'),
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
