/**
 * Utility function to merge class names
 * Combines Tailwind CSS classes with conditional logic
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

