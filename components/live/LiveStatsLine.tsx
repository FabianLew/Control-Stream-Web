"use client";

import { CopyButton } from "@/components/shared/CopyButton";

export function LiveStatsLine(props: {
  status: string;
  buffered: number;
  bufferLimit: number;
  dropped: number;
  sessionId: string | null;
}) {
  return (
    <div className="flex-none px-6 pt-4 pb-2 flex items-center justify-between">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Buffered{" "}
          <span className="text-foreground font-medium">{props.buffered}</span>{" "}
          / {props.bufferLimit}
        </span>

        <span className="opacity-50">|</span>

        <span>
          Dropped{" "}
          <span className="text-foreground font-medium">{props.dropped}</span>
        </span>

        <span className="opacity-50">|</span>

        <span className="capitalize">{props.status}</span>

        {props.sessionId ? (
          <>
            <span className="opacity-50">|</span>

            <span className="inline-flex items-center gap-2">
              <span>session</span>
              <span className="font-mono text-foreground">
                {props.sessionId.slice(0, 8)}…
              </span>
              <CopyButton
                text={props.sessionId}
                label="Session ID"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              />
            </span>
          </>
        ) : null}
      </div>

      {/* prawa strona zostaje pusta / na przyszłość */}
      <div />
    </div>
  );
}
