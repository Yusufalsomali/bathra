import { Alert } from "react-native";
import type { PostgrestError } from "@supabase/supabase-js";

export function isDuplicateConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as PostgrestError;
  if (String(e.code) === "23505") return true;
  const m = String(e.message ?? "").toLowerCase();
  return (
    m.includes("duplicate") ||
    m.includes("unique constraint") ||
    m.includes("already exists")
  );
}

function extractMessage(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as PostgrestError).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  if (err instanceof Error && err.message) return err.message;
  return undefined;
}

/** Maps insert failures on `investor_startup_connections` to user-facing alerts. */
export function alertConnectionInsertError(
  err: unknown,
  type: "interested" | "info_request",
  t: (scope: string) => string
): void {
  if (isDuplicateConnectionError(err)) {
    if (type === "interested") {
      Alert.alert(t("explore.duplicateInterestTitle"), t("explore.duplicateInterestMessage"));
    } else {
      Alert.alert(t("explore.duplicateInfoRequestTitle"), t("explore.duplicateInfoRequestMessage"));
    }
    return;
  }

  const msg = extractMessage(err) ?? t("common.error");
  Alert.alert(t("common.error"), msg);
}
