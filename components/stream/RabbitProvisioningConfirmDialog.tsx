"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalQueueName: string;
  // nazwy mogą być "auto" jeśli nie chcesz ich wyliczać na FE
  searchShadowQueueName: string;
  liveShadowQueueName: string;
  onConfirm: () => Promise<void> | void;
};

export function RabbitProvisioningConfirmDialog({
  open,
  onOpenChange,
  originalQueueName,
  searchShadowQueueName,
  liveShadowQueueName,
  onConfirm,
}: Props) {
  const [ack, setAck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canConfirm = ack && !isSubmitting;

  const handleConfirm = async () => {
    if (!ack) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setAck(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles = useMemo(
    () => ({
      search: "Search Shadow Queue",
      live: "Live Shadow Queue",
    }),
    [],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // reset ACK on close
        if (!v) setAck(false);
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[720px]">
        <DialogHeader>
          <DialogTitle>RabbitMQ provisioning</DialogTitle>
          <DialogDescription>
            Creating this Rabbit stream will provision two additional queues in
            your RabbitMQ. This enables safe Search & Live without consuming
            from the original queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Original queue</div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {originalQueueName}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{titles.search}</div>
                  <div className="text-xs text-muted-foreground">
                    Stores a copy of messages for Unified Search (safe browsing,
                    replay, debugging).
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {searchShadowQueueName}
                </Badge>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{titles.live}</div>
                  <div className="text-xs text-muted-foreground">
                    Feeds Live view and supports fan-out to multiple UI sessions
                    via ControlStream hub.
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {liveShadowQueueName}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="text-sm font-medium text-amber-600">
              Infra change in your environment
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              This action creates resources in your RabbitMQ namespace. Make
              sure you understand retention limits (TTL/max length) configured
              on the agent.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={ack}
              onCheckedChange={(v) => setAck(Boolean(v))}
              id="rabbit-provisioning-ack"
            />
            <label
              htmlFor="rabbit-provisioning-ack"
              className="text-sm text-muted-foreground"
            >
              I understand and want to create these queues.
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {isSubmitting ? "Creating..." : "Create Stream"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
