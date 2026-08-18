import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date, not UTC.
 * This prevents timezone issues where "2025-12-26" becomes Dec 25 in local time.
 */
export function parseLocalDate(dateString: string): Date {
  // If it's a date-only string (YYYY-MM-DD), parse it as local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  // Otherwise, parse normally (for timestamps with time component)
  return new Date(dateString)
}

/** Initials for avatar fallbacks: "Alex Dreier" → "AD", else first char of fallback. */
export function getInitials(fullName?: string | null, fallback?: string | null): string {
  if (fullName) {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }
  return fallback?.[0]?.toUpperCase() || '?'
}

/** Strip HTML tags and decode common entities (for plain-text contexts). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}
