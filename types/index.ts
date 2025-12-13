// 1. Enum dla formatów (zgodnie z nowymi wymaganiami)
export type PayloadFormat =
  | "JSON"
  | "TEXT"
  | "BINARY"
  | "AVRO"
  | "PROTO"
  | "UNKNOWN";
export type StreamType = "KAFKA" | "RABBIT" | "POSTGRES" | string;

// 2. Pojedynczy wiersz wiadomości (Zaktualizowany o nowe pola)
export interface SearchMessageRow {
  // --- Stare pola (zachowane) ---
  streamId: string;
  streamName: string;
  streamType: StreamType;
  messageId: string;
  correlationId: string | null; // null allowed
  timestamp: string; // ISO Instant
  headers: Record<string, string> | string; // Backend może zwracać obiekt lub string JSON
  errorMessage?: string;

  // --- Nowe pola (Schema Registry + Formats) ---
  payloadFormat: PayloadFormat;

  // Pretty: sformatowany JSON (dla Avro/Proto/JSON). Może być null, jeśli dekodowanie się nie uda.
  payloadPretty?: string | null;

  // Base64: Zawsze dostępne surowe bajty (fallback)
  payloadBase64: string;

  // Payload: To co było wcześniej - "Searchable" text / default display / fallback
  payload: string;
}

// 3. Wrapper wyników (To czego brakowało - metadane)
export interface SearchResult {
  queryCorrelationId: string;
  totalFound: number; // <-- Jest tutaj
  executionTimeMs: number; // <-- Jest tutaj
  messages: SearchMessageRow[];
}

// 4. Filtry (Bez zmian, ewentualnie dodamy payloadFormat w przyszłości)
export interface SearchFilters {
  correlationId?: string;
  contentContains?: string;
  streamIds?: string[];
  streamTypes?: string[];
  fromTime?: string;
  toTime?: string;
}

// 5. Opcje do selecta (Bez zmian)
export interface StreamOption {
  id: string;
  name: string;
  type: StreamType;
}

// --- HELPERY UI ---

// Typ pomocniczy do wyświetlania w UI (znormalizowany)
export interface NormalizedMessageUi {
  displayPayload: string;
  isBinary: boolean;
  isDecoded: boolean;
  formatLabel: string;
  formatColor: "default" | "secondary" | "destructive" | "outline";
}

// Funkcja normalizująca (logika wyświetlania)
export const normalizeMessage = (
  msg: SearchMessageRow
): NormalizedMessageUi => {
  const isBinary = msg.payloadFormat === "BINARY";
  const isDecoded =
    (msg.payloadFormat === "AVRO" || msg.payloadFormat === "PROTO") &&
    !!msg.payloadPretty;

  // 1. Wybór co pokazać na karcie/liście (Preview)
  let displayPayload = msg.payload;

  if (msg.payloadPretty) {
    // Jeśli mamy ładny JSON (z Avro lub zwykły), pokazujemy go
    displayPayload = msg.payloadPretty;
  } else if (isBinary) {
    // Jeśli to binarka bez dekodowania
    displayPayload = "Binary payload (base64) - view details";
  } else if (msg.payloadFormat === "UNKNOWN") {
    displayPayload = "Unsupported payload format";
  }

  // 2. Kolor Badge'a
  let formatColor: NormalizedMessageUi["formatColor"] = "outline";
  switch (msg.payloadFormat) {
    case "AVRO":
    case "PROTO":
      formatColor = "default"; // Czarny/Biały (wyróżniony)
      break;
    case "BINARY":
      formatColor = "secondary"; // Szary
      break;
    case "UNKNOWN":
      formatColor = "destructive"; // Czerwony
      break;
    case "JSON":
      formatColor = "outline"; // Zwykły border
      break;
    default:
      formatColor = "outline";
  }

  return {
    displayPayload,
    isBinary,
    isDecoded,
    formatLabel: msg.payloadFormat || "TEXT",
    formatColor,
  };
};
