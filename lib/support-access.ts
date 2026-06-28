export const SUPPORT_ACCESS_KEY = 'has_supported_zivox';
export const SUPPORT_ACCESS_UPDATED_EVENT = 'zivox_support_access_updated';

export const SHARE_ACCESS_MS = 8 * 60 * 60 * 1000; // 8 hours
export const MONTH_ACCESS_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export type SupportAccess = {
  isActive: boolean;
  expiresAt: number | null;
};

export function getSupportAccess(now = Date.now()): SupportAccess {
  if (typeof window === 'undefined') return { isActive: false, expiresAt: null };

  const rawValue = localStorage.getItem(SUPPORT_ACCESS_KEY);
  if (!rawValue) return { isActive: false, expiresAt: null };

  if (rawValue === 'true') {
    return { isActive: true, expiresAt: null };
  }

  const expiresAt = Number(rawValue);
  if (!Number.isFinite(expiresAt)) {
    localStorage.removeItem(SUPPORT_ACCESS_KEY);
    return { isActive: false, expiresAt: null };
  }

  if (expiresAt <= now) {
    localStorage.removeItem(SUPPORT_ACCESS_KEY);
    return { isActive: false, expiresAt: null };
  }

  return { isActive: true, expiresAt };
}

export function grantSupportAccess(durationMs: number, now = Date.now()): number {
  const expiresAt = now + durationMs;
  localStorage.setItem(SUPPORT_ACCESS_KEY, String(expiresAt));
  window.dispatchEvent(new Event(SUPPORT_ACCESS_UPDATED_EVENT));
  return expiresAt;
}

export function clearSupportAccess() {
  localStorage.removeItem(SUPPORT_ACCESS_KEY);
  window.dispatchEvent(new Event(SUPPORT_ACCESS_UPDATED_EVENT));
}
