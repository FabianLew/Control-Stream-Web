export interface SchemaBundleDto {
  bundleId: string;
  sha256: string;
  fileCount: number;
  sizeBytes: number;
  uploadedAt: string; // Instant -> string
}

export interface SchemaBundleDetailsDto extends SchemaBundleDto {
  files: string[];
}
