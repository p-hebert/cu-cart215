import Board from "src/components/board.mjs";
import HistoryButtonGroup from "src/components/history-button-group.mjs";
import StoneSelector from "src/components/stone-selector.mjs";
import { BaseScene } from "src/p5/scene.mjs";
import GoBoardState from "src/state/go-board-state.mjs";

const STONE_COLORS = {
  black: "#000000",
  white: "#ffffff",
  "blood-red": "#8a0303",
  "midnight-blue": "#191970",
};

const STONE_SIZE = 36;
const GHOST_STONE_ALPHA = 0.5;

/**
 * Game Scene
 *
 * TODO: Docs.
 */
export default class GameScene extends BaseScene {
  static key = "game";
  static label = "Game";

  constructor({} = {}) {
    super();

    this.board = null;
    this.stoneSelector = null;

    // boardState[row][col] = null | "black" | "white" | "blood-red" | "midnight-blue"
    this.boardState = null;

    this.historyButtonGroup = null;
    // { col, row } | null
    this.hoveredIntersection = null;

    this._setupped = false;
  }

  /**
   * @param {import('p5')} p5
   */
  setup(p5) {
    if (this._setupped) {
      return;
    }

    this.board = new Board({
      boardSize: 7,
      cellSize: 70,
      margin: 100,
      alignment: ["center", "center"],
    });
    this.board.setup(p5);

    this.goBoardState = new GoBoardState({
      boardSize: this.board.boardSize,
    });

    this.historyButtonGroup = new HistoryButtonGroup({
      board: this.board,
      boardState: this.goBoardState,
      offsetY: 30,
      align: "left",
    });
    this.historyButtonGroup.setup(p5);

    this.stoneSelector = new StoneSelector({
      board: this.board,
      selectedColorName: "black",
      offsetY: 44,
    });
    this.stoneSelector.setup(p5);

    this._setupped = true;
  }

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} prevScene
   */
  onEnter(p5, prevScene) {
    console.log(`Entering '${this.key}' from '${prevScene.key}'`);
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.background("#ecf4f7");

    if (!this._setupped) {
      return;
    }

    this.board.draw(p5);
    this.drawStones(p5);
    this.drawGhostStone(p5);

    this.historyButtonGroup.draw(p5);
    this.stoneSelector.draw(p5);
  }

  /**
   * @param {import('p5')} p5
   */
  drawStones(p5) {
    const boardState = this.goBoardState.getBoard();

    for (let row = 0; row < boardState.length; row++) {
      for (let col = 0; col < boardState[row].length; col++) {
        const colorName = boardState[row][col];

        if (colorName === null) continue;

        this.drawStoneAtGridPosition(p5, col, row, colorName, 1);
      }
    }
  }

  /**
   * @param {import('p5')} p5
   */
  drawGhostStone(p5) {
    if (!this.hoveredIntersection) return;

    const { col, row } = this.hoveredIntersection;

    if (!this.goBoardState.isEmpty(col, row)) return;

    const colorName = this.stoneSelector.getSelectedColorName();

    this.drawStoneAtGridPosition(p5, col, row, colorName, GHOST_STONE_ALPHA);
  }

  /**
   * @param {import('p5')} p5
   * @param {number} col
   * @param {number} row
   * @param {string} colorName
   * @param {number} alpha
   */
  drawStoneAtGridPosition(p5, col, row, colorName, alpha = 1) {
    const { x, y } = this.board.gridToWorld(p5, col, row);
    const colorValue = STONE_COLORS[colorName] ?? "#000000";

    p5.push();
    {
      const stoneColor = p5.color(colorValue);
      stoneColor.setAlpha(255 * alpha);

      const strokeColor = p5.color("#000000");
      strokeColor.setAlpha(255 * alpha);

      p5.stroke(strokeColor);
      p5.strokeWeight(1.5);
      p5.fill(stoneColor);
      p5.circle(x, y, STONE_SIZE);

      // Extra outline for white stones.
      if (colorName === "white") {
        p5.noFill();
        p5.stroke(strokeColor);
        p5.strokeWeight(2);
        p5.circle(x, y, STONE_SIZE);
      }
    }
    p5.pop();
  }

  /**
   * p5 may not always emit mouseMoved while dragging or after a click,
   * so keeping this separate makes it easy to reuse.
   *
   * @param {import('p5')} p5
   */
  updateHoveredIntersection(p5) {
    this.hoveredIntersection = this.board.worldToGrid(
      p5,
      p5.mouseX,
      p5.mouseY,
      16,
    );
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    this.stoneSelector.mouseMoved(p5, event);
    this.historyButtonGroup.mouseMoved(p5, event);
    this.updateHoveredIntersection(p5);
  }

  mousePressed(p5, event) {
    this.stoneSelector.mousePressed(p5, event);
    this.historyButtonGroup.mousePressed(p5, event);
  }

  mouseReleased(p5, event) {
    const historyHandledClick = this.historyButtonGroup.mouseReleased(
      p5,
      event,
    );

    if (historyHandledClick) {
      this.updateHoveredIntersection(p5);
      return;
    }

    const selectorHandledClick = this.stoneSelector.mouseReleased(p5, event);

    if (selectorHandledClick) {
      this.updateHoveredIntersection(p5);
      return;
    }

    const intersection = this.board.worldToGrid(p5, p5.mouseX, p5.mouseY, 16);

    if (!intersection) {
      this.hoveredIntersection = null;
      return;
    }

    const { col, row } = intersection;
    const colorName = this.stoneSelector.getSelectedColorName();

    this.placeStone(col, row, colorName);
    this.updateHoveredIntersection(p5);
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {string} colorName
   */
  placeStone(col, row, colorName) {
    return this.goBoardState.placeStone(col, row, colorName);
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isOnBoard(col, row) {
    return (
      col >= 0 &&
      col < this.board.boardSize &&
      row >= 0 &&
      row < this.board.boardSize
    );
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {}

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {}

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} nextScene
   */
  onExit(p5, nextScene) {
    console.log(`Exiting '${this.key}' to '${nextScene.key}'`);
  }
}
