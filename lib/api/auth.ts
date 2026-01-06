import { requestJson } from "@/lib/api/helper";
import type { MeResponseDto } from "@/types/auth";

export const getMe = async (): Promise<MeResponseDto> =>
  requestJson("/api/auth/me");
