import { IP5Lifecycle } from "src/p5/interfaces.mjs";

export default class StoneButton extends IP5Lifecycle {
  /**
   * @param {{
   *   x: number,
   *   y: number,
   *   size?: number,
   *   colorName: string,
   *   colorValue: string,
   *   selected?: boolean,
   *   onClick?: ((p5: import("p5"), event: MouseEvent | null) => void) | null,
   * }} options
   */
  constructor(options) {
    super();

    this.x = options.x;
    this.y = options.y;
    this.size = options.size ?? 36;
    this.colorName = options.colorName;
    this.colorValue = options.colorValue;
    this.selected = options.selected ?? false;
    this.onClickCallback = options.onClick ?? null;

    this.hovered = false;
    this.pressed = false;
  }

  setup(p5) {}

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    p5.push();
    {
      const radius = this.size / 2;

      // Selection ring
      if (this.selected) {
        p5.noFill();
        p5.stroke(0);
        p5.strokeWeight(3);
        p5.circle(this.x, this.y, this.size + 10);
      }

      // Hover ring
      if (this.hovered && !this.selected) {
        p5.noFill();
        p5.stroke(0);
        p5.strokeWeight(1.5);
        p5.circle(this.x, this.y, this.size + 8);
      }

      // Stone
      p5.stroke(0);
      p5.strokeWeight(1.5);
      p5.fill(this.colorValue);
      p5.circle(this.x, this.y, this.size);

      // Extra outline for white stone visibility
      if (this.colorName === "white") {
        p5.noFill();
        p5.stroke(0);
        p5.strokeWeight(2);
        p5.circle(this.x, this.y, this.size);
      }

      // Subtle pressed feedback
      if (this.pressed) {
        p5.noStroke();
        p5.fill(0, 35);
        p5.circle(this.x, this.y, this.size);
      }
    }
    p5.pop();
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  containsPoint(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.size / 2 + 6;
  }

  /**
   * @param {import("p5")} p5
   * @returns {boolean}
   */
  isHovered(p5) {
    return this.containsPoint(p5.mouseX, p5.mouseY);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    this.hovered = this.isHovered(p5);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this.pressed = this.containsPoint(p5.mouseX, p5.mouseY);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   * @returns {boolean}
   */
  mouseReleased(p5, event) {
    const wasPressed = this.pressed;
    const stillInside = this.containsPoint(p5.mouseX, p5.mouseY);

    this.pressed = false;

    return wasPressed && stillInside;
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent | null} event
   */
  click(p5, event = null) {
    this.onClickCallback?.(p5, event);
  }
}
