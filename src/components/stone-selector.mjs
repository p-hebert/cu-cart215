import StoneButton from "src/components/stone-button.mjs";
import { IP5Lifecycle } from "src/p5/interfaces.mjs";

/** @typedef {import("src/components/board.mjs").default} Board */

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {Object} StoneColor
 * @property {StoneColorName} name
 * @property {string} value
 */

/**
 * @callback StoneSelectorChangeHandler
 * @param {StoneColorName} colorName
 * @param {string} colorValue
 * @returns {void}
 */

/**
 * @typedef {Object} StoneSelectorOptions
 * @property {Board} board
 * @property {StoneColor[]} [colors]
 * @property {StoneColorName} [selectedColorName]
 * @property {boolean} [enabled]
 * @property {number} [stoneSize]
 * @property {number} [gap]
 * @property {number} [offsetY]
 * @property {StoneSelectorChangeHandler | null} [onChange]
 */

export default class StoneSelector extends IP5Lifecycle {
  /**
   * @param {StoneSelectorOptions} options
   */
  constructor(options) {
    super();

    this.board = options.board;

    this.colors = options.colors ?? [
      { name: "black", value: "#000000" },
      { name: "white", value: "#ffffff" },
      { name: "blood-red", value: "#8a0303" },
      { name: "midnight-blue", value: "#191970" },
    ];

    this.selectedColorName = options.selectedColorName ?? this.colors[0].name;

    // New: enabled = clickable, disabled = visual-only / externally controlled.
    this.enabled = options.enabled ?? true;

    this.stoneSize = options.stoneSize ?? 36;
    this.gap = options.gap ?? 16;
    this.offsetY = options.offsetY ?? 42;

    this.onChange = options.onChange ?? null;

    this.buttons = [];
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {
    this.createButtons();
    this.updateButtonLayout(p5);
  }

  createButtons() {
    this.buttons = this.colors.map((color) => {
      return new StoneButton({
        x: 0,
        y: 0,
        size: this.stoneSize,
        colorName: color.name,
        colorValue: color.value,
        selected: color.name === this.selectedColorName,
        onClick: () => {
          if (!this.enabled) return;
          this.selectColor(color.name);
        },
      });
    });
  }

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    this.updateButtonLayout(p5);

    for (const button of this.buttons) {
      button.selected = button.colorName === this.selectedColorName;
      button.draw(p5);
    }
  }

  /**
   * @param {import("p5")} p5
   */
  updateButtonLayout(p5) {
    const boardOrigin = this.board.getOrigin(p5);
    const boardPixelSize = this.board.getBoardPixelSize();

    const totalWidth =
      this.colors.length * this.stoneSize + (this.colors.length - 1) * this.gap;

    const startX = boardOrigin.x + boardPixelSize / 2 - totalWidth / 2;
    const y = boardOrigin.y + boardPixelSize + this.offsetY;

    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];

      button.x = startX + this.stoneSize / 2 + i * (this.stoneSize + this.gap);

      button.y = y;
      button.size = this.stoneSize;
      button.selected = button.colorName === this.selectedColorName;
    }
  }

  /**
   * User-driven selection.
   *
   * @param {StoneColorName} colorName
   */
  selectColor(colorName) {
    this.setSelectedColorName(colorName);
  }

  /**
   * External/GameScene-driven selection.
   *
   * @param {StoneColorName} colorName
   */
  setSelectedColorName(colorName) {
    const color = this.colors.find((c) => c.name === colorName);
    if (!color) return;

    this.selectedColorName = color.name;
    this.onChange?.(color.name, color.value);
  }

  /**
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    // Clear transient button state when disabling.
    if (!enabled) {
      for (const button of this.buttons) {
        button.hovered = false;
        button.pressed = false;
      }
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getSelectedColorName() {
    return this.selectedColorName;
  }

  getSelectedColorValue() {
    const color = this.colors.find((c) => c.name === this.selectedColorName);
    return color?.value ?? "#000000";
  }

  getSelectedColorIndex() {
    return this.colors.findIndex((c) => c.name === this.selectedColorName);
  }

  selectNextColor() {
    const currentIndex = this.getSelectedColorIndex();

    if (currentIndex === -1) {
      this.setSelectedColorName(this.colors[0].name);
      return;
    }

    const nextIndex = (currentIndex + 1) % this.colors.length;
    this.setSelectedColorName(this.colors[nextIndex].name);
  }

  selectPreviousColor() {
    const currentIndex = this.getSelectedColorIndex();

    if (currentIndex === -1) {
      this.setSelectedColorName(this.colors[0].name);
      return;
    }

    const previousIndex =
      (currentIndex - 1 + this.colors.length) % this.colors.length;

    this.setSelectedColorName(this.colors[previousIndex].name);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    this.updateButtonLayout(p5);

    if (!this.enabled) return;

    for (const button of this.buttons) {
      button.mouseMoved(p5, event);
    }
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this.updateButtonLayout(p5);

    if (!this.enabled) return;

    for (const button of this.buttons) {
      button.mousePressed(p5, event);
    }
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   * @returns {boolean}
   */
  mouseReleased(p5, event) {
    this.updateButtonLayout(p5);

    if (!this.enabled) return false;

    for (const button of this.buttons) {
      const clicked = button.mouseReleased(p5, event);

      if (clicked) {
        button.click(p5, event);
        return true;
      }
    }

    return false;
  }
}
