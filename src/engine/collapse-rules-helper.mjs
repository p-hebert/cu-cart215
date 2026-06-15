/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {StoneColorName | null} BoardCell
 */

/**
 * @typedef {{ col: number, row: number }} GridPosition
 */

/**
 * @typedef {{
 *   name: string,
 *   label: string,
 *   positions: GridPosition[],
 *   overloadAt: number,
 *   immediateCollapseAt: number,
 *   endgameCollapseAt: number,
 * }} CollapseRingRule
 */

/**
 * @typedef {{
 *   colorName: StoneColorName,
 *   count: number,
 *   overloaded: boolean,
 *   immediateCollapse: boolean,
 *   endgameCollapse: boolean,
 * }} CollapseColorStatus
 */

/**
 * @typedef {{
 *   ringName: string,
 *   ringLabel: string,
 *   colors: Record<StoneColorName, CollapseColorStatus>,
 * }} CollapseRingStatus
 */

export const DEFAULT_COLLAPSE_COLORS = [
  { name: "black", value: "#000000" },
  { name: "white", value: "#ffffff" },
  { name: "blood-red", value: "#8a0303" },
  { name: "midnight-blue", value: "#191970" },
];

/**
 * Inner = center + 6-point ring.
 * Middle = 3-point ring.
 */
export const DEFAULT_COLLAPSE_RINGS = [
  {
    name: "inner",
    label: "Inner",
    positions: [
      [2, 2],
      [3, 2],
      [4, 2],
      [2, 3],
      [3, 3],
      [4, 3],
      [2, 4],
      [3, 4],
      [4, 4],
    ].map(([col, row]) => ({ col, row })),

    // Safe through 4, overloaded at 5, immediate collapse at 6+
    overloadAt: 5,
    immediateCollapseAt: 6,
    endgameCollapseAt: 5,
  },
  {
    name: "middle",
    label: "Middle",
    positions: [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],

      [1, 2],
      [5, 2],

      [1, 3],
      [5, 3],

      [1, 4],
      [5, 4],

      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
    ].map(([col, row]) => ({ col, row })),

    // Safe through 8, overloaded at 9, immediate collapse at 10+
    overloadAt: 9,
    immediateCollapseAt: 10,
    endgameCollapseAt: 9,
  },
];

export default class CollapseRulesHelper {
  /**
   * @param {{
   *   colors?: Array<{ name: StoneColorName, value: string }>,
   *   rings?: CollapseRingRule[],
   * }} options
   */
  constructor(options = {}) {
    this.colors = options.colors ?? DEFAULT_COLLAPSE_COLORS;
    this.rings = options.rings ?? DEFAULT_COLLAPSE_RINGS;
  }

  /**
   * @param {BoardCell[][]} board
   * @returns {CollapseRingStatus[]}
   */
  getCollapseStatus(board) {
    return this.rings.map((ring) => {
      const colors = {};

      for (const color of this.colors) {
        const count = this.countColorInRing(board, color.name, ring);

        colors[color.name] = {
          colorName: color.name,
          count,
          overloaded: count >= ring.overloadAt,
          immediateCollapse: count >= ring.immediateCollapseAt,
          endgameCollapse: count >= ring.endgameCollapseAt,
        };
      }

      return {
        ringName: ring.name,
        ringLabel: ring.label,
        colors,
      };
    });
  }

  /**
   * Immediate collapse means the game collapses at the end of a turn.
   *
   * @param {BoardCell[][]} board
   * @returns {boolean}
   */
  hasImmediateCollapse(board) {
    return this.getImmediateCollapseEntries(board).length > 0;
  }

  /**
   * Endgame collapse means the game collapses when timer ends.
   *
   * @param {BoardCell[][]} board
   * @returns {boolean}
   */
  hasEndgameCollapse(board) {
    return this.getEndgameCollapseEntries(board).length > 0;
  }

  /**
   * @param {BoardCell[][]} board
   * @returns {Array<{ ringName: string, ringLabel: string, colorName: StoneColorName, count: number }>}
   */
  getImmediateCollapseEntries(board) {
    const status = this.getCollapseStatus(board);
    const entries = [];

    for (const ringStatus of status) {
      for (const colorName in ringStatus.colors) {
        const colorStatus = ringStatus.colors[colorName];

        if (!colorStatus.immediateCollapse) continue;

        entries.push({
          ringName: ringStatus.ringName,
          ringLabel: ringStatus.ringLabel,
          colorName: colorStatus.colorName,
          count: colorStatus.count,
        });
      }
    }

    return entries;
  }

  /**
   * @param {BoardCell[][]} board
   * @returns {Array<{ ringName: string, ringLabel: string, colorName: StoneColorName, count: number }>}
   */
  getEndgameCollapseEntries(board) {
    const status = this.getCollapseStatus(board);
    const entries = [];

    for (const ringStatus of status) {
      for (const colorName in ringStatus.colors) {
        const colorStatus = ringStatus.colors[colorName];

        if (!colorStatus.endgameCollapse) continue;

        entries.push({
          ringName: ringStatus.ringName,
          ringLabel: ringStatus.ringLabel,
          colorName: colorStatus.colorName,
          count: colorStatus.count,
        });
      }
    }

    return entries;
  }

  /**
   * @param {BoardCell[][]} board
   * @param {StoneColorName} colorName
   * @param {CollapseRingRule} ring
   * @returns {number}
   */
  countColorInRing(board, colorName, ring) {
    let count = 0;

    for (const position of ring.positions) {
      if (board?.[position.row]?.[position.col] === colorName) {
        count++;
      }
    }

    return count;
  }
}
