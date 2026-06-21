import { IP5Drawable } from "src/p5/interfaces.mjs";

export default class Stone extends IP5Drawable {
  constructor({ col, row, colorName, board, size = 36 }) {
    super();

    this.col = col;
    this.row = row;
    this.colorName = colorName;
    this.board = board;
    this.size = size;
  }

  setup(p5) {}

  draw(p5) {
    const { x, y } = this.board.gridToWorld(p5, this.col, this.row);
    const colorValue = this.getColorValue();

    p5.push();
    {
      p5.stroke(0);
      p5.strokeWeight(1.5);
      p5.fill(colorValue);
      p5.circle(x, y, this.size);

      if (this.colorName === "white") {
        p5.stroke(0);
        p5.strokeWeight(2);
        p5.noFill();
        p5.circle(x, y, this.size);
      }
    }
    p5.pop();
  }

  getColorValue() {
    const colors = {
      black: "#000000",
      white: "#ffffff",
      "blood-red": "#f00",
      "midnight-blue": "#00f",
    };

    return colors[this.colorName] ?? "#000000";
  }
}
