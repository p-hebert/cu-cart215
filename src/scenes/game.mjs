import Board from "src/components/board.mjs";
import CountdownTimer from "src/components/countdown-timer.mjs";
import HistoryButtonGroup from "src/components/history-button-group.mjs";
import NotificationToast from "src/components/notification-toast.mjs";
import ScoreTracker from "src/components/score-tracker.mjs";
import StoneSelector from "src/components/stone-selector.mjs";
import ActionAvailabilityHelper from "src/engine/action-availability-helper.mjs";
import {
  ACTIONS,
  ACTION_LIST,
  ACTION_SCORE_DELTAS,
} from "src/engine/actions.mjs";
import GameState from "src/engine/game-state.mjs";
import { isPointValueAt } from "src/engine/points.mjs";
import ScoreCalculator from "src/engine/score-calculator.mjs";
import { BaseScene } from "src/p5/scene.mjs";

const STONE_COLORS = {
  black: "#000000",
  white: "#ffffff",
  "blood-red": "#f00",
  "midnight-blue": "#00f",
  scar: "#808080",
};

const STONE_SIZE = 36;

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

    this.gameState = null;
    this.pendingActionTargets = [];
    // { col, row } | null
    this.hoveredIntersection = null;
    this.hoverMoveResult = null;

    this.scoreCalculator = null;
    this.actionAvailabilityHelper = null;
    this.scoreTracker = null;
    this.stoneSelector = null;
    this.countdownTimer = null;

    this.actionCooldowns = {
      black: false,
      white: false,
      "blood-red": false,
      "midnight-blue": false,
    };

    this.historyButtonGroup = null;
    this.notificationToast = null;

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

    this.gameState = new GameState({
      boardSize: this.board.boardSize,
    });

    this.scoreCalculator = new ScoreCalculator();

    this.actionAvailabilityHelper = new ActionAvailabilityHelper();

    this.scoreTracker = new ScoreTracker({
      board: this.board,
      gameState: this.gameState,
      scoreCalculator: this.scoreCalculator,
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
      selectedColorName: this.gameState.getCurrentColorName(),
      enabled: false,

      actions: ACTION_LIST,
      offsetY: 44,
      onActionChange: () => {
        this.clearPendingActionTargets();
      },
    });
    this.stoneSelector.setup(p5);

    this.historyButtonGroup = new HistoryButtonGroup({
      board: this.board,
      gameState: this.gameState,
      offsetY: 44,
      align: "left",
      onUndo: () => {
        this.syncSelectorFromGameState();
      },
      onRedo: () => {
        this.syncSelectorFromGameState();
      },
    });
    this.historyButtonGroup.setup(p5);

    this.countdownTimer = new CountdownTimer({
      board: this.board,
      durationSeconds: 15 * 60,
      offsetY: 44,
      fontSize: 32,
    });
    this.countdownTimer.setup(p5);

    this.notificationToast = new NotificationToast({
      durationMillis: 2400,
      offsetY: 18,
    });
    this.notificationToast.setup(p5);

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
    this.drawPendingActionTargets(p5);
    this.drawGhostStone(p5);

    this.countdownTimer.draw(p5);

    this.scoreTracker.draw(p5);

    this.stoneSelector.setSelectedColorName(
      this.gameState.getCurrentColorName(),
    );
    this.updateActionAvailability();
    this.stoneSelector.draw(p5);

    this.historyButtonGroup.draw(p5);
    this.notificationToast.draw(p5);
  }

  /**
   * @param {import('p5')} p5
   */
  drawStones(p5) {
    const boardState = this.gameState.getBoard();

    for (let row = 0; row < boardState.length; row++) {
      for (let col = 0; col < boardState[row].length; col++) {
        const stone = boardState[row][col];

        if (stone === null) continue;

        this.drawStoneAtGridPosition(p5, col, row, stone.colorName, 1);

        if (!stone.capturable) {
          this.drawShieldOutline(p5, col, row);
        }
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

  drawShieldOutline(p5, col, row) {
    const { x, y } = this.board.gridToWorld(p5, col, row);

    p5.push();
    {
      p5.noFill();
      p5.stroke("#00aaff");
      p5.strokeWeight(4);
      p5.circle(x, y, STONE_SIZE + 10);
    }
    p5.pop();
  }

  drawPendingActionTargets(p5) {
    const selectedActionKey = this.stoneSelector.getSelectedActionKey();

    for (const position of this.pendingActionTargets) {
      let colorName = this.gameState.getCurrentColorName();
      let strokeColor = "#00aaff";

      const stone = this.gameState.getStoneAt(position.col, position.row);

      if (selectedActionKey === ACTIONS.SWITCH && stone !== null) {
        colorName = stone.colorName;
        strokeColor = "#0f0";
      }

      this.drawStoneAtGridPosition(
        p5,
        position.col,
        position.row,
        colorName,
        0.5,
        {
          strokeColor,
          strokeWeight: 4,
        },
      );
    }
  }

  getCurrentScoreDeltaFromTop() {
    const scores = this.scoreCalculator.calculateScores(
      this.gameState.getBoard(),
    );
    const currentColorName = this.gameState.getCurrentColorName();

    const currentScore = scores[currentColorName] ?? 0;
    const topScore = Math.max(...Object.values(scores));

    return Math.max(0, topScore - currentScore);
  }

  getActionRequirementText() {
    const currentDelta = this.getCurrentScoreDeltaFromTop();
    const requirementText = {};

    for (const [actionKey, neededDelta] of Object.entries(
      ACTION_SCORE_DELTAS,
    )) {
      const action = this.stoneSelector.actions.find((entry) => {
        return entry.key === actionKey;
      });

      const actionName = action?.name ?? actionKey;

      requirementText[actionKey] = `Gap: ${currentDelta}/${neededDelta}`;
    }

    return requirementText;
  }

  updateActionAvailability() {
    const currentColorName = this.gameState.getCurrentColorName();

    const scores = this.scoreCalculator.calculateScores(
      this.gameState.getBoard(),
    );

    const enabledState =
      this.actionAvailabilityHelper.getEnabledActionsForPlayer({
        currentColorName,
        scores,
        cooldowns: this.gameState.getActionCooldowns(),
        gameState: this.gameState,
      });

    this.stoneSelector.setActionEnabledState(enabledState);
    this.stoneSelector.setActionRequirementText(
      this.getActionRequirementText(),
    );
  }

  clearPendingActionTargets() {
    this.pendingActionTargets = [];
  }

  markCurrentPlayerActionUsed() {
    const currentColorName = this.stoneSelector.getSelectedColorName();

    this.actionCooldowns[currentColorName] = true;
    this.stoneSelector.setSelectedActionKey(null);

    this.updateActionAvailability();
  }

  syncSelectorFromGameState() {
    const currentColorName = this.gameState.getCurrentColorName();

    this.stoneSelector.setSelectedColorName(currentColorName);
    this.stoneSelector.setSelectedActionKey(null);

    this.stoneSelector.setIsOnActionCooldown(
      this.gameState.getActionCooldowns()[currentColorName] === true,
    );

    this.updateActionAvailability();
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

    this.hoverMoveResult = this.gameState.getLegalMovePreview(
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

    const { col, row } = this.hoveredIntersection;
    const selectedActionKey = this.stoneSelector.getSelectedActionKey();

    if (selectedActionKey) {
      this.executeSelectedActionAt(col, row);
    } else {
      if (!this.hoverMoveResult || !this.hoverMoveResult.legal) {
        this.notificationToast.show(
          `Illegal move: ${this.hoverMoveResult?.reason}`,
        );
        return;
      }

      this.placeStone(col, row);
      this.updateHoveredIntersection(p5);
    }
  }

  handleSpreadTargetClick(col, row) {
    if (!isPointValueAt(col, row, [1, 3])) {
      this.notificationToast.show(
        "Illegal action: Spread targets must be 1-point or 3-point intersections",
      );
      return false;
    }

    const alreadySelected = this.pendingActionTargets.some((position) => {
      return position.col === col && position.row === row;
    });

    if (alreadySelected) {
      this.notificationToast.show("Illegal action: duplicate Spread target");
      return false;
    }

    this.pendingActionTargets.push({ col, row });

    if (this.pendingActionTargets.length < 2) {
      this.notificationToast.show("Spread: select one more intersection");
      return false;
    }

    const result = this.gameState.executeCurrentPlayerAction(ACTIONS.SPREAD, {
      positions: this.pendingActionTargets,
    });

    if (!result.legal) {
      this.notificationToast.show(`Illegal action: ${result.reason}`);
      this.clearPendingActionTargets();
      return false;
    }

    this.stoneSelector.setSelectedActionKey(null);
    this.clearPendingActionTargets();
    this.syncSelectorFromGameState();

    return true;
  }

  handleSwitchTargetClick(col, row) {
    const currentColorName = this.gameState.getCurrentColorName();
    const stone = this.gameState.getStoneAt(col, row);

    if (this.pendingActionTargets.length === 0) {
      if (stone === null || stone.colorName !== currentColorName) {
        this.notificationToast.show(
          "Illegal action: first Switch target must be one of your stones",
        );
        return false;
      }

      this.pendingActionTargets.push({ col, row });
      this.notificationToast.show(
        "Switch: select a higher-scoring player's non-center stone",
      );
      return false;
    }

    const alreadySelected = this.pendingActionTargets.some((position) => {
      return position.col === col && position.row === row;
    });

    if (alreadySelected) {
      this.notificationToast.show("Illegal action: duplicate Switch target");
      return false;
    }

    if (stone === null) {
      this.notificationToast.show(
        "Illegal action: second Switch target must be an enemy stone",
      );
      return false;
    }

    if (stone.colorName === "scar") {
      this.notificationToast.show("Illegal action: cannot switch with a Scar");
      return false;
    }

    if (stone.colorName === currentColorName) {
      this.notificationToast.show(
        "Illegal action: second Switch target must be an enemy stone",
      );
      return false;
    }

    if (this.gameState.isCenterIntersection(col, row)) {
      this.notificationToast.show(
        "Illegal action: cannot switch with center stone",
      );
      return false;
    }

    if (
      !this.gameState.isHigherScoringPlayer(stone.colorName, currentColorName)
    ) {
      this.notificationToast.show(
        "Illegal action: target player must be higher-scoring",
      );
      return false;
    }

    this.pendingActionTargets.push({ col, row });

    const result = this.gameState.executeCurrentPlayerAction(ACTIONS.SWITCH, {
      positions: this.pendingActionTargets,
    });

    if (!result.legal) {
      this.notificationToast.show(`Illegal action: ${result.reason}`);
      this.clearPendingActionTargets();
      return false;
    }

    this.stoneSelector.setSelectedActionKey(null);
    this.clearPendingActionTargets();
    this.syncSelectorFromGameState();

    return true;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {string} colorName
   * @returns {boolean}
   */
  placeStone(col, row, colorName) {
    const moveResult = this.gameState.placeLegalStone(col, row, colorName);

    if (!moveResult.legal) {
      this.notificationToast.show(`Illegal move: ${moveResult?.reason}`);
      return false;
    }

    this.stoneSelector.setSelectedActionKey(null);
    this.syncSelectorFromGameState();

    if (this.scoreTracker.hasImmediateCollapse()) {
      console.log("COLLAPSE: all players lose");
      console.log(this.scoreTracker.getImmediateCollapseEntries());
      this.notificationToast.show("COLLAPSE: all players lose");
    }

    return true;
  }

  executeSelectedActionAt(col, row) {
    const actionKey = this.stoneSelector.getSelectedActionKey();

    if (!actionKey) return false;

    if (actionKey === ACTIONS.SPREAD) {
      return this.handleSpreadTargetClick(col, row);
    }

    if (actionKey === ACTIONS.SWITCH) {
      return this.handleSwitchTargetClick(col, row);
    }

    const result = this.gameState.executeCurrentPlayerAction(actionKey, {
      col,
      row,
    });

    if (!result.legal) {
      this.notificationToast.show(`Illegal action: ${result.reason}`);
      return false;
    }

    this.stoneSelector.setSelectedActionKey(null);
    this.clearPendingActionTargets();
    this.syncSelectorFromGameState();

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
