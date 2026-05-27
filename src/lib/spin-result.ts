export type SpinRpcRow = {
  spin_id: string;
  child_name: string;
  gift_name: string;
};

export function normalizeSpinRpc(data: unknown): SpinRpcRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;

  const r = row as Record<string, unknown>;
  const spinId = r.spin_id ?? r.spinId;
  const childName = r.child_name ?? r.childName;
  const giftName = r.gift_name ?? r.giftName;

  if (
    (typeof spinId !== "string" && typeof spinId !== "number") ||
    typeof childName !== "string" ||
    typeof giftName !== "string"
  ) {
    return null;
  }

  return {
    spin_id: String(spinId),
    child_name: childName,
    gift_name: giftName,
  };
}
