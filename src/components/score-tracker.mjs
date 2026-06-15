import ScoreCalculator, { STONE_COLORS } from "src/engine/score-calculator.mjs";
import { IP5Lifecycle } from "src/p5/interfaces.mjs";

/** @typedef {import("src/components/board.mjs").default} Board */
/** @typedef {import("src/engine/go-board-state.mjs").default} GoBoardState */

export default class ScoreTracker extends IP5Lifecycle {
  /**
   * @param {{
   *   board: Board,
   *   boardState: GoBoardState,
   *   colors?: Array<{ name: string, value: string }>,
   *   offsetX?: number,
   *   alignY?: "top" | "center",
   *   rowGap?: number,
   *   stoneSize?: number,
   *   textOffsetX?: number,
   * }} options
   */
  constructor(options) {
    super();

    this.board = options.board;
    this.boardState = options.boardState;

    this.colors = options.colors ?? STONE_COLORS;

    this.offsetX = options.offsetX ?? 42;
    this.alignY = options.alignY ?? "center";
    this.rowGap = options.rowGap ?? 18;
    this.stoneSize = options.stoneSize ?? 28;
    this.textOffsetX = options.textOffsetX ?? 26;

    this.scoreCalculator = new ScoreCalculator({
      colors: this.colors,
    });
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {}

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    const scores = this.scoreCalculator.calculateScores(
      this.boardState.getBoard(),
    );

    const { x, y } = this.getPosition(p5);

    p5.push();
    {
      p5.textAlign(p5.LEFT, p5.CENTER);
      p5.textSize(20);
      p5.textStyle(p5.BOLD);

      for (let i = 0; i < this.colors.length; i++) {
        const color = this.colors[i];
        const rowY = y + i * (this.stoneSize + this.rowGap);

        this.drawStoneIcon(p5, x, rowY, color);
        this.drawScoreText(
          p5,
          x + this.stoneSize / 2 + this.textOffsetX,
          rowY,
          scores[color.name],
        );
      }
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

    const totalHeight =
      this.colors.length * this.stoneSize +
      (this.colors.length - 1) * this.rowGap;

    const x = boardOrigin.x + boardPixelSize + this.offsetX;

    let y = boardOrigin.y;

    if (this.alignY === "center") {
      y =
        boardOrigin.y +
        boardPixelSize / 2 -
        totalHeight / 2 +
        this.stoneSize / 2;
    } else {
      y = boardOrigin.y + this.stoneSize / 2;
    }

    return { x, y };
  }

  /**
   * @param {import("p5")} p5
   * @param {number} x
   * @param {number} y
   * @param {{ name: string, value: string }} color
   */
  drawStoneIcon(p5, x, y, color) {
    p5.push();
    {
      p5.stroke(0);
      p5.strokeWeight(1.5);
      p5.fill(color.value);
      p5.circle(x, y, this.stoneSize);

      if (color.name === "white") {
        p5.noFill();
        p5.stroke(0);
        p5.strokeWeight(2);
        p5.circle(x, y, this.stoneSize);
      }
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   * @param {number} x
   * @param {number} y
   * @param {number} score
   */
  drawScoreText(p5, x, y, score) {
    p5.push();
    {
      p5.noStroke();
      p5.fill(0);
      p5.text(String(score), x, y);
    }
    p5.pop();
  }
}
