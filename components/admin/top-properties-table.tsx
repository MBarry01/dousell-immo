"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type TopProperty = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  views: number;
  clicks: number;
};

export function TopPropertiesTable({ properties }: { properties: TopProperty[] }) {
  if (properties.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className="w-full text-left text-sm text-foreground/80">
        <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Bien</th>
            <th className="px-4 py-3 font-medium text-right">Vues</th>
            <th className="px-4 py-3 font-medium text-right">Contacts</th>
            <th className="px-4 py-3 font-medium text-right">Conv.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {properties.map((property) => {
            const conversionRate =
              property.views > 0
                ? ((property.clicks / property.views) * 100).toFixed(1)
                : "0.0";

            return (
              <tr key={property.id} className="group hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/biens/${property.id}`}
                    target="_blank"
                    className="flex items-center gap-3 group/link"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-muted flex-shrink-0 transition-transform group-hover/link:scale-105">
                      {property.image ? (
                        <Image
                          src={property.image}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                          IMG
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium text-foreground group-hover/link:text-primary transition-colors">
                          {property.title}
                        </p>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {property.price.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground/70">
                  {property.views}
                </td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                  {property.clicks}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {conversionRate}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

