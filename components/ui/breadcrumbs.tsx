import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items?.length) return null;

  const lastIndex = items.length - 1;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn(
        "flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground print:hidden",
        className
      )}
    >
      {items.map((item, index) => {
        const isLast = index === lastIndex;
        const hideOnMobile = index > 0 && index < lastIndex;

        return (
          <div
            key={`${item.label}-${index}`}
            className={cn(
              "flex items-center gap-2",
              hideOnMobile && "max-[420px]:hidden"
            )}
          >
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            )}
            {isLast || !item.href ? (
              <span className="max-w-[140px] truncate font-medium text-foreground sm:max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="max-w-[120px] truncate text-muted-foreground transition-colors hover:text-white sm:max-w-[180px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

