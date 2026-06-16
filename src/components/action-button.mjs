import { IP5Lifecycle } from "src/p5/interfaces.mjs";

export default class ActionButton extends IP5Lifecycle {
  /**
   * @param {{
   *   x: number,
   *   y: number,
   *   key: string,
   *   label: string,
   *   name?: string,
   *   description?: string,
   *   enabled?: boolean,
   *   selected?: boolean,
   *   textSize?: number,
   *   hitSize?: number,
   *   hoverDelayMillis?: number,
   *   onClick?: ((key: string) => void) | null,
   * }} options
   */
  constructor(options) {
    super();

    this.x = options.x;
    this.y = options.y;

    this.key = options.key;
    this.label = options.label;
    this.name = options.name ?? options.key;
    this.description = options.description ?? "";

    this.enabled = options.enabled ?? true;
    this.selected = options.selected ?? false;

    this.textSize = options.textSize ?? 20;
    this.hitSize = options.hitSize ?? 28;

    this.hoverDelayMillis = options.hoverDelayMillis ?? 1000;

    this.onClick = options.onClick ?? null;

    this.hovered = false;
    this.pressed = false;
    this.hoverStartedAtMillis = null;
  }

  setup(p5) {}

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    p5.push();
    {
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textSize(this.textSize);
      p5.textStyle(p5.NORMAL);
      p5.noStroke();

      if (this.enabled) {
        p5.fill(0, 255);
      } else {
        p5.fill(0, 64); // 25% opacity
      }

      p5.text(this.label, this.x, this.y);

      if (this.selected) {
        this.drawUnderline(p5);
      }
    }
    p5.pop();

    if (this.shouldShowTooltip(p5)) {
      this.drawTooltip(p5);
    }
  }

  /**
   * @param {import("p5")} p5
   */
  drawUnderline(p5) {
    p5.push();
    {
      const y = this.y + this.textSize * 0.72;
      const halfWidth = this.hitSize * 0.38;

      p5.stroke(0);
      p5.strokeWeight(4);
      p5.line(this.x - halfWidth, y, this.x + halfWidth, y);
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   * @returns {boolean}
   */
  shouldShowTooltip(p5) {
    if (!this.enabled) return false;
    if (!this.hovered) return false;
    if (this.hoverStartedAtMillis === null) return false;

    return p5.millis() - this.hoverStartedAtMillis >= this.hoverDelayMillis;
  }

  /**
   * @param {import("p5")} p5
   */
  drawTooltip(p5) {
    const padding = 12;
    const width = 280;
    const titleSize = 14;
    const bodySize = 13;
    const lineGap = 8;

    const title = this.name.toUpperCase();
    const description = this.description;

    const titleHeight = titleSize + 4;
    const bodyLines = this.wrapText(
      p5,
      description,
      width - padding * 2,
      bodySize,
    );
    const bodyHeight = bodyLines.length * (bodySize + 4);

    const height = padding * 2 + titleHeight + lineGap + bodyHeight;

    let x = this.x - width / 2;
    let y = this.y - this.hitSize / 2 - height - 14;

    // Keep inside canvas horizontally.
    x = Math.max(8, Math.min(x, p5.width - width - 8));

    // If there is not enough space above, show below.
    if (y < 8) {
      y = this.y + this.hitSize / 2 + 14;
    }

    p5.push();
    {
      p5.rectMode(p5.CORNER);

      p5.stroke(0);
      p5.strokeWeight(1.5);
      p5.fill("#edd58d");
      p5.rect(x, y, width, height, 6);

      p5.noStroke();
      p5.fill(0);
      p5.textAlign(p5.LEFT, p5.TOP);

      p5.textStyle(p5.BOLD);
      p5.textSize(titleSize);
      p5.text(title, x + padding, y + padding);

      p5.textStyle(p5.NORMAL);
      p5.textSize(bodySize);

      const bodyY = y + padding + titleHeight + lineGap;

      for (let i = 0; i < bodyLines.length; i++) {
        p5.text(bodyLines[i], x + padding, bodyY + i * (bodySize + 4));
      }
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   * @param {string} text
   * @param {number} maxWidth
   * @param {number} textSize
   * @returns {string[]}
   */
  wrapText(p5, text, maxWidth, textSize) {
    p5.push();
    p5.textSize(textSize);

    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine =
        currentLine.length === 0 ? word : `${currentLine} ${word}`;

      if (p5.textWidth(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        currentLine = word;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    p5.pop();

    return lines;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  containsPoint(px, py) {
    return (
      px >= this.x - this.hitSize / 2 &&
      px <= this.x + this.hitSize / 2 &&
      py >= this.y - this.hitSize / 2 &&
      py <= this.y + this.hitSize / 2
    );
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    const nowHovered = this.containsPoint(p5.mouseX, p5.mouseY);

    if (nowHovered && !this.hovered) {
      this.hoverStartedAtMillis = p5.millis();
    }

    if (!nowHovered) {
      this.hoverStartedAtMillis = null;
    }

    this.hovered = nowHovered;

    if (this.enabled && this.hovered) {
      p5.cursor(p5.HAND);
    }
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    if (!this.enabled) return;

    this.pressed = this.containsPoint(p5.mouseX, p5.mouseY);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   * @returns {boolean}
   */
  mouseReleased(p5, event) {
    if (!this.enabled) {
      this.pressed = false;
      return false;
    }

    const wasPressed = this.pressed;
    const stillInside = this.containsPoint(p5.mouseX, p5.mouseY);

    this.pressed = false;

    return wasPressed && stillInside;
  }

  click() {
    if (!this.enabled) return;
    this.onClick?.(this.key);
  }
}
