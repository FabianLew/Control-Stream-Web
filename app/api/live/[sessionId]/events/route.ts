import type { NextRequest } from "next/server";
import { demoLiveBatches } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export const runtime = "nodejs";

function sseLine(event: string, data: string) {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  if (!isDemoModeEnabled()) {
    return proxyToBackend(req, `/live/${sessionId}/events`);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const batches = demoLiveBatches(sessionId, 120);

      for (const batch of batches) {
        controller.enqueue(
          encoder.encode(sseLine("message", JSON.stringify(batch)))
        );
        await new Promise((r) => setTimeout(r, 250));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
