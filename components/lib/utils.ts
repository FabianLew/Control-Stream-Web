import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// To jest standardowa funkcja pomocnicza w ekosystemie Next.js/Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import type {
  StreamVendorConfigDto,
  KafkaStreamVendorConfigDto,
  RabbitStreamVendorConfigDto,
  PostgresStreamVendorConfigDto,
} from "@/types/stream";

const isKafka = (v: StreamVendorConfigDto): v is KafkaStreamVendorConfigDto =>
  v.vendor === "KAFKA";

const isRabbit = (v: StreamVendorConfigDto): v is RabbitStreamVendorConfigDto =>
  v.vendor === "RABBIT";

const isPostgres = (
  v: StreamVendorConfigDto
): v is PostgresStreamVendorConfigDto => v.vendor === "POSTGRES";
