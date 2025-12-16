"use client";

import { CopyButton } from "@/components/shared/CopyButton";

const safeStringify = (v: unknown) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

export function JsonBlock({ value }: { value: unknown }) {
  const text = safeStringify(value);

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton
          text={text}
          label="JSON"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        />
      </div>

      <pre className="text-xs font-mono text-foreground/80 bg-slate-950 dark:bg-slate-900 p-4 rounded-lg border border-border overflow-x-auto leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
