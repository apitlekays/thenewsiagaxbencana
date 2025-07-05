// Get version from environment variable or fallback
export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.3';
} 