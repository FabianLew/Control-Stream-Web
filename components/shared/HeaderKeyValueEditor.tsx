"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface HeaderEntry {
  key: string;
  value: string;
}

interface Props {
  entries: HeaderEntry[];
  onChange: (entries: HeaderEntry[]) => void;
  disabled?: boolean;
}

export function HeaderKeyValueEditor({ entries, onChange, disabled }: Props) {
  const add = () => onChange([...entries, { key: "", value: "" }]);

  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));

  const updateKey = (i: number, key: string) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, key } : e)));

  const updateValue = (i: number, value: string) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, value } : e)));

  return (
    <div className="space-y-1.5">
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 py-1">
          No headers — click Add to include one.
        </p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={entry.key}
                onChange={(e) => updateKey(i, e.target.value)}
                disabled={disabled}
                placeholder="Header name"
                className="font-mono text-xs h-8 flex-1"
              />
              <Input
                value={entry.value}
                onChange={(e) => updateValue(i, e.target.value)}
                disabled={disabled}
                placeholder="Value"
                className="font-mono text-xs h-8 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                disabled={disabled}
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-none"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={add}
        disabled={disabled}
        className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
      >
        <Plus size={12} />
        Add header
      </Button>
    </div>
  );
}
