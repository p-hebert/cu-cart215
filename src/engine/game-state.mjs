import {
  ACTIONS,
  ScarAction,
  ShieldAction,
  SpreadAction,
} from "src/engine/actions.mjs";
import GoBoardState from "src/engine/go-board-state.mjs";
import ScoreCalculator from "src/engine/score-calculator.mjs";

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {import("src/engine/stone-data.mjs").default | null} BoardCell
 */

/**
 * @typedef {{
 *   board: BoardCell[][],
 *   currentColorIndex: number,
 *   actionCooldowns: Record<StoneColorName, boolean>,
 * }} GameStateSnapshot
 */

export const DEFAULT_TURN_ORDER = [
  "black",
  "white",
  "blood-red",
  "midnight-blue",
];

export default class GameState {
  /**
   * @param {{
   *   boardSize?: number,
   *   turnOrder?: StoneColorName[],
   * }} options
   */
  constructor(options = {}) {
    this.turnOrder = options.turnOrder ?? DEFAULT_TURN_ORDER;

    this.goBoardState = new GoBoardState({
      boardSize: options.boardSize ?? 7,
    });

    this.scoreCalculator = options.scoreCalculator ?? new ScoreCalculator();

    this.currentColorIndex = 0;
    this.turnNumber = 0;

    this.actions = {
      [ACTIONS.SHIELD]: new ShieldAction(),
      [ACTIONS.SCAR]: new ScarAction(),
      [ACTIONS.SPREAD]: new SpreadAction(),
    };
    this.actionCooldowns = this.createEmptyCooldowns();

    this.undoStack = [];
    this.redoStack = [];
  }

  createEmptyCooldowns() {
    return this.turnOrder.reduce((cooldowns, colorName) => {
      cooldowns[colorName] = false;
      return cooldowns;
    }, {});
  }

  getTurnNumber() {
    return this.turnNumber;
  }

  getTurnOrderLength() {
    return this.turnOrder.length;
  }

  getScores() {
    return this.scoreCalculator.calculateScores(this.getBoard());
  }

  getBoard() {
    return this.goBoardState.getBoard();
  }

  getCurrentColorName() {
    return this.turnOrder[this.currentColorIndex];
  }

  getActionCooldowns() {
    return this.actionCooldowns;
  }

  isHigherScoringPlayer(targetColorName, currentColorName) {
    const scores = this.getScores();

    return (scores[targetColorName] ?? 0) > (scores[currentColorName] ?? 0);
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Preview a normal stone placement for the current player.
   *
   * @param {number} col
   * @param {number} row
   * @returns {import("src/engine/go-rules-helper.mjs").MoveResult}
   */
  getLegalMovePreview(col, row) {
    const colorName = this.getCurrentColorName();

    return this.goBoardState.getLegalMovePreview(col, row, colorName);
  }

  /**
   * @param {Array<{ col: number, row: number }>} positions
   * @param {StoneColorName} colorName
   * @returns {MoveResult}
   */
  getMultiStoneMovePreview(positions, colorName = this.getCurrentColorName()) {
    return this.goBoardState.getMultiStoneMovePreview(positions, colorName);
  }

  /**
   * Place a normal stone for the current player.
   *
   * This is the main public method GameScene should call for normal moves.
   *
   * @param {number} col
   * @param {number} row
   * @returns {import("src/engine/go-rules-helper.mjs").MoveResult}
   */
  placeLegalStone(col, row) {
    const colorName = this.getCurrentColorName();
    const moveResult = this.getLegalMovePreview(col, row);

    if (!moveResult.legal) {
      return moveResult;
    }

    this.commitSnapshot();

    this.goBoardState.setBoard(moveResult.resultingBoard);

    // Cooldown is spent when the player completes their next normal turn.
    this.actionCooldowns[colorName] = false;

    // Shield expires at the end of that player's next turn.
    this.clearShieldsForColor(colorName);

    // If a shielded stone was surviving with no liberties, it can now die.
    const removedPositions =
      this.goBoardState.removeDeadGroupsForColor(colorName);

    this.advanceTurn();

    return {
      ...moveResult,
      expiredShieldRemovedPositions: removedPositions,
    };
  }

  /**
   * Normal stone placement.
   *
   * If the player was on cooldown because they used an action last turn,
   * the cooldown is cleared after they complete this normal turn.
   *
   * @param {number} col
   * @param {number} row
   * @returns {import("src/engine/go-rules-helper.mjs").MoveResult}
   */
  placeCurrentPlayerStone(col, row) {
    const colorName = this.getCurrentColorName();

    const moveResult = this.goBoardState.getLegalMovePreview(
      col,
      row,
      colorName,
    );

    if (!moveResult.legal) {
      return moveResult;
    }

    this.commitSnapshot();

    this.goBoardState.setBoard(moveResult.resultingBoard);

    // Shield expires at the end of that player's next turn.
    this.clearShieldsForColor(colorName);

    // Cooldown is spent only when that player's normal turn completes.
    this.actionCooldowns[colorName] = false;

    this.advanceTurn();

    return moveResult;
  }

  /**
   * Placeholder for later ability implementation.
   *
   * The action itself should call commitSnapshot(), mutate board/effects,
   * mark the current player as on cooldown, and usually advance the turn.
   *
   * @param {string} actionKey
   * @param {unknown} payload
   * @returns {{ legal: boolean, reason: string | null }}
   */
  executeCurrentPlayerAction(actionKey, payload = {}) {
    const action = this.actions[actionKey];

    if (!action) {
      return {
        legal: false,
        reason: "unknown-action",
      };
    }

    return action.execute({
      gameState: this,
      ...payload,
    });
  }

  markCurrentPlayerActionUsedAndAdvanceTurn() {
    const colorName = this.getCurrentColorName();

    this.actionCooldowns[colorName] = true;
    this.advanceTurn();
  }

  /**
   * Clears shields owned by a given player.
   *
   * @param {StoneColorName} colorName
   * @returns {number} number of shields cleared
   */
  clearShieldsForColor(colorName) {
    const board = this.getBoard();
    let clearedCount = 0;

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const stone = board[row][col];

        if (stone === null) continue;
        if (stone.shieldedByColorName !== colorName) continue;

        stone.capturable = true;
        stone.shieldedByColorName = null;
        clearedCount++;
      }
    }

