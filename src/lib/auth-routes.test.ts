import { describe, expect, it } from 'vitest';
import { decideRoute, getSafeRedirect } from './auth-routes';

describe('decideRoute', () => {
  describe('logged out', () => {
    it('sends app pages to login, remembering where the visitor was going', () => {
      expect(decideRoute('/ideas/123', '?tab=notes', false)).toEqual({
        type: 'redirect',
        location: '/login?next=%2Fideas%2F123%3Ftab%3Dnotes',
      });
    });

    it('sends the home page to login without a ?next=', () => {
      expect(decideRoute('/', '', false)).toEqual({
        type: 'redirect',
        location: '/login',
      });
    });

    it.each(['/login', '/register', '/forgot-password', '/reset-password'])(
      'allows %s',
      (path) => {
        expect(decideRoute(path, '', false)).toEqual({ type: 'allow' });
      },
    );

    it('does not treat look-alike paths as public', () => {
      expect(decideRoute('/login-history', '', false).type).toBe('redirect');
    });
  });

  describe('logged in', () => {
    it('allows app pages', () => {
      expect(decideRoute('/dashboard', '', true)).toEqual({ type: 'allow' });
    });

    it.each(['/login', '/register', '/forgot-password'])(
      'skips %s and goes to the dashboard',
      (path) => {
        expect(decideRoute(path, '', true)).toEqual({
          type: 'redirect',
          location: '/dashboard',
        });
      },
    );

    it('still allows the reset-password page (e.g. a link opened while logged in)', () => {
      expect(decideRoute('/reset-password', '?token=x', true)).toEqual({
        type: 'allow',
      });
    });
  });
});

describe('getSafeRedirect', () => {
  it.each([
    ['/ideas/123', '/ideas/123'],
    ['/tasks?filter=overdue', '/tasks?filter=overdue'],
    [null, '/dashboard'],
    ['', '/dashboard'],
  ])('%s → %s', (next, expected) => {
    expect(getSafeRedirect(next)).toBe(expected);
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/login',
    '/register?x=1',
  ])('refuses %s (open redirect or loop)', (next) => {
    expect(getSafeRedirect(next)).toBe('/dashboard');
  });
});
