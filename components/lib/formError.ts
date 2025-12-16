import type { FieldErrors, FieldValues } from "react-hook-form";
import { toast } from "sonner";

function firstErrorPath(errors: any, prefix: string[] = []): string | null {
  if (!errors || typeof errors !== "object") return null;

  // RHF trzyma message w errors[field].message
  if (typeof errors.message === "string") return prefix.join(".");

  for (const key of Object.keys(errors)) {
    const next = errors[key];
    const found = firstErrorPath(next, [...prefix, key]);
    if (found) return found;
  }
  return null;
}

export function handleInvalidSubmit<T extends FieldValues>(
  errors: FieldErrors<T>,
  options?: { title?: string; description?: string }
) {
  toast.error(options?.title ?? "Fix validation errors", {
    description:
      options?.description ??
      "Some fields are invalid. Please review highlighted inputs.",
  });

  const path = firstErrorPath(errors);
  if (!path) return;

  // RHF używa name jako "a.b.c"
  // my próbujemy znaleźć input/select/textarea z name="a.b.c"
  requestAnimationFrame(() => {
    const el = document.querySelector(
      `[name="${CSS.escape(path)}"]`
    ) as HTMLElement | null;

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // focus jeśli możliwe
      (el as any).focus?.();
    }
  });
}