    return clearedCount;
  }

  advanceTurn() {
    this.currentColorIndex =
      (this.currentColorIndex + 1) % this.turnOrder.length;

    this.turnNumber++;

    this.handleStartOfTurnEffects();
  }

  handleStartOfTurnEffects() {
    const currentColorName = this.getCurrentColorName();

    this.removeExpiredScarsForColor(currentColorName);
  }

  /**
   * For forced manual correction/debug if needed.
   */
  retreatTurn() {
    this.currentColorIndex =
      (this.currentColorIndex - 1 + this.turnOrder.length) %
      this.turnOrder.length;
  }

  commitSnapshot() {
    this.undoStack.push(this.createSnapshot());
    this.redoStack = [];
  }

  createSnapshot() {
    return {
      board: this.goBoardState.cloneBoard(this.goBoardState.getBoard()),
      currentColorIndex: this.currentColorIndex,
      turnNumber: this.turnNumber,
      actionCooldowns: { ...this.actionCooldowns },
    };
  }

  restoreSnapshot(snapshot) {
    this.goBoardState.setBoard(snapshot.board);
    this.currentColorIndex = snapshot.currentColorIndex;
    this.turnNumber = snapshot.turnNumber;
    this.actionCooldowns = { ...snapshot.actionCooldowns };
  }

  undo() {
    if (!this.canUndo()) return false;

    this.redoStack.push(this.createSnapshot());

    const previousSnapshot = this.undoStack.pop();
    this.restoreSnapshot(previousSnapshot);

    return true;
  }

  redo() {
    if (!this.canRedo()) return false;

    this.undoStack.push(this.createSnapshot());

    const nextSnapshot = this.redoStack.pop();
    this.restoreSnapshot(nextSnapshot);

    return true;
  }

  removeExpiredScarsForColor(colorName) {
    const board = this.getBoard();
    let removedCount = 0;

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const stone = board[row][col];

        if (stone === null) continue;
        if (stone.colorName !== "scar") continue;
        if (stone.scarCreatedByColorName !== colorName) continue;
        if (stone.expiresOnTurnNumber === null) continue;
        if (this.turnNumber < stone.expiresOnTurnNumber) continue;

        board[row][col] = null;
        removedCount++;
      }
    }

    return removedCount;
  }
}
