import CollapseRulesHelper, {
  DEFAULT_COLLAPSE_RINGS,
} from "src/engine/collapse-rules-helper.mjs";
import ScoreCalculator, {
  PLAYER_COLORS,
} from "src/engine/score-calculator.mjs";
import { IP5Lifecycle } from "src/p5/interfaces.mjs";

/** @typedef {import("src/components/board.mjs").default} Board */
/** @typedef {import("src/engine/game-state.mjs").default} GameState */
/**
 * @property {import("src/engine/score-calculator.mjs").default} [scoreCalculator]
 */

export default class ScoreTracker extends IP5Lifecycle {
  /**
   * @param {{
   *   board: Board,
   *   gameState: GameState,
   *   colors?: Array<{ name: string, value: string }>,
   *   rings?: import("src/engine/collapse-rules-helper.mjs").CollapseRingRule[],
   *   offsetX?: number,
   *   offsetY?: number,
   *   stoneSize?: number,
   *   rowHeight?: number,
   *   fontSize?: number,
   *   colWidths?: {
   *     color?: number,
   *     score?: number,
   *     inner?: number,
   *     outer?: number,
   *   },
   * }} options
   */
  constructor(options) {
    super();

    this.board = options.board;
    this.gameState = options.gameState;

    this.colors = options.colors ?? PLAYER_COLORS;

    // Rename middle collapse ring label to "Outer" for table display.
    this.rings =
      options.rings ??
      DEFAULT_COLLAPSE_RINGS.map((ring) => {
        if (ring.name === "middle") {
          return {
            ...ring,
            label: "Outer",
          };
        }

        return ring;
      });

    this.offsetX = options.offsetX ?? 44;
    this.offsetY = options.offsetY ?? 32;

    this.stoneSize = options.stoneSize ?? 22;
    this.rowHeight = options.rowHeight ?? 28;
    this.fontSize = options.fontSize ?? 16;

    this.colWidths = {
      color: options.colWidths?.color ?? 72,
      score: options.colWidths?.score ?? 64,
      inner: options.colWidths?.inner ?? 72,
      outer: options.colWidths?.outer ?? 72,
    };

    this.scoreCalculator =
      options.scoreCalculator ??
      new ScoreCalculator({
        colors: this.colors,
      });

    this.collapseRulesHelper = new CollapseRulesHelper({
      colors: this.colors,
      rings: this.rings,
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
    const board = this.gameState.getBoard();
    const scores = this.scoreCalculator.calculateScores(board);
    const collapseStatus = this.collapseRulesHelper.getCollapseStatus(board);

    const innerStatus = collapseStatus[0];
    const outerStatus = collapseStatus[1];

    const { x, y } = this.getPosition(p5);

    p5.push();
    {
      p5.textFont("monospace");
      p5.textSize(this.fontSize);
      p5.textAlign(p5.LEFT, p5.CENTER);
      p5.textStyle(p5.BOLD);
      p5.noStroke();

      this.drawHeaderRows(p5, x, y);

      p5.textStyle(p5.NORMAL);

      const firstDataRowY = y + this.rowHeight * 2;

      let visibleRowIndex = 0;

      for (const color of this.colors) {
        if (color.name === "scar") continue;

        const innerColorStatus = innerStatus.colors[color.name];
        const outerColorStatus = outerStatus.colors[color.name];

        if (!innerColorStatus || !outerColorStatus) continue;

        const rowY = firstDataRowY + visibleRowIndex * this.rowHeight;

        this.drawDataRow(
          p5,
          x,
          rowY,
          color,
          scores[color.name] ?? 0,
          innerColorStatus,
          outerColorStatus,
        );

        visibleRowIndex++;
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

    return {
      x: boardOrigin.x + boardPixelSize + this.offsetX,
      y: boardOrigin.y + this.offsetY,
    };
  }

  /**
   * @param {import("p5")} p5
   * @param {number} x
   * @param {number} y
   */
  drawHeaderRows(p5, x, y) {
    const colorX = x;
    const scoreX = colorX + this.colWidths.color;
    const collapseX = scoreX + this.colWidths.score;
    const innerX = collapseX;
    const outerX = innerX + this.colWidths.inner;

    p5.fill(0);

    // Header row 1
    p5.text("Color", colorX, y);
    p5.text("Score", scoreX, y);
    p5.text("Collapse", collapseX, y);

    // Header row 2
    const y2 = y + this.rowHeight;
    p5.text("Inner", innerX, y2);
    p5.text("Outer", outerX, y2);
  }

  /**
   * @param {import("p5")} p5
   * @param {number} x
   * @param {number} y
   * @param {{ name: string, value: string }} color
   * @param {number} score
   * @param {{
   *   count: number,
   *   overloaded: boolean,
   *   immediateCollapse: boolean,
   * }} innerStatus
   * @param {{
   *   count: number,
   *   overloaded: boolean,
   *   immediateCollapse: boolean,
   * }} outerStatus
   */
  drawDataRow(p5, x, y, color, score, innerStatus, outerStatus) {
    const colorX = x;
    const scoreX = colorX + this.colWidths.color;
    const innerX = scoreX + this.colWidths.score;
    const outerX = innerX + this.colWidths.inner;

    this.drawStoneIcon(p5, colorX + this.stoneSize / 2, y, color);

    p5.noStroke();

    p5.fill(0);
    p5.text(String(score), scoreX, y);

    const innerRing = this.rings[0];
    const outerRing = this.rings[1];

    p5.fill(this.getCollapseCounterColor(innerStatus));
    p5.text(
      this.formatCollapseCounter(innerStatus.count, innerRing),
      innerX,
      y,
    );

    p5.fill(this.getCollapseCounterColor(outerStatus));
    p5.text(
      this.formatCollapseCounter(outerStatus.count, outerRing),
      outerX,
      y,
    );
  }

  /**
   * @param {number} count
   * @param {import("src/engine/collapse-rules-helper.mjs").CollapseRingRule} ring
   * @returns {string}
   */
  formatCollapseCounter(count, ring) {
    const safeLimit = ring.overloadAt - 1;
    return `${count}/${safeLimit}`;
  }

  /**
   * @param {{
   *   overloaded: boolean,
   *   immediateCollapse: boolean,
   * }} status
   * @returns {string}
   */
  getCollapseCounterColor(status) {
    if (status.immediateCollapse) return "#f00";
    if (status.overloaded) return "#c76b00";
    return "#000";
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
      p5.strokeWeight(1.25);
      p5.fill(color.value);
      p5.circle(x, y, this.stoneSize);

      if (color.name === "white") {
        p5.noFill();
        p5.stroke(0);
        p5.strokeWeight(1.75);
        p5.circle(x, y, this.stoneSize);
      }
    }
    p5.pop();
  }

  hasImmediateCollapse() {
    return this.collapseRulesHelper.hasImmediateCollapse(
      this.gameState.getBoard(),
    );
  }

  hasEndgameCollapse() {
    return this.collapseRulesHelper.hasEndgameCollapse(
      this.gameState.getBoard(),
    );
  }

  getImmediateCollapseEntries() {
    return this.collapseRulesHelper.getImmediateCollapseEntries(
      this.gameState.getBoard(),
    );
  }

  getEndgameCollapseEntries() {
    return this.collapseRulesHelper.getEndgameCollapseEntries(
      this.gameState.getBoard(),
    );
  }
}
