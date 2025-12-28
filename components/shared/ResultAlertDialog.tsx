"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Variant = "success" | "error";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: Variant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ResultAlertDialog(props: Props) {
  const isSuccess = props.variant === "success";

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent
        className={
          isSuccess
            ? "border-emerald-500/30 bg-background"
            : "border-destructive/30 bg-background"
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle
            className={isSuccess ? "text-emerald-400" : "text-destructive"}
          >
            {props.title}
          </AlertDialogTitle>
          {props.description ? (
            <AlertDialogDescription>{props.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction
            className={
              isSuccess
                ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                : undefined
            }
            onClick={() => {
              props.onAction?.();
              props.onOpenChange(false);
            }}
          >
            {props.actionLabel ?? "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
