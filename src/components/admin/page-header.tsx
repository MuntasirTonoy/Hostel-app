"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/types/accounting";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: AccountStatus }) {
  const { t } = useI18n();
  return status === "PUBLISHED" ? (
    <Badge className="bg-primary text-primary-foreground">{t.common.published}</Badge>
  ) : (
    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      {t.common.draft}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        {icon ? <span className={cn(highlight && "text-primary")}>{icon}</span> : null}
      </div>
      <p className={cn("mt-2 text-xl font-bold tabular-nums sm:text-2xl", highlight && "text-primary")}>
        {value}
      </p>
    </div>
  );
}
