import { IP5Lifecycle } from "src/p5/interfaces.mjs";

/** @typedef {import("src/components/board.mjs").default} Board */

export default class CountdownTimer extends IP5Lifecycle {
  /**
   * @param {{
   *   board: Board,
   *   durationSeconds?: number,
   *   offsetY?: number,
   *   fontSize?: number,
   * }} options
   */
  constructor(options) {
    super();

    this.board = options.board;
    this.durationSeconds = options.durationSeconds ?? 10 * 60;
    this.offsetY = options.offsetY ?? 44;
    this.fontSize = options.fontSize ?? 32;

    this.startedAtMillis = null;
    this.paused = false;
    this.pauseStartedAtMillis = null;
    this.totalPausedMillis = 0;
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {
    this.startedAtMillis = p5.millis();
  }

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    const remainingSeconds = this.getRemainingSeconds(p5);
    const label = this.formatTime(remainingSeconds);
    const { x, y } = this.getPosition(p5);

    p5.push();
    {
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textFont("monospace");
      p5.textSize(this.fontSize);
      p5.textStyle(p5.BOLD);
      p5.noStroke();

      if (remainingSeconds <= 0) {
        p5.fill("#f00");
      } else if (remainingSeconds <= 60) {
        p5.fill("#c76b00");
      } else {
        p5.fill(0);
      }

      p5.text(label, x, y);
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   * @returns {{ x: number, y: number }}
   */
  getPosition(p5) {
    const boardOrigin = this.board.getOrigin(p5);
    const boardPixelSize = this.board.getBoardPixelSize();

    return {
      x: boardOrigin.x + boardPixelSize / 2,
      y: boardOrigin.y - this.offsetY,
    };
  }

  /**
   * @param {import("p5")} p5
   * @returns {number}
   */
  getRemainingSeconds(p5) {
    if (this.startedAtMillis === null) {
      return this.durationSeconds;
    }

    const now = this.paused ? this.pauseStartedAtMillis : p5.millis();

    const elapsedMillis = now - this.startedAtMillis - this.totalPausedMillis;

    const elapsedSeconds = Math.floor(elapsedMillis / 1000);

    return Math.max(0, this.durationSeconds - elapsedSeconds);
  }

  /**
   * @returns {boolean}
   */
  isFinished(p5) {
    return this.getRemainingSeconds(p5) <= 0;
  }

  /**
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${this.pad2(minutes)}:${this.pad2(remainingSeconds)}`;
  }

  /**
   * @param {number} value
   * @returns {string}
   */
  pad2(value) {
    return String(value).padStart(2, "0");
  }

  /**
   * @param {import("p5")} p5
   */
  pause(p5) {
    if (this.paused) return;

    this.paused = true;
    this.pauseStartedAtMillis = p5.millis();
  }

  /**
   * @param {import("p5")} p5
   */
  resume(p5) {
    if (!this.paused) return;

    this.paused = false;
    this.totalPausedMillis += p5.millis() - this.pauseStartedAtMillis;
    this.pauseStartedAtMillis = null;
  }

  /**
   * @param {import("p5")} p5
   */
  reset(p5) {
    this.startedAtMillis = p5.millis();
    this.paused = false;
    this.pauseStartedAtMillis = null;
    this.totalPausedMillis = 0;
  }
}
