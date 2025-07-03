export function getSeverityBadge(severity: string) {
  // Water level severities
  if (severity === 'Danger') return 'bg-red-500/20 text-red-300 border-red-500/30';
  if (severity === 'Warning') return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  if (severity === 'Alert') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  // Rainfall severities
  if (severity?.toLowerCase() === 'very heavy') return 'bg-red-500/20 text-red-300 border-red-500/30';
  if (severity?.toLowerCase() === 'heavy') return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  if (severity?.toLowerCase() === 'moderate') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  return 'bg-green-500/20 text-green-300 border-green-500/30';
} 