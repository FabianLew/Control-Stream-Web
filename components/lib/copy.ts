import { toast } from "sonner";

export async function copyWithToast(
  text: string,
  options?: { label?: string }
) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied", {
      description: options?.label
        ? `${options.label} copied to clipboard`
        : undefined,
      duration: 1200,
    });
    return true;
  } catch {
    toast.error("Copy failed", { duration: 1500 });
    return false;
  }
}
