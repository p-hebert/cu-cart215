import Board from "src/components/board.mjs";
import CountdownTimer from "src/components/countdown-timer.mjs";
import HistoryButtonGroup from "src/components/history-button-group.mjs";
import ScoreTracker from "src/components/score-tracker.mjs";
import StoneSelector from "src/components/stone-selector.mjs";
import GoBoardState from "src/engine/go-board-state.mjs";
import { BaseScene } from "src/p5/scene.mjs";

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

    // boardState[row][col] = null | "black" | "white" | "blood-red" | "midnight-blue"
    this.boardState = null;
    // { col, row } | null
    this.hoveredIntersection = null;
    this.hoverMoveResult = null;

    this.countdownTimer = null;
    this.scoreTracker = null;
    this.stoneSelector = null;
    this.historyButtonGroup = null;

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

    this.countdownTimer = new CountdownTimer({
      board: this.board,
      durationSeconds: 10 * 60,
      offsetY: 44,
      fontSize: 32,
    });
    this.countdownTimer.setup(p5);

    this.scoreTracker = new ScoreTracker({
      board: this.board,
      boardState: this.goBoardState,
      offsetX: 44,
      offsetY: 32,

      // Playtest knobs
      rings: [
        {
          name: "inner",
          label: "Inner",
          positions: [
            [2, 2],
            [3, 2],
            [4, 2],
            [2, 3],
            [3, 3],
            [4, 3],
            [2, 4],
            [3, 4],
            [4, 4],
          ].map(([col, row]) => ({ col, row })),
          overloadAt: 3,
          immediateCollapseAt: 4,
          endgameCollapseAt: 3,
        },
        {
          name: "outer",
          label: "Outer",
          positions: [
            [1, 1],
            [2, 1],
            [3, 1],
            [4, 1],
            [5, 1],

            [1, 2],
            [5, 2],

            [1, 3],
            [5, 3],

            [1, 4],
            [5, 4],

            [1, 5],
            [2, 5],
            [3, 5],
            [4, 5],
            [5, 5],
          ].map(([col, row]) => ({ col, row })),
          overloadAt: 7,
          immediateCollapseAt: 8,
          endgameCollapseAt: 7,
        },
      ],
    });
    this.scoreTracker.setup(p5);

    this.stoneSelector = new StoneSelector({
      board: this.board,
      selectedColorName: "black",
      enabled: false,

      actionEnabledState: {
        shield: true,
        scar: false,
        spread: true,
        switch: false,
        assimilate: true,
      },

      onActionChange: (actionKey) => {
        console.log("Selected action:", actionKey);
      },
    });
    this.stoneSelector.setup(p5);

    this.historyButtonGroup = new HistoryButtonGroup({
      board: this.board,
      boardState: this.goBoardState,
      offsetY: 44,
      align: "left",
      onUndo: () => {
        this.stoneSelector.selectPreviousColor();
      },
      onRedo: () => {
        this.stoneSelector.selectNextColor();
      },
    });
    this.historyButtonGroup.setup(p5);

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
    this.drawCapturePreview(p5);
    this.drawGhostStone(p5);

    this.countdownTimer.draw(p5);
    this.scoreTracker.draw(p5);
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
   * @param {import("p5")} p5
   */
  drawCapturePreview(p5) {
    if (!this.hoverMoveResult) return;
    if (!this.hoverMoveResult.legal) return;

    for (const position of this.hoverMoveResult.capturedPositions) {
      this.drawStoneCaptureOutline(p5, position.col, position.row);
    }
  }

  /**
   * @param {import("p5")} p5
   * @param {number} col
   * @param {number} row
   */
  drawStoneCaptureOutline(p5, col, row) {
    const { x, y } = this.board.gridToWorld(p5, col, row);

    p5.push();
    {
      p5.noFill();
      p5.stroke("#0f0");
      p5.strokeWeight(4);
      p5.circle(x, y, STONE_SIZE + 8);
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   */
  drawGhostStone(p5) {
    if (!this.hoveredIntersection) return;
    if (!this.hoverMoveResult) return;

    const { col, row } = this.hoveredIntersection;
    const colorName = this.stoneSelector.getSelectedColorName();

    const strokeColor = this.hoverMoveResult.legal ? "#000000" : "#f00";
    const strokeWeight = this.hoverMoveResult.legal ? 1.5 : 4;

    this.drawStoneAtGridPosition(p5, col, row, colorName, 0.5, {
      strokeColor,
      strokeWeight,
    });
  }

  /**
   * @param {import("p5")} p5
   * @param {number} col
   * @param {number} row
   * @param {string} colorName
   * @param {number} alpha
   * @param {{
   *   strokeColor?: string,
   *   strokeWeight?: number,
   * }} options
   */
  drawStoneAtGridPosition(p5, col, row, colorName, alpha = 1, options = {}) {
    const { x, y } = this.board.gridToWorld(p5, col, row);
    const colorValue = STONE_COLORS[colorName] ?? "#000000";

    const strokeColorValue = options.strokeColor ?? "#000000";
    const strokeWeight = options.strokeWeight ?? 1.5;

    p5.push();
    {
      const stoneColor = p5.color(colorValue);
      stoneColor.setAlpha(255 * alpha);

      const strokeColor = p5.color(strokeColorValue);
      strokeColor.setAlpha(255 * alpha);

      p5.stroke(strokeColor);
      p5.strokeWeight(strokeWeight);
      p5.fill(stoneColor);
      p5.circle(x, y, STONE_SIZE);

      if (colorName === "white") {
        p5.noFill();
        p5.stroke(strokeColor);
        p5.strokeWeight(Math.max(strokeWeight, 2));
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

    this.hoverMoveResult = null;

    if (!this.hoveredIntersection) return;

    const { col, row } = this.hoveredIntersection;
    const colorName = this.stoneSelector.getSelectedColorName();

    this.hoverMoveResult = this.goBoardState.getLegalMovePreview(
      col,
      row,
      colorName,
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

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
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

    this.updateHoveredIntersection(p5);

    if (!this.hoveredIntersection) {
      return;
    }

    if (!this.hoverMoveResult || !this.hoverMoveResult.legal) {
      console.log("Illegal move:", this.hoverMoveResult?.reason);
      return;
    }

    const { col, row } = this.hoveredIntersection;
    const colorName = this.stoneSelector.getSelectedColorName();

    this.placeStone(col, row, colorName);
    this.updateHoveredIntersection(p5);
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {string} colorName
   * @returns {boolean}
   */
  placeStone(col, row, colorName) {
    const moveResult = this.goBoardState.placeLegalStone(col, row, colorName);

    if (!moveResult.legal) {
      console.log("Illegal move:", moveResult.reason);
      return false;
    }

    this.stoneSelector.selectNextColor();

    if (this.scoreTracker.hasImmediateCollapse()) {
      console.log("COLLAPSE: all players lose");
      console.log(this.scoreTracker.getImmediateCollapseEntries());
    }

    return true;
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
