/**
 * A full page load (not a client-side navigation). Used after logout and when
 * a session expires: reloading the page guarantees no personal data stays in
 * memory. Kept in one small function so tests can replace it.
 */
export function hardNavigate(path: string): void {
  window.location.assign(path);
}
