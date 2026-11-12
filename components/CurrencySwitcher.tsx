"use client";

import { Button } from "@/components/ui/button";

export function CurrencySwitcher() {
  return (
    <Button variant="outline" size="sm" className="gap-1 text-xs font-medium" aria-label="Currency: Indian rupee">
      <span>₹</span>
      <span>INR</span>
    </Button>
  );
}
