/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} PlayerColorName
 */

/**
 * @typedef {PlayerColorName | "scar"} StoneColorName
 */

export default class StoneData {
  /**
   * @param {{
   *   colorName: StoneColorName,
   *   capturable?: boolean,
   *   shieldedByColorName?: PlayerColorName | null,
   *   originalColorName?: PlayerColorName | null,
   *   scarCreatedByColorName?: PlayerColorName | null,
   *   expiresOnTurnNumber?: number | null,
   * }} options
   */
  constructor(options) {
    this.colorName = options.colorName;
    this.capturable = options.capturable ?? true;

    // Shield
    this.shieldedByColorName = options.shieldedByColorName ?? null;

    // Scar
    this.originalColorName = options.originalColorName ?? null;
    this.scarCreatedByColorName = options.scarCreatedByColorName ?? null;
    this.expiresOnTurnNumber = options.expiresOnTurnNumber ?? null;
  }

  clone() {
    return new StoneData({
      colorName: this.colorName,
      capturable: this.capturable,
      shieldedByColorName: this.shieldedByColorName,
      originalColorName: this.originalColorName,
      scarCreatedByColorName: this.scarCreatedByColorName,
      expiresOnTurnNumber: this.expiresOnTurnNumber,
    });
  }

  isScar() {
    return this.colorName === "scar";
  }
}
