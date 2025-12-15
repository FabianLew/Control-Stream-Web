"use client";

import * as React from "react";
import { Upload, FileArchive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  disabled?: boolean;
  isUploading?: boolean;
  onFile: (file: File) => void;
};

export function SchemaBundleDropzone({ disabled, isUploading, onFile }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const pick = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".zip")) return;
    onFile(file);
  };

  return (
    <div
      className={[
        "rounded-xl border border-dashed p-4 transition-colors",
        isDragging ? "border-primary/60 bg-primary/5" : "border-border/60",
        disabled ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-border bg-muted/30 p-2">
            <FileArchive className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">
              Upload schema bundle (ZIP)
            </div>
            <div className="text-xs text-muted-foreground">
              Drag & drop a .zip with .proto / .avsc files, or click upload.
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={pick}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload ZIP
        </Button>
      </div>
    </div>
  );
}
