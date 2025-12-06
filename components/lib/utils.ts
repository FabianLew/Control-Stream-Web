import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// To jest standardowa funkcja pomocnicza w ekosystemie Next.js/Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}