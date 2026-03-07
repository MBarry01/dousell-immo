/**
 * Breadcrumb — Navigation breadcrumb UI component
 *
 * Pure server component for rendering accessible breadcrumb navigation.
 * Uses Vitrine glassmorphism dark theme (gold separators, white/60 inactive items).
 *
 * Rationale for new component: No existing breadcrumb found in codebase.
 * Reused by both district page and type page — single source of truth.
 */

import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="mb-4 px-4 sm:px-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-[#F4C430]/50" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span className={isLast ? 'text-white' : 'text-white/60'}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
