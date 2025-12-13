"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchMessageRow } from "@/types";
import {
  Copy,
  Check,
  FileJson,
  List,
  Code,
  Hash,
  Play,
  Braces,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface PayloadViewerProps {
  message: SearchMessageRow | null;
  isOpen: boolean;
  onClose: () => void;
}

function safeParseHeaders(
  headers: SearchMessageRow["headers"] | undefined | null
): Record<string, any> {
  if (!headers) return {};
  if (typeof headers === "object") return headers as Record<string, any>;
  try {
    const parsed = JSON.parse(headers);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { __raw: headers };
  }
}

function looksLikeJson(text: string) {
  const t = text?.trim?.() ?? "";
  return (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
}

function tryPrettyJson(jsonString: string) {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonString;
  }
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

type ViewerTab = "pretty" | "raw" | "headers";
type CopiedField = "messageId" | "pretty" | "raw" | "headers";

export function PayloadViewer({
  message,
  isOpen,
  onClose,
}: PayloadViewerProps) {
  const [tab, setTab] = useState<ViewerTab>("pretty");
  const panelScrollRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<CopiedField | null>(null);

  // deps muszą być bezpieczne, bo message może być null
  const messageId = message?.messageId ?? "";
  const headersRaw = message?.headers;
  const payload = message?.payload ?? "";
  const payloadPretty = message?.payloadPretty ?? null;
  const payloadBase64 = message?.payloadBase64 ?? "";
  const payloadFormat = message?.payloadFormat ?? "UNKNOWN";
  const timestamp = message?.timestamp ?? "";
  const streamId = message?.streamId ?? "";
  const streamName = message?.streamName ?? "";
  const streamType = message?.streamType ?? "UNKNOWN";
  const correlationId = message?.correlationId ?? null;

  useEffect(() => {
    panelScrollRef.current?.scrollTo({ top: 0 });
  }, [tab, messageId]);

  useEffect(() => {
    if (messageId) setTab("pretty");
  }, [messageId]);

  const headersObj = useMemo(() => safeParseHeaders(headersRaw), [headersRaw]);

  const prettyCandidate = payloadPretty ?? payload;
  const prettyText = useMemo(() => {
    if (!prettyCandidate) return "";
    return looksLikeJson(prettyCandidate)
      ? tryPrettyJson(prettyCandidate)
      : prettyCandidate;
  }, [prettyCandidate]);

  const isBinary = payloadFormat === "BINARY";
  const isSchemaDecoded = payloadFormat === "AVRO" || payloadFormat === "PROTO";
  const schemaDecodeFailed = isSchemaDecoded && !payloadPretty;

  const handleCopyWithFeedback = async (field: CopiedField, text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1200);
    } catch {
      // optional: toast
    }
  };

  // ✅ dopiero tutaj warunkowy return
  if (!message) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[1100px] sm:w-[90vw] bg-background border-l border-border overflow-hidden flex flex-col p-0">
        {/* HEADER */}
        <div className="p-6 border-b border-border bg-muted/10 flex-none">
          <SheetHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs">
                {streamType}
              </Badge>

              <Badge
                variant="secondary"
                className="font-mono text-xs font-normal"
              >
                <Braces size={12} className="mr-1.5 inline opacity-70" />
                {payloadFormat}
              </Badge>

              <span className="text-xs text-muted-foreground font-mono">
                {timestamp ? new Date(timestamp).toLocaleString() : ""}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle className="text-xl font-mono text-foreground flex items-center gap-2 break-all">
                {messageId}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopyWithFeedback("messageId", messageId)}
                  title="Copy message ID"
                >
                  {copiedField === "messageId" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </SheetTitle>

              {copiedField === "messageId" && (
                <span className="text-xs text-muted-foreground font-medium">
                  Copied
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className="font-mono text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-2 py-1"
              >
                <Hash size={10} className="mr-1.5 inline opacity-70" />
                {correlationId || "No Correlation ID"}
              </Badge>
            </div>

            <SheetDescription className="mt-2">
              Stream:{" "}
              <Link
                href={`/streams/${streamId}`}
                className="font-bold text-foreground hover:underline underline-offset-4"
              >
                {streamName}
              </Link>
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 min-h-0 flex flex-col">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as ViewerTab)}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="pretty" className="gap-2">
                  <FileJson size={14} /> Pretty
                </TabsTrigger>
                <TabsTrigger value="raw" className="gap-2">
                  <Code size={14} /> Raw
                </TabsTrigger>
                <TabsTrigger value="headers" className="gap-2">
                  <List size={14} /> Headers
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  disabled
                >
                  <Play size={12} /> Replay
                </Button>
              </div>
            </div>

            {/* PRETTY */}
            <TabsContent
              value="pretty"
              className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
            >
              <div className="h-full min-h-0 flex flex-col gap-3">
                {(isBinary || schemaDecodeFailed) && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="mt-0.5" size={16} />
                    <div className="leading-relaxed">
                      {isBinary && (
                        <>
                          <span className="text-foreground font-medium">
                            Binary payload.
                          </span>{" "}
                          Switch to{" "}
                          <span className="font-medium text-foreground">
                            Raw
                          </span>{" "}
                          to view base64.
                        </>
                      )}
                      {schemaDecodeFailed && (
                        <>
                          <span className="text-foreground font-medium">
                            Schema decoding failed.
                          </span>{" "}
                          Showing fallback payload. You can still inspect raw
                          base64 in{" "}
                          <span className="font-medium text-foreground">
                            Raw
                          </span>
                          .
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div
                  ref={panelScrollRef}
                  className="relative rounded-lg border border-border bg-muted/30 p-4 flex-1 min-h-0 overflow-auto custom-scrollbar"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground z-10 bg-background/50 backdrop-blur-sm"
                    onClick={() => handleCopyWithFeedback("pretty", prettyText)}
                    title="Copy pretty payload"
                  >
                    {copiedField === "pretty" ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </Button>

                  <pre className="text-xs font-mono text-green-500 whitespace-pre-wrap leading-relaxed">
                    {prettyText}
                  </pre>
                </div>

                {copiedField === "pretty" && (
                  <div className="text-xs text-muted-foreground font-medium">
                    Copied
                  </div>
                )}
              </div>
            </TabsContent>

            {/* RAW */}
            <TabsContent
              value="raw"
              className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
            >
              <div
                ref={panelScrollRef}
                className="relative rounded-lg border border-border bg-muted/30 p-4 h-full overflow-auto break-all font-mono text-xs text-muted-foreground custom-scrollbar"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground z-10 bg-background/50 backdrop-blur-sm"
                  onClick={() => handleCopyWithFeedback("raw", payloadBase64)}
                  title="Copy base64 payload"
                >
                  {copiedField === "raw" ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                </Button>

                {payloadBase64}
              </div>

              {copiedField === "raw" && (
                <div className="mt-2 text-xs text-muted-foreground font-medium">
                  Copied
                </div>
              )}
            </TabsContent>

            {/* HEADERS */}
            <TabsContent
              value="headers"
              className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
            >
              <div
                ref={panelScrollRef}
                className="rounded-lg border border-border bg-muted/30 h-full overflow-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <div className="text-xs text-muted-foreground font-medium">
                    Headers
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      handleCopyWithFeedback(
                        "headers",
                        JSON.stringify(headersObj, null, 2)
                      )
                    }
                    title="Copy headers JSON"
                  >
                    {copiedField === "headers" ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}{" "}
                    Copy
                  </Button>
                </div>

                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    <tr className="bg-muted/50">
                      <td className="p-3 font-medium text-muted-foreground w-[150px]">
                        Correlation ID
                      </td>
                      <td className="p-3 font-mono text-foreground break-all">
                        {correlationId || "-"}
                      </td>
                    </tr>

                    {Object.entries(headersObj).map(([key, val]) => (
                      <tr key={key}>
                        <td className="p-3 font-medium text-muted-foreground">
                          {key}
                        </td>
                        <td className="p-3 font-mono text-foreground break-all">
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {copiedField === "headers" && (
                <div className="mt-2 text-xs text-muted-foreground font-medium">
                  Copied
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
