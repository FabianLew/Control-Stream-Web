"use client";

import type React from "react";
import { useMemo } from "react";

import type { LiveFiltersState } from "@/components/live/LiveView";
import type { UUID } from "@/types/live";
import { FilterMultiSelect } from "@/components/ui/filter-multi-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Loader2,
  ChevronDown,
  Play,
  Trash2,
  RefreshCcw,
  Pause,
  Radio,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";

type StreamOption = { id: UUID; name: string };

function normalizeIds(ids: UUID[]) {
  return [...(ids ?? [])].map(String).sort().join(",");
}

export function LiveHeader(props: {
  filters: LiveFiltersState;
  onFiltersChange: (next: LiveFiltersState) => void;

  streams: StreamOption[];
  streamsLoading: boolean;
  streamsError: boolean;

  isAdvancedEnabled?: boolean;
  isAdvancedOpen: boolean;
  onAdvancedOpenChange: (v: boolean) => void;

  status: string;
  sessionId: string | null;

  onStart: () => void;
  onStop: () => void;
  onReconnect: () => void;
  onApplyUpdate: () => void; // now: applies stream selection only
  canStart: boolean;

  followTail: boolean;
  onFollowTailChange: (v: boolean) => void;
  paused: boolean;
  onPausedChange: (v: boolean) => void;

  // optional: pass current session streams to know if streams changed
  // (if you don't have it yet, we’ll fallback to always enabled when sessionId exists)
  sessionStreamIds?: UUID[] | null;
}) {
  const isConnected = props.status === "connected";
  const isDisconnected =
    props.status === "disconnected" || props.status === "error";
  const isConnecting = props.status === "connecting";

  // Apply button should reflect "streams change" (server-side)
  const streamsChanged = useMemo(() => {
    if (!props.sessionId) return false;
    if (!props.sessionStreamIds) return true; // fallback: enable Apply when session exists
    return (
      normalizeIds(props.sessionStreamIds) !==
      normalizeIds(props.filters.streamIds)
    );
  }, [props.sessionId, props.sessionStreamIds, props.filters.streamIds]);

  return (
    <div className="flex-none w-full border-b border-border bg-card px-4 py-3 shadow-sm z-10">
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground/70">
            Filters apply instantly (client-side). Streams selection applies to
            the server session.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full">
          {/* Correlation */}
          <div className="relative group w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={14} />
            </div>
            <Input
              placeholder="Correlation ID..."
              value={props.filters.correlationId}
              onChange={(e) =>
                props.onFiltersChange({
                  ...props.filters,
                  correlationId: e.target.value,
                })
              }
              className="pl-9 h-9 bg-background text-sm font-mono focus-visible:ring-1"
            />
          </div>

          {/* Payload */}
          <div className="w-[240px]">
            <Input
              placeholder="Payload contains..."
              value={props.filters.payloadContains}
              onChange={(e) =>
                props.onFiltersChange({
                  ...props.filters,
                  payloadContains: e.target.value,
                })
              }
              className="h-9 bg-background text-sm focus-visible:ring-1"
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Streams = server-side selection */}
          <FilterMultiSelect
            title="Streams"
            options={(props.streams ?? []).map((s) => ({
              id: s.id,
              label: s.name,
            }))}
            selected={props.filters.streamIds}
            onChange={(newIds) =>
              props.onFiltersChange({
                ...props.filters,
                streamIds: newIds as UUID[],
              })
            }
            isLoading={props.streamsLoading}
            footer={
              <Button
                size="sm"
                className="w-full h-8"
                variant="secondary"
                disabled={!props.sessionId || !streamsChanged}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onApplyUpdate();
                  close();
                }}
              >
                Apply selection
              </Button>
            }
          />

          <div className="ml-auto flex items-center gap-2">
            {/* Status badge */}
            <Badge
              variant={isConnected ? "default" : "outline"}
              className={
                isConnected
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : isConnecting
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground"
              }
            >
              {isConnected ? <Radio size={12} className="mr-1" /> : null}
              {props.status}
            </Badge>

            {props.sessionId ? (
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">
                  {props.sessionId.slice(0, 8)}…
                </span>
                <CopyButton
                  text={props.sessionId}
                  label="Session ID"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                />
              </div>
            ) : null}

            {/* Pause */}
            <Button
              type="button"
              size="sm"
              onClick={() => props.onPausedChange(!props.paused)}
              variant="outline"
              className="h-9 gap-2"
            >
              <Pause size={14} />
              {props.paused ? "Resume" : "Pause"}
            </Button>

            {/* Follow */}
            <Button
              type="button"
              size="sm"
              onClick={() => props.onFollowTailChange(!props.followTail)}
              variant={props.followTail ? "secondary" : "outline"}
              className="h-9"
              title="Keep view pinned to newest events"
            >
              Follow
            </Button>

            {/* Start */}
            <Button
              type="button"
              size="sm"
              disabled={!props.canStart || isConnecting || isConnected}
              onClick={props.onStart}
              className="h-9 px-5 font-medium transition-all bg-primary text-primary-foreground shadow-md shadow-primary/20"
            >
              {isConnecting ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : (
                <Play size={14} className="mr-2" />
              )}
              Start
            </Button>

            {/* Reconnect */}
            {isDisconnected ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={props.onReconnect}
                className="h-9 gap-2"
              >
                <RefreshCcw size={14} />
                Reconnect
              </Button>
            ) : null}

            {/* Stop */}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={props.onStop}
              disabled={!props.sessionId}
              className="h-9 gap-2"
            >
              <Trash2 size={14} />
              Stop
            </Button>
          </div>
        </div>

        {props.isAdvancedEnabled && (
          <Collapsible
            open={props.isAdvancedOpen}
            onOpenChange={props.onAdvancedOpenChange}
            className="mt-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground gap-1 px-1 hover:bg-transparent hover:text-primary w-full justify-center border-t border-transparent hover:border-border mt-2"
              >
                {props.isAdvancedOpen ? "Hide" : "Show"} Advanced{" "}
                <ChevronDown
                  size={10}
                  className={`transition-transform ${
                    props.isAdvancedOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-3 pb-2 border-t border-dashed border-border mt-2 animate-in slide-in-from-top-2">
              <div className="text-xs text-muted-foreground">
                Advanced live config (Session / Streams options) goes here.
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
