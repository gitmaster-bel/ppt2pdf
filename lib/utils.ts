import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLanguageName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(code) || code;
  } catch (e) {
    return code;
  }
}

export function generateSlug(id: number | string, title?: string): string {
  if (!title) return id.toString();
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${id}-${cleanTitle}`;
}

export function getSiteUrl(): string {
  // Explicit override — works everywhere (set this in CF Pages env vars)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Cloudflare Pages auto-injects CF_PAGES_URL
  if (process.env.CF_PAGES_URL) {
    return process.env.CF_PAGES_URL;
  }
  // Vercel auto-injects NEXT_PUBLIC_VERCEL_URL (kept as fallback)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export function getContrastColor(hexcolor: string): string {
  if (!hexcolor || !hexcolor.startsWith('#')) return '#ffffff';
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 150) ? '#000000' : '#ffffff';
}
