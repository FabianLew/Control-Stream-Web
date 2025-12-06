"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (correlationId: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
        <Input 
          placeholder="Enter Correlation ID (e.g. trace-123)..." 
          className="pl-10 bg-background-main border-border text-text-primary h-11 focus-visible:ring-primary"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading}
        className="h-11 px-6 bg-primary hover:bg-primary-hover text-white font-medium shadow-lg shadow-primary/20"
      >
        {isLoading ? "Searching..." : "Search Logs"}
      </Button>
    </form>
  );
}