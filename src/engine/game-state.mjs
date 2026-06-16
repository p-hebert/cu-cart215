import GoBoardState from "src/engine/go-board-state.mjs";

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {StoneColorName | null} BoardCell
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

    this.currentColorIndex = 0;

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

  getBoard() {
    return this.goBoardState.getBoard();
  }

  getCurrentColorName() {
    return this.turnOrder[this.currentColorIndex];
  }

  getActionCooldowns() {
    return this.actionCooldowns;
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
   * Place a normal stone for the current player.
   *
   * This is the main public method GameScene should call for normal moves.
   *
   * @param {number} col
   * @param {number} row
   * @returns {import("src/engine/go-rules-helper.mjs").MoveResult}
   */
  placeLegalStone(col, row) {
    const moveResult = this.getLegalMovePreview(col, row);

    if (!moveResult.legal) {
      return moveResult;
    }

    const colorName = this.getCurrentColorName();

    this.commitSnapshot();
    this.goBoardState.setBoard(moveResult.resultingBoard);

    // Normal turn completed: cooldown is spent.
    this.actionCooldowns[colorName] = false;

    this.advanceTurn();

    return moveResult;
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
  executeCurrentPlayerAction(actionKey, payload = null) {
    const colorName = this.getCurrentColorName();

    this.commitSnapshot();

    // TODO: actual action implementation.
    // Examples:
    // - shield selected stone
    // - scar target stone
    // - spread two stones
    // - switch positions
    // - assimilate target stone

    this.actionCooldowns[colorName] = true;
    this.advanceTurn();

    return {
      legal: true,
      reason: null,
    };
  }

  advanceTurn() {
    this.currentColorIndex =
      (this.currentColorIndex + 1) % this.turnOrder.length;
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
      actionCooldowns: { ...this.actionCooldowns },
    };
  }

  restoreSnapshot(snapshot) {
    this.goBoardState.setBoard(snapshot.board);
    this.currentColorIndex = snapshot.currentColorIndex;
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
}
