export type GiftSegment = {
  name: string;
  imageUrl: string | null;
};

export type SpinResult = {
  spinId: string;
  childName: string;
  luckyNumber: string;
  /** True when re-opening a previous spin (no new wheel animation). */
  alreadySpun?: boolean;
};
