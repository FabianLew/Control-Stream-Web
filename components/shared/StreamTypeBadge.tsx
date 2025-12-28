import { Badge } from "@/components/ui/badge";
import { getVendorMeta } from "@/components/lib/vendors";

interface StreamTypeBadgeProps {
  type: string;
  className?: string;
}

export function StreamTypeBadge({ type, className }: StreamTypeBadgeProps) {
  const normalizedType = type ? type.toUpperCase() : "UNKNOWN";
  const vendor = getVendorMeta(normalizedType);

  return (
    <Badge
      variant="outline"
      className={`border ${vendor.badgeClass} font-mono text-[10px] px-2 py-0.5 whitespace-nowrap ${className || ""}`}
    >
      {type || "UNKNOWN"}
    </Badge>
  );
}
