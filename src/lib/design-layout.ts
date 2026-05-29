/** Shared layout on the 941×1672 design canvas. */
export const DESIGN_W = 941;
export const DESIGN_H = 1672;

export function pctX(px: number): string {
  return `${(px / DESIGN_W) * 100}%`;
}

export function pctY(px: number): string {
  return `${(px / DESIGN_H) * 100}%`;
}

/** Ribbon "NHẤN VÀO ĐÂY ĐỂ BỐC TÚI MÙ" on the bag welcome screen. */
export const BAG_CTA_BUTTON = {
  top: pctY(650),
  left: pctX(94),
  width: pctX(753),
  height: pctY(188),
} as const;

/** Tap target on the large mystery bag illustration. */
export const BAG_MYSTERY_HOTSPOT = {
  top: pctY(1000),
  left: pctX(262),
  width: pctX(417),
  height: pctY(470),
} as const;

/** DOB input on the confirmation screen. */
export const DOB_INPUT = {
  top: pctY(890),
  left: pctX(226),
  width: pctX(489),
  height: pctY(80),
} as const;

/** Confirm button hotspot on the DOB screen. */
export const DOB_CONFIRM_HOTSPOT = {
  top: pctY(974),
  left: pctX(169),
  width: pctX(602),
  height: pctY(130),
} as const;

/** Lucky number on the result card (% of bg_result, not full canvas). */
export const RESULT_LUCKY_NUMBER = {
  top: "34.5%",
  left: "22%",
  width: "56%",
  height: "13.5%",
} as const;

/** Close button hotspot on the result card (% of bg_result). */
export const RESULT_CLOSE_HOTSPOT = {
  top: "75.2%",
  left: "9%",
  width: "82%",
  height: "7.2%",
} as const;
