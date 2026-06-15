import { IP5Drawable } from "src/p5/interfaces.mjs";

export default class Board extends IP5Drawable {
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
    this.boardSize = options.boardSize ?? 7;
    this.cellSize = options.cellSize ?? 70;
    this.margin = options.margin ?? 100;
    this.squarePositions = options.squarePositions ?? [
      [3, 3],
      [1, 1],
      [1, 5],
      [5, 1],
      [5, 5],
    ];
    this.alignment = options.alignment ?? ["center", "center"];
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {}

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    this.#drawBackground(p5);
    this.#drawPointRegions(p5);
    this.#drawBoardLines(p5);
    this.#drawBlackSquares(p5);
  }

  getBoardPixelSize() {
    return this.margin * 2 + this.cellSize * (this.boardSize - 1);
  }

  /**
   * @param {import("p5")} p5
   * @returns {{ x: number, y: number }}
   */
  getOrigin(p5) {
    const boardPixelSize = this.getBoardPixelSize();

    // Default top-left behavior
    let x = 0;
    let y = 0;

    if (this.alignment?.[0] === "center") {
      x = p5.width / 2 - boardPixelSize / 2;
    }

    if (this.alignment?.[1] === "center") {
      y = p5.height / 2 - boardPixelSize / 2;
    }

    return { x, y };
  }

  gridToWorld(p5, col, row) {
    const origin = this.getOrigin(p5);

    return {
      x: origin.x + this.margin + col * this.cellSize,
      y: origin.y + this.margin + row * this.cellSize,
    };
  }

  worldToGrid(p5, x, y, radius = 16) {
    let closest = null;
    let closestDistance = Infinity;

    for (let col = 0; col < this.boardSize; col++) {
      for (let row = 0; row < this.boardSize; row++) {
        const pos = this.gridToWorld(p5, col, row);
        const d = p5.dist(x, y, pos.x, pos.y);

        if (d < closestDistance) {
          closestDistance = d;
          closest = { col, row };
        }
      }
    }

    return closestDistance <= radius ? closest : null;
  }

  // FIXME: dynamic board background size
  #drawBackground(p5) {
    const origin = this.getOrigin(p5);
    const boardPixelSize = this.getBoardPixelSize();
    // background
    p5.push();
    {
      p5.fill("#edd58d");
      p5.noStroke();
      p5.rect(origin.x, origin.y, boardPixelSize, boardPixelSize);
    }
    p5.pop();
  }

  /**
   *
   * @param {{ center: boolean }} param0
   * FIXME: dynamic point region size
   */
  #drawPointRegions(p5, { center } = { center: true }) {
    const origin = this.getOrigin(p5);
    const { cellSize: CELL_SIZE, margin: MARGIN } = this;
    p5.push();
    {
      p5.noStroke();
      p5.fill("#f4b66b");
      p5.rect(
        origin.x + MARGIN + 1 * CELL_SIZE,
        origin.y + MARGIN + 1 * CELL_SIZE,
        4 * CELL_SIZE,
        4 * CELL_SIZE,
      );
      p5.fill("#eb9d52");
      p5.rect(
        origin.x + MARGIN + 2 * CELL_SIZE,
        origin.y + MARGIN + 2 * CELL_SIZE,
        2 * CELL_SIZE,
        2 * CELL_SIZE,
      );
      if (center) {
        p5.fill("#f67b2e");
        p5.rect(
          origin.x + MARGIN + 2.5 * CELL_SIZE,
          origin.y + MARGIN + 2.5 * CELL_SIZE,
          1 * CELL_SIZE,
          1 * CELL_SIZE,
        );
      }
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   */
  #drawBoardLines(p5) {
    const origin = this.getOrigin(p5);

    p5.push();
    {
      p5.stroke(0);
      p5.strokeWeight(2);

      for (let i = 0; i < this.boardSize; i++) {
        const pos = this.margin + i * this.cellSize;

        const x = origin.x + pos;
        const y = origin.y + pos;

        const start = this.margin;
        const end = this.margin + this.cellSize * (this.boardSize - 1);

        p5.line(x, origin.y + start, x, origin.y + end);
        p5.line(origin.x + start, y, origin.x + end, y);
      }
    }
    p5.pop();
  }

  #drawBlackSquares(p5) {
    const {
      cellSize: CELL_SIZE,
      margin: MARGIN,
      squarePositions: SQUARE_POS,
    } = this;
    const origin = this.getOrigin(p5);
    p5.push();
    {
      p5.rectMode(p5.CENTER);
      p5.noStroke();
      p5.fill(0);

      const squareSize = 10;
      for (const [col, row] of SQUARE_POS) {
        const x = origin.x + MARGIN + col * CELL_SIZE;
        const y = origin.y + MARGIN + row * CELL_SIZE;

        p5.rect(x, y, squareSize, squareSize);
      }
    }
    p5.pop();
  }
}
