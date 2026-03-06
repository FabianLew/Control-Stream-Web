// lib/proto/protoFilter.ts
import type { ProtoMessageTypeOptionDto } from "@/types/replay";

/**
 * Well-known dependency-only proto namespaces that should never be surfaced
 * to users as selectable business event types.
 *
 * Extend this list if additional technical namespaces are identified.
 * Keep entries as specific as possible to avoid over-filtering unknown domains.
 */
const PROTO_DEPENDENCY_PREFIXES: readonly string[] = [
  "google.protobuf.", // Well-known types: Timestamp, Struct, Value, ListValue, etc.
];

/**
 * Returns true when the fully-qualified message name belongs to a
 * dependency-only namespace and should NOT be offered to users.
 *
 * @example
 * isProtoDependencyType("google.protobuf.Timestamp")  // → true
 * isProtoDependencyType("com.example.orders.OrderPlaced") // → false
 */
export function isProtoDependencyType(messageFullName: string): boolean {
  return PROTO_DEPENDENCY_PREFIXES.some((prefix) =>
    messageFullName.startsWith(prefix)
  );
}

/**
 * Removes dependency-only types from the list returned by the backend.
 * Use this whenever presenting proto message type options to the user.
 */
export function filterProtoDependencyTypes(
  types: ProtoMessageTypeOptionDto[]
): ProtoMessageTypeOptionDto[] {
  return types.filter((t) => !isProtoDependencyType(t.messageFullName));
}
