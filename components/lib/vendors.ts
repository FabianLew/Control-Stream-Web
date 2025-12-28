import type { LucideIcon } from "lucide-react";
import { Activity, Layers, Database, Server, Radio, Zap } from "lucide-react";

export type KnownVendor = "KAFKA" | "RABBIT" | "POSTGRES";
export type VendorId = KnownVendor | "GENERIC";

type VendorTone = {
  ring: string;
  fg: string;
  bg: string;
  border: string;
};

type VendorSearchStyles = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeVariant: string;
  cardHover: string;
};

export type VendorMeta = {
  id: VendorId;
  label: string;
  displayName: string;
  connectionTitle: string;
  icon: LucideIcon;
  iconClass: string;
  headerBar: string;
  badgeClass: string;
  buttonAccent: string;
  tone: VendorTone;
  search: VendorSearchStyles;
};

const KAFKA: VendorMeta = {
  id: "KAFKA",
  label: "KAFKA",
  displayName: "Apache Kafka",
  connectionTitle: "Cluster Configuration",
  icon: Activity,
  iconClass: "text-purple-500",
  headerBar: "bg-purple-500",
  badgeClass:
    "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
  buttonAccent:
    "hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-600 dark:text-purple-400",
  tone: {
    ring: "ring-purple-500/20",
    fg: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  search: {
    icon: Activity,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    badgeVariant:
      "border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-500/10",
    cardHover: "hover:border-orange-500/30 hover:bg-orange-500/5",
  },
};

const RABBIT: VendorMeta = {
  id: "RABBIT",
  label: "RABBIT",
  displayName: "RabbitMQ",
  connectionTitle: "Broker Configuration",
  icon: Layers,
  iconClass: "text-orange-500",
  headerBar: "bg-orange-500",
  badgeClass:
    "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
  buttonAccent:
    "hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-600 dark:text-orange-400",
  tone: {
    ring: "ring-orange-500/20",
    fg: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  search: {
    icon: Radio,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    badgeVariant:
      "border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10",
    cardHover: "hover:border-rose-500/30 hover:bg-rose-500/5",
  },
};

const POSTGRES: VendorMeta = {
  id: "POSTGRES",
  label: "POSTGRES",
  displayName: "PostgreSQL",
  connectionTitle: "Database Configuration",
  icon: Database,
  iconClass: "text-blue-500",
  headerBar: "bg-blue-500",
  badgeClass:
    "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  buttonAccent:
    "hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400",
  tone: {
    ring: "ring-blue-500/20",
    fg: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  search: {
    icon: Database,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    badgeVariant:
      "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10",
    cardHover: "hover:border-blue-500/30 hover:bg-blue-500/5",
  },
};

export const VENDOR_META = {
  KAFKA,
  RABBIT,
  POSTGRES,
};

const GENERIC_VENDOR: VendorMeta = {
  id: "GENERIC",
  label: "GENERIC",
  displayName: "Generic",
  connectionTitle: "Connection Configuration",
  icon: Server,
  iconClass: "text-slate-500",
  headerBar: "bg-slate-500",
  badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  buttonAccent: "",
  tone: {
    ring: "ring-slate-500/20",
    fg: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  search: {
    icon: Zap,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-border/60",
    badgeVariant: "outline",
    cardHover: "hover:bg-muted/50",
  },
};

export const VENDOR_OPTIONS: VendorMeta[] = [
  VENDOR_META.KAFKA,
  VENDOR_META.RABBIT,
  VENDOR_META.POSTGRES,
];
export function getVendorMeta(rawType?: string | null): VendorMeta {
  const t = String(rawType ?? "").toUpperCase();

  if (t.includes("KAFKA")) return VENDOR_META.KAFKA;
  if (t.includes("RABBIT")) return VENDOR_META.RABBIT;
  if (t.includes("POSTGRES") || t.includes("DB")) return VENDOR_META.POSTGRES;

  return GENERIC_VENDOR;
}

export function isVendor(
  rawType: string | null | undefined,
  vendor: VendorMeta | VendorId
) {
  const id = typeof vendor === "string" ? vendor : vendor.id;
  return getVendorMeta(rawType).id === id;
}
