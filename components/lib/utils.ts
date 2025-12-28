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
import { isVendor, VENDOR_META } from "@/components/lib/vendors";

const isKafka = (v: StreamVendorConfigDto): v is KafkaStreamVendorConfigDto =>
  isVendor(v.vendor, VENDOR_META.KAFKA);

const isRabbit = (v: StreamVendorConfigDto): v is RabbitStreamVendorConfigDto =>
  isVendor(v.vendor, VENDOR_META.RABBIT);

const isPostgres = (
  v: StreamVendorConfigDto
): v is PostgresStreamVendorConfigDto => isVendor(v.vendor, VENDOR_META.POSTGRES);
