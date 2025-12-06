import { Badge } from "@/components/ui/badge";

interface StreamTypeBadgeProps {
  type: string;
  className?: string; // Opcjonalnie, jeśli chciałbyś nadpisać style z zewnątrz
}

export function StreamTypeBadge({ type, className }: StreamTypeBadgeProps) {
  // Normalize to uppercase
  const normalizedType = type ? type.toUpperCase() : "UNKNOWN";

  const styles: Record<string, string> = {
    KAFKA: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
    RABBIT: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
    POSTGRES: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    DB: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20", 
  };

  let matchClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  
  // Logika dopasowania po słowach kluczowych
  if (normalizedType.includes("KAFKA")) matchClass = styles.KAFKA;
  else if (normalizedType.includes("RABBIT")) matchClass = styles.RABBIT;
  else if (normalizedType.includes("POSTGRES") || normalizedType.includes("DB")) matchClass = styles.POSTGRES;

  return (
    <Badge 
      variant="outline" 
      className={`border ${matchClass} font-mono text-[10px] px-2 py-0.5 whitespace-nowrap ${className || ''}`}
    >
      {type || "UNKNOWN"}
    </Badge>
  );
}