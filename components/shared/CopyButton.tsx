"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyWithToast } from "@/components/lib/copy";

export function CopyButton({
  text,
  label,
  size = "icon",
  variant = "ghost",
  className,
  iconSize = 14,
}: {
  text: string;
  label?: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary" | "default";
  className?: string;
  iconSize?: number;
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        const ok = await copyWithToast(text, { label });
        if (!ok) return;
        setCopied(true);
        window.setTimeout(() => setCopied(false), 900);
      }}
      title={label ? `Copy ${label}` : "Copy"}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </Button>
  );
}
