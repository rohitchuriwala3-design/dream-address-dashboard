"use client";

import { useEffect, useState } from "react";
import type { ColumnFiltersState, SortingState, Updater, VisibilityState } from "@tanstack/react-table";
import { useSession } from "@/lib/auth-client";

type ViewState = { columnVisibility: VisibilityState; sorting: SortingState; columnFilters: ColumnFiltersState };

const emptyState: ViewState = { columnVisibility: {}, sorting: [], columnFilters: [] };

/** Persist personal table layout in this browser without delaying server rendering. */
export function useCrmTableViewPreferences(scope: string) {
  const [state, setState] = useState<ViewState>(emptyState);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const key = isPending
    ? null
    : `mark4.crm.table.${scope}.v1:${session?.user?.id ?? "anonymous"}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!key) {
        setLoadedKey(null);
        setState(emptyState);
        return;
      }

      setLoadedKey(null);
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<ViewState>;
          setState({
            columnVisibility: parsed.columnVisibility && typeof parsed.columnVisibility === "object" ? parsed.columnVisibility : {},
            sorting: Array.isArray(parsed.sorting) ? parsed.sorting : [],
            columnFilters: Array.isArray(parsed.columnFilters) ? parsed.columnFilters : [],
          });
        } else {
          setState(emptyState);
        }
      } catch {
        setState(emptyState);
      }
      setLoadedKey(key);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!key || loadedKey !== key) return;
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { /* The table remains usable when storage is disabled or full. */ }
  }, [key, loadedKey, state]);

  return {
    state: key && loadedKey === key ? state : emptyState,
    loaded: Boolean(key && loadedKey === key),
    onColumnVisibilityChange: (updater: Updater<VisibilityState>) => setState((current) => ({ ...current, columnVisibility: typeof updater === "function" ? updater(current.columnVisibility) : updater })),
    onSortingChange: (updater: Updater<SortingState>) => setState((current) => ({ ...current, sorting: typeof updater === "function" ? updater(current.sorting) : updater })),
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => setState((current) => ({ ...current, columnFilters: typeof updater === "function" ? updater(current.columnFilters) : updater })),
    reset: () => setState(emptyState),
  };
}
