/**
 * Security utilities for frontend protection
 */

// HTML entity encoding to prevent XSS
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Obfuscate email address to prevent spam
 */
export function obfuscateEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  // Obfuscate the local part (before @)
  const obfuscatedLocal = localPart.length > 2 
    ? localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1)
    : localPart;
  
  // Obfuscate the domain part
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    const tld = domainParts.pop(); // Get the last part (com, org, etc.)
    const domainName = domainParts.join('.');
    const obfuscatedDomain = domainName.length > 2
      ? domainName.charAt(0) + '*'.repeat(domainName.length - 2) + domainName.charAt(domainName.length - 1)
      : domainName;
    return `${obfuscatedLocal}@${obfuscatedDomain}.${tld}`;
  }
  
  return `${obfuscatedLocal}@${domain}`;
}

/**
 * Get obfuscated email for display
 */
export function getObfuscatedEmail(email: string): string {
  return obfuscateEmail(email);
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }
  
  if (typeof input !== 'string') return null;
  
  const num = parseFloat(input.trim());
  return isFinite(num) ? num : null;
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInteger(input: string | number): number | null {
  const num = sanitizeNumber(input);
  return num !== null && Number.isInteger(num) ? num : null;
}

/**
 * Validate coordinate values (latitude/longitude)
 */
export function validateCoordinate(value: string | number): boolean {
  const num = sanitizeNumber(value);
  if (num === null) return false;
  
  return num >= -180 && num <= 180;
}

/**
 * Validate latitude specifically
 */
export function validateLatitude(value: string | number): boolean {
  const num = sanitizeNumber(value);
  if (num === null) return false;
  
  return num >= -90 && num <= 90;
}

/**
 * Validate longitude specifically
 */
export function validateLongitude(value: string | number): boolean {
  return validateCoordinate(value);
}

/**
 * Sanitize and validate station ID
 */
export function sanitizeStationId(input: string): string | null {
  if (typeof input !== 'string') return null;
  
  // Station IDs should be alphanumeric and not too long
  const sanitized = input.trim();
  if (sanitized.length === 0 || sanitized.length > 50) return null;
  
  // Only allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return null;
  
  return sanitized;
}

/**
 * Sanitize and validate date strings
 */
export function sanitizeDateString(input: string): string | null {
  if (typeof input !== 'string') return null;
  
  const sanitized = input.trim();
  if (sanitized.length === 0) return null;
  
  // Basic date format validation (DD/MM/YYYY HH:MM)
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/;
  if (!dateRegex.test(sanitized)) return null;
  
  // Try to parse the date
  try {
    const [datePart, timePart] = sanitized.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    const date = new Date(year, month - 1, day, hour, minute);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) return null;
    
    // Check if date is not too far in the future (within 1 year)
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (date > oneYearFromNow) return null;
    
    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Sanitize text content for display
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Encode HTML entities
  return sanitizeHtml(withoutTags);
}

/**
 * Validate severity level
 */
export function validateSeverityLevel(input: string): string | null {
  if (typeof input !== 'string') return null;
  
  const validLevels = ['normal', 'alert', 'warning', 'danger'];
  const sanitized = input.trim().toLowerCase();
  
  return validLevels.includes(sanitized) ? sanitized : null;
}

/**
 * Create a safe object with only allowed properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: Record<string, unknown>, 
  allowedKeys: (keyof T)[]
): Partial<T> {
  if (typeof obj !== 'object' || obj === null) return {};
  
  const sanitized: Partial<T> = {};
  
  for (const key of allowedKeys) {
    if (key in obj && obj[key as string] !== undefined && obj[key as string] !== null) {
      sanitized[key] = obj[key as string] as T[keyof T];
    }
  }
  
  return sanitized;
}

/**
 * Debounce function to prevent excessive API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 