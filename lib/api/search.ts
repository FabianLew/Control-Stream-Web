import type { SearchFilters, SearchResult } from "@/types";
import { requestJson } from "./helper";

const DEFAULT_PAGE_SIZE = 50;

export function buildSearchQuery(
  filters: SearchFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE
): string {
  const params = new URLSearchParams();
  if (filters.correlationId) params.append("correlationId", filters.correlationId);
  if (filters.contentContains) params.append("contentContains", filters.contentContains);

  if (filters.streamIds?.length) {
    params.append("streamIds", filters.streamIds.join(","));
  }
  if (filters.streamTypes?.length) {
    params.append("streamTypes", filters.streamTypes.join(","));
  }

  if (filters.fromTime) params.append("fromTime", filters.fromTime);
  if (filters.toTime) params.append("toTime", filters.toTime);

  params.append("page", page.toString());
  params.append("size", size.toString());
  return params.toString();
}

export async function searchMessages(
  filters: SearchFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE
): Promise<SearchResult> {
  const query = buildSearchQuery(filters, page, size);
  return requestJson(`/api/search?${query}`);
}
