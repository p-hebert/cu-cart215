import { IP5Lifecycle } from "src/p5/interfaces.mjs";

export default class NotificationToast extends IP5Lifecycle {
  /**
   * @param {{
   *   durationMillis?: number,
   *   fadeMillis?: number,
   *   width?: number,
   *   padding?: number,
   *   fontSize?: number,
   *   offsetY?: number,
   * }} options
   */
  constructor(options = {}) {
    super();

    this.message = null;
    this.startedAtMillis = null;

    this.durationMillis = options.durationMillis ?? 2400;
    this.fadeMillis = options.fadeMillis ?? 350;

    this.width = options.width ?? 420;
    this.padding = options.padding ?? 12;
    this.fontSize = options.fontSize ?? 14;
    this.offsetY = options.offsetY ?? 18;
  }

  setup(p5) {}

  /**
   * @param {string} message
   */
  show(message) {
    this.message = message;
    this.startedAtMillis = null;
  }

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    if (!this.message) return;

    if (this.startedAtMillis === null) {
      this.startedAtMillis = p5.millis();
    }

    const elapsed = p5.millis() - this.startedAtMillis;

    if (elapsed >= this.durationMillis) {
      this.clear();
      return;
    }

    const alpha = this.getAlpha(elapsed);
    this.drawToast(p5, alpha);
  }

  /**
   * @param {number} elapsed
   * @returns {number}
   */
  getAlpha(elapsed) {
    const fadeOutStartsAt = this.durationMillis - this.fadeMillis;

    if (elapsed < fadeOutStartsAt) {
      return 255;
    }

    const fadeProgress = (elapsed - fadeOutStartsAt) / this.fadeMillis;
    return 255 * (1 - fadeProgress);
  }

  /**
   * @param {import("p5")} p5
   * @param {number} alpha
   */
  drawToast(p5, alpha) {
    const bodyLines = this.wrapText(
      p5,
      this.message,
      this.width - this.padding * 2,
      this.fontSize,
    );

    const lineHeight = this.fontSize + 5;
    const height = this.padding * 2 + bodyLines.length * lineHeight;

    const x = p5.width / 2 - this.width / 2;
    const y = this.offsetY;

    p5.push();
    {
      p5.rectMode(p5.CORNER);

      const bg = p5.color("#edd58d");
      bg.setAlpha(alpha);

      const stroke = p5.color(0);
      stroke.setAlpha(alpha);

      const textColor = p5.color(0);
      textColor.setAlpha(alpha);

      p5.stroke(stroke);
      p5.strokeWeight(1.5);
      p5.fill(bg);
      p5.rect(x, y, this.width, height, 6);

      p5.noStroke();
      p5.fill(textColor);
      p5.textAlign(p5.LEFT, p5.TOP);
      p5.textSize(this.fontSize);
      p5.textStyle(p5.NORMAL);

      const textX = x + this.padding;
      const textY = y + this.padding + 4;

      for (let i = 0; i < bodyLines.length; i++) {
        p5.text(bodyLines[i], textX, textY + i * lineHeight);
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

  clear() {
    this.message = null;
    this.startedAtMillis = null;
  }
}
