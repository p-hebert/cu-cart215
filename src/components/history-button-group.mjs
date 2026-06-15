import Button from "src/components/button.mjs";
import { IP5Lifecycle } from "src/p5/interfaces.mjs";

/** @typedef {import("src/components/board.mjs").default} Board */
/** @typedef {import("src/state/go-board-state.mjs").default} GoBoardState */

export default class HistoryButtonGroup extends IP5Lifecycle {
  /**
   * @param {{
   *   board: Board,
   *   boardState: GoBoardState,
   *   buttonWidth?: number,
   *   buttonHeight?: number,
   *   gap?: number,
   *   offsetY?: number,
   *   align?: "left" | "center" | "right",
   *   onUndo?: (() => void) | null,
   *   onRedo?: (() => void) | null,
   * }} options
   */
  constructor(options) {
    super();

    this.board = options.board;
    this.boardState = options.boardState;

    this.buttonWidth = options.buttonWidth ?? 42;
    this.buttonHeight = options.buttonHeight ?? 30;
    this.gap = options.gap ?? 8;
    this.offsetY = options.offsetY ?? 42;
    this.align = options.align ?? "left";

    this.backButton = null;
    this.forwardButton = null;
    this.onUndo = options.onUndo ?? null;
    this.onRedo = options.onRedo ?? null;
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {
    this.createButtons();
    this.updateLayout(p5);
  }

  createButtons() {
    const styles = {
      bgColor: "#edd58d",
      hoverBgColor: "#f4dca0",
      pressedBgColor: "#d7c17f",
      borderColor: "#000000",
      textColor: "#000000",
      disabledBgColor: "#d7c17f",
      disabledTextColor: "#777777",
      borderWidth: 1.5,
      radius: 5,
      textSize: 20,
    };

    this.backButton = new Button({
      x: 0,
      y: 0,
      w: this.buttonWidth,
      h: this.buttonHeight,
      label: "←",
      styles,
      onClick: () => {
        const changed = this.boardState.undo();
        if (changed) this.onUndo?.();
      },
    });

    this.forwardButton = new Button({
      x: 0,
      y: 0,
      w: this.buttonWidth,
      h: this.buttonHeight,
      label: "→",
      styles,
      onClick: () => {
        const changed = this.boardState.redo();
        if (changed) this.onRedo?.();
      },
    });
  }

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    this.updateLayout(p5);
    this.updateDisabledState();

    this.backButton.draw(p5);
    this.forwardButton.draw(p5);
  }

  /**
   * @param {import("p5")} p5
   */
  updateLayout(p5) {
    const boardOrigin = this.board.getOrigin(p5);
    const boardPixelSize = this.board.getBoardPixelSize();

    const totalWidth = this.buttonWidth * 2 + this.gap;

    let x = boardOrigin.x;

    if (this.align === "center") {
      x = boardOrigin.x + boardPixelSize / 2 - totalWidth / 2;
    } else if (this.align === "right") {
      x = boardOrigin.x + boardPixelSize - totalWidth;
    }

    const y = boardOrigin.y + boardPixelSize + this.offsetY;

    this.backButton.x = x;
    this.backButton.y = y;
    this.backButton.w = this.buttonWidth;
    this.backButton.h = this.buttonHeight;

    this.forwardButton.x = x + this.buttonWidth + this.gap;
    this.forwardButton.y = y;
    this.forwardButton.w = this.buttonWidth;
    this.forwardButton.h = this.buttonHeight;
  }

  updateDisabledState() {
    this.backButton.disabled = !this.boardState.canUndo();
    this.forwardButton.disabled = !this.boardState.canRedo();
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    this.updateLayout(p5);
    this.updateDisabledState();

    this.backButton.mouseMoved(p5, event);
    this.forwardButton.mouseMoved(p5, event);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this.updateLayout(p5);
    this.updateDisabledState();

    this.backButton.mousePressed(p5, event);
    this.forwardButton.mousePressed(p5, event);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   * @returns {boolean}
   */
  mouseReleased(p5, event) {
    this.updateLayout(p5);
    this.updateDisabledState();

    if (this.backButton.mouseReleased(p5, event)) {
      this.backButton.click(p5, event);
      return true;
    }

    if (this.forwardButton.mouseReleased(p5, event)) {
      this.forwardButton.click(p5, event);
      return true;
    }

    return false;
  }
}
