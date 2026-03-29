import * as LucideIcons from 'lucide-react';

/**
 * Resolve a Lucide icon component by export name (e.g. "Building2").
 */
export function getLucideIconByName(name) {
  if (!name || typeof name !== 'string') {
    return LucideIcons.Building2;
  }
  const Icon = LucideIcons[name];
  return Icon || LucideIcons.Building2;
}
