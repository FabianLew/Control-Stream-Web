"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/auth/session";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(
      hash.startsWith("#") ? hash.slice(1) : hash
    );
    const token = params.get("token");

    if (token) {
      setAccessToken(token);

      // usuń token z URL (żeby nie został w historii)
      window.history.replaceState({}, document.title, window.location.pathname);

      router.replace("/"); // albo /search
    } else {
      router.replace("/login"); // albo landing
    }
  }, [router]);

  return null;
}
