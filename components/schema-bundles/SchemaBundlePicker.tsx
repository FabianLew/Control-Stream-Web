"use client";

import * as React from "react";
import { Check, ChevronDown, Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type SchemaBundleDto = {
  bundleId: string;
  sha256: string;
  fileCount: number;
  sizeBytes: number;
  uploadedAt: string;
};

type Props = {
  value: string;
  onChange: (bundleId: string) => void;

  bundles: SchemaBundleDto[];
  isLoading?: boolean;

  onPreview?: (bundleId: string) => void;
  onDelete?: (bundleId: string) => Promise<void>;

  placeholder?: string;
  disabled?: boolean;
};

export function SchemaBundlePicker({
  value,
  onChange,
  bundles,
  isLoading,
  onPreview,
  onDelete,
  placeholder = "Select bundle...",
  disabled,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  );

  const selected = bundles.find((b) => b.bundleId === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between bg-background"
            disabled={disabled}
          >
            <span className="truncate font-mono text-xs">
              {selected?.bundleId || (isLoading ? "Loading..." : placeholder)}
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[440px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search bundleId / sha256..." />
            <CommandEmpty>No bundles found.</CommandEmpty>

            <CommandGroup heading="Schema Bundles">
              {bundles.map((b) => {
                const isSelected = b.bundleId === value;

                return (
                  <CommandItem
                    key={b.bundleId}
                    value={`${b.bundleId} ${b.sha256}`}
                    onSelect={() => {
                      onChange(b.bundleId);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs truncate">
                          {b.bundleId}
                        </span>
                        {isSelected && <Check className="h-4 w-4 opacity-70" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {b.fileCount} files • {b.sizeBytes} bytes
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPreview(b.bundleId);
                          }}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDeleteId(b.bundleId);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schema bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the bundle from the agent storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDeleteId || !onDelete) return;
                await onDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
