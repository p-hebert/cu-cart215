import { IP5Lifecycle } from "src/p5/interfaces.mjs";

export default class Board extends IP5Lifecycle {
  /**
   *
   * @param {{
   *    boardSize: number,
   *    cellSize: number,
   *    margin: number,
   *    squarePositions: Array<[number, number]>,
   *    alignment: [string, string]
   * }} options
   */
  constructor(options = {}) {
    super();
    this.boardSize = options?.boardSize ?? 7;
    this.cellSize = options?.cellSize ?? 70;
    this.margin = options?.margin ?? 100;
    this.squarePositions = options?.squarePositions ?? [
      [3, 3],
      [1, 1],
      [1, 5],
      [5, 1],
      [5, 5],
    ];
    // this.alignment = options.alignment;
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {}

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    this.drawBackground(p5);
    this.drawPointRegions(p5);
    this.drawBoardLines(p5);
    this.drawBlackSquares(p5);
  }

  // FIXME: dynamic board background size
  drawBackground(p5) {
    const { boardSize: BOARD_SIZE, cellSize: CELL_SIZE, margin: MARGIN } = this;
    const BOARD_WIDTH = MARGIN * 2 + CELL_SIZE * (BOARD_SIZE - 1);
    // background
    p5.push();
    {
      p5.fill("#edd58d");
      p5.noStroke();
      p5.rect(0, 0, BOARD_WIDTH, BOARD_WIDTH); // FIXME: ALIGNMENT
    }
    p5.pop();
  }

  /**
   *
   * @param {{ center: boolean }} param0
   * FIXME: ALIGNMENT support, dynamic point region size
   */
  drawPointRegions(p5, { center } = { center: true }) {
    const { cellSize: CELL_SIZE, margin: MARGIN } = this;
    p5.push();
    {
      p5.noStroke();
      p5.fill("#f4b66b");
      p5.rect(
        MARGIN + 1 * CELL_SIZE,
        MARGIN + 1 * CELL_SIZE,
        4 * CELL_SIZE,
        4 * CELL_SIZE,
      );
      p5.fill("#eb9d52");
      p5.rect(
        MARGIN + 2 * CELL_SIZE,
        MARGIN + 2 * CELL_SIZE,
        2 * CELL_SIZE,
        2 * CELL_SIZE,
      );
      if (center) {
        p5.fill("#f67b2e");
        p5.rect(
          MARGIN + 2.5 * CELL_SIZE,
          MARGIN + 2.5 * CELL_SIZE,
          1 * CELL_SIZE,
          1 * CELL_SIZE,
        );
      }
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   * FIXME: ALIGNMENT support
   */
  drawBoardLines(p5) {
    const { boardSize: BOARD_SIZE, cellSize: CELL_SIZE, margin: MARGIN } = this;
    p5.push();
    {
      p5.stroke(0);
      p5.strokeWeight(2);

      for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = MARGIN + i * CELL_SIZE;

        // Vertical lines
        p5.line(pos, MARGIN, pos, MARGIN + CELL_SIZE * (BOARD_SIZE - 1));

        // Horizontal lines
        p5.line(MARGIN, pos, MARGIN + CELL_SIZE * (BOARD_SIZE - 1), pos);
      }
    }
    p5.pop();
  }

  drawBlackSquares(p5) {
    const {
      cellSize: CELL_SIZE,
      margin: MARGIN,
      squarePositions: SQUARE_POS,
    } = this;
    p5.push();
    {
      p5.rectMode(p5.CENTER);
      p5.noStroke();
      p5.fill(0);

      const squareSize = 10;

      for (const [col, row] of SQUARE_POS) {
        const x = MARGIN + col * CELL_SIZE;
        const y = MARGIN + row * CELL_SIZE;

        p5.rect(x, y, squareSize, squareSize);
      }
    }
    p5.pop();
  }
}
