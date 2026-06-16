import { POINT_SHEET } from "src/engine/points.mjs";

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {import("src/engine/stone-data.mjs").default | null} BoardCell
 */

export const PLAYER_COLORS = [
  { name: "black", value: "#000000" },
  { name: "white", value: "#ffffff" },
  { name: "blood-red", value: "#8a0303" },
  { name: "midnight-blue", value: "#191970" },
];

// Temporary alias if other files already import STONE_COLORS
export const STONE_COLORS = PLAYER_COLORS;

export default class ScoreCalculator {
  /**
   * @param {{
   *   pointSheet?: Array<[number, number, number]>,
   *   colors?: Array<{ name: StoneColorName, value: string }>
   * }} options
   */
  constructor(options = {}) {
    this.pointSheet = options.pointSheet ?? POINT_SHEET;
    this.colors = options.colors ?? STONE_COLORS;
  }

  /**
   * @param {BoardCell[][]} board
   * @returns {Record<StoneColorName, number>}
   */
  calculateScores(board) {
    const scores = this.createEmptyScores();

    for (const [col, row, value] of this.pointSheet) {
      const colorName = board?.[row]?.[col]?.colorName ?? null;

      if (colorName === null) continue;
      // Important: skip scar and any future non-player stone types.
      if (!(colorName in scores)) continue;

      scores[colorName] += value;
    }

    return scores;
  }

  /**
   * @returns {Record<StoneColorName, number>}
   */
  createEmptyScores() {
    return this.colors.reduce((scores, color) => {
      scores[color.name] = 0;
      return scores;
    }, {});
  }
}
