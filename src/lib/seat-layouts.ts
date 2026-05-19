export type SeatRow = { id: string; tier: "premium" | "gold" | "recliner"; seats: (string | null)[] };
export type ScreenLayout = SeatRow[];

// gap(n) = exactly n blank seat-width cells
function gap(n: number): number[] { return new Array(n).fill(-1); }

function makeRow(id: string, tier: "premium" | "gold" | "recliner", parts: (number[] | null)[]): SeatRow {
  const seats: (string | null)[] = [];
  parts.forEach(part => {
    if (part === null) {
      seats.push(null, null); // fallback 2-cell gap
    } else if (part.length > 0 && part[0] === -1) {
      part.forEach(() => seats.push(null)); // gap(n)
    } else {
      part.forEach(num => seats.push(`${id}-${num}`));
    }
  });
  return { id, tier, seats };
}

function range(start: number, end: number) {
  const res: number[] = [];
  if (start <= end) { for (let i = start; i <= end; i++) res.push(i); }
  else { for (let i = start; i >= end; i--) res.push(i); }
  return res;
}

// ═══════════════════════════════════════════════════
// AUDI 1  (Screen-1)
//
// PREMIUM A-G:  [23→12] gap(3) [11→1]
//   Left=12 seats | aisle=3 blank | Right=11 seats
//
// GOLD H,J,K,L: gap(4) [18→11] gap(3) [10→1]
//   indent=4 blank + left=8 seats = 12 → aisle aligned with Premium ✓
//   Right block 10→1 = 10 seats (same right-side depth as Premium)
//
// GOLD M:  [23→15] gap(3) [14→1]
//   Wider house-seat row, different aisle position (intentional)
//
// RECLINER N: gap(4) [17→12] gap(3) [11→1]
// RECLINER P: gap(7) [10→7]  gap(3) [6→1]
// ═══════════════════════════════════════════════════
export const AUDI_1: ScreenLayout = [
  ...['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r =>
    makeRow(r, 'premium', [range(23, 12), gap(2), range(11, 1)])
  ),
  ...['H', 'J', 'K', 'L'].map(r =>
    makeRow(r, 'gold', [gap(4), range(18, 11), gap(3), range(10, 1), gap(4)])
  ),
  makeRow('M', 'gold', [gap(4), range(23, 15), gap(3), range(14, 1)]),
  makeRow('N', 'recliner', [gap(5), range(17, 12), gap(4), range(11, 1), gap(2)]),
  makeRow('P', 'recliner', [gap(3), range(10, 7), gap(15), range(6, 1)]),
];

// ═══════════════════════════════════════════════════
// AUDI 2  (Screen-2)
//
// PREMIUM A-B: [1→8] gap(3) [9→16]
//   Left=8 | aisle=3 | Right=8  → total 19 cols, aisle at col 8
//
// GOLD C-H: [1→8] gap(3) [9→14]
//   Same left block (8 seats), same aisle position, right block shorter (6 seats)
//   → LEFT + AISLE aligned with premium ✓
//
// GOLD J-K: [1→3] gap(8) [4→17]
//   House seats 1-3 at far left, gap fills to col 11, main block starts at col 11
//   → Main block LEFT edge aligns with premium right block ✓
//
// RECLINER L: [1→17] full continuous row
// ═══════════════════════════════════════════════════
export const AUDI_2: ScreenLayout = [
  makeRow('A', 'premium', [range(1, 8), gap(3), range(9, 16)]),
  makeRow('B', 'premium', [range(1, 8), gap(3), range(9, 16)]),
  // C-H: NO leading indent — left edge aligns with premium row A
  ...['C', 'D', 'E', 'F', 'G', 'H'].map(r =>
    makeRow(r, 'gold', [gap(5), range(1, 8), range(9, 14)])
  ),
  // J-K: house seats (1-3) on far left, large gap, main seats (4-17) aligned with premium right block
  ...['J', 'K'].map(r =>
    makeRow(r, 'gold', [range(1, 3), gap(2), range(4, 17)])
  ),
  makeRow('L', 'recliner', [range(1, 17)]),
];

// ═══════════════════════════════════════════════════
// AUDI 3  (Screen-3)
//
// GOLD A-G: [14→9] gap(3) [8→1]
//   Left=6 seats | aisle=3 | Right=8 seats
//
// GOLD H (wider back row):
//   [18→13] gap(2) [12→11] gap(3) [10→1]
//   Left=6 | small-gap=2 | mid=2 | aisle=3 | right=10
//   (H-12 and H-11 are in a middle island, per diagram)
// ═══════════════════════════════════════════════════
export const AUDI_3: ScreenLayout = [
  // A-G: NO leading indent — left edge of seat-14 is the leftmost column
  ...['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r =>
    makeRow(r, 'gold', [range(14, 9), gap(3), range(8, 1), gap(3)])
  ),
  // H: 18→11 (8 seats continuous) | gap(3) | 10→1 (10 seats)
  // H row is WIDER than A-G — extends further on both sides
  makeRow('H', 'gold', [range(18, 11), range(10, 1)]),
];

export const SCREEN_LAYOUTS: Record<string, ScreenLayout> = {
  "Audi 1": AUDI_1,
  "Audi 2": AUDI_2,
  "Audi 3": AUDI_3,
};

export function getSeatPrice(
  seatId: string,
  screenName: string | null,
  prices: { premium: number; gold: number; recliner: number; base: number }
): number {
  const layout = SCREEN_LAYOUTS[screenName || "Audi 1"] || AUDI_1;
  for (const row of layout) {
    if (row.seats.includes(seatId)) {
      if (row.tier === 'premium') return prices.premium;
      if (row.tier === 'recliner') return prices.recliner;
      return prices.gold;
    }
  }
  return prices.base;
}

export function calculateSubtotal(
  selectedSeats: string[],
  screenName: string | null,
  prices: { premium: number; gold: number; recliner: number; base: number }
): number {
  return selectedSeats.reduce((total, seatId) => {
    return total + getSeatPrice(seatId, screenName, prices);
  }, 0);
}
