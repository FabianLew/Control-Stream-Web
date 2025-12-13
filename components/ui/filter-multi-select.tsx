import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterMultiSelectProps {
  title: string; // np. "Streams" lub "Connections"
  options: FilterOption[]; // lista opcji
  selected: string[]; // tablica wybranych ID
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function FilterMultiSelect({
  title,
  options,
  selected,
  onChange,
  isLoading = false,
  placeholder = "Select...",
}: FilterMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Logika etykiety (Truncate / Licznik)
  const label = React.useMemo(() => {
    if (isLoading) return "Loading...";
    if (selected.length === 0) return `All ${title.toLowerCase()}`;
    if (selected.length === 1) {
      return options.find((o) => o.id === selected[0])?.label || selected[0];
    }
    return `${selected.length} ${title.toLowerCase()}`;
  }, [selected, options, title, isLoading]);

  // Handlery
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const clearSelection = () => onChange([]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 min-w-[190px] bg-background text-xs font-normal justify-between border-border"
        >
          <span className="truncate max-w-[160px]">{label}</span>
          <ChevronDown size={12} className="ml-2 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2 space-y-2"
        align="start"
        sideOffset={4}
      >
        {/* Header z Clear */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {selected.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] hover:bg-destructive/10 hover:text-destructive"
              onClick={clearSelection}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Opcja "All" */}
        <div className="flex items-center gap-2 py-1 px-1 hover:bg-muted/50 rounded-sm">
          <Checkbox
            id={`all-${title}`}
            checked={selected.length === 0}
            onCheckedChange={() => clearSelection()}
          />
          <label
            htmlFor={`all-${title}`}
            className="text-xs leading-none cursor-pointer flex-1 py-1"
          >
            All {title.toLowerCase()}
          </label>
        </div>

        {/* Lista opcji */}
        <ScrollArea className="h-[200px] -mx-1 pr-2">
          <div className="space-y-1">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center gap-2 py-1 px-1 hover:bg-muted/50 rounded-sm"
              >
                <Checkbox
                  id={`opt-${option.id}`}
                  checked={selected.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                />
                <label
                  htmlFor={`opt-${option.id}`}
                  className="text-xs leading-none cursor-pointer flex-1 py-1 truncate"
                  title={option.label}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
