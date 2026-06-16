/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

export default class StoneData {
  /**
   * @param {{
   *   colorName: StoneColorName,
   *   capturable?: boolean,
   *   shieldedByColorName?: StoneColorName | null,
   * }} options
   */
  constructor(options) {
    this.colorName = options.colorName;
    this.capturable = options.capturable ?? true;

    // Useful for clearing shield later.
    this.shieldedByColorName = options.shieldedByColorName ?? null;
  }

  clone() {
    return new StoneData({
      colorName: this.colorName,
      capturable: this.capturable,
      shieldedByColorName: this.shieldedByColorName,
    });
  }
}
