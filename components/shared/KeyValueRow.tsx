"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";

export function KeyValueRow({
  label,
  value,
  mono,
  copyText,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyText?: string | null;
}) {
  const canCopy = typeof copyText === "string" && copyText.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="sm:col-span-3 flex items-center gap-2">
        <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
        {canCopy ? (
          <CopyButton
            text={copyText}
            label={label}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          />
        ) : null}
      </div>
    </div>
  );
}
