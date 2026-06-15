import GoRulesHelper from "src/engine/go-rules-helper.mjs";

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {StoneColorName | null} BoardCell
 */

/**
 * State-only board model with snapshot-based undo/redo.
 */
export default class GoBoardState {
  /**
   * @param {{
   *   boardSize?: number,
   * }} options
   */
  constructor(options = {}) {
    this.boardSize = options.boardSize ?? 7;

    /** @type {BoardCell[][]} */
    this.board = this.createEmptyBoard();

    this.rulesHelper = new GoRulesHelper({
      boardSize: this.boardSize,
    });

    /** @type {BoardCell[][][]} */
    this.undoStack = [];

    /** @type {BoardCell[][][]} */
    this.redoStack = [];
  }

  /**
   * @returns {BoardCell[][]}
   */
  createEmptyBoard() {
    return Array.from({ length: this.boardSize }, () => {
      return Array.from({ length: this.boardSize }, () => null);
    });
  }

  /**
   * @param {BoardCell[][]} board
   * @returns {BoardCell[][]}
   */
  cloneBoard(board = this.board) {
    return board.map((row) => [...row]);
  }

  /**
   * @returns {BoardCell[][]}
   */
  getBoard() {
    return this.board;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {BoardCell}
   */
  getCell(col, row) {
    if (!this.isOnBoard(col, row)) return null;
    return this.board[row][col];
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isEmpty(col, row) {
    return this.getCell(col, row) === null;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isOnBoard(col, row) {
    return col >= 0 && col < this.boardSize && row >= 0 && row < this.boardSize;
  }

  /**
   * Save the current board before a mutation.
   */
  commitHistorySnapshot() {
    this.undoStack.push(this.cloneBoard());
    this.redoStack = [];
  }

  /**
   * For simple ko, compare the resulting board against the board position
   * before the immediately previous move.
   *
   * Since undoStack stores snapshots from before each committed move,
   * the latest undoStack entry is exactly that previous board position.
   *
   * @returns {BoardCell[][] | null}
   */
  getPreviousBoardForKo() {
    if (this.undoStack.length === 0) return null;

    return this.undoStack[this.undoStack.length - 1];
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {StoneColorName} colorName
   * @returns {MoveResult}
   */
  getLegalMovePreview(col, row, colorName) {
    const previousBoard = this.getPreviousBoardForKo();

    return this.rulesHelper.getMoveResult(this.board, col, row, colorName, {
      previousBoard,
    });
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {StoneColorName} colorName
   * @returns {MoveResult}
   */
  placeLegalStone(col, row, colorName) {
    const moveResult = this.getLegalMovePreview(col, row, colorName);

    if (!moveResult.legal) {
      return moveResult;
    }

    this.commitHistorySnapshot();
    this.board = this.cloneBoard(moveResult.resultingBoard);

    return moveResult;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {StoneColorName} colorName
   * @param {{ overwrite?: boolean }} options
   * @returns {boolean}
   */
  placeStone(col, row, colorName, options = {}) {
    const overwrite = options.overwrite ?? false;

    if (!this.isOnBoard(col, row)) return false;

    const previousValue = this.board[row][col];

    if (!overwrite && previousValue !== null) return false;
    if (previousValue === colorName) return false;

    this.commitHistorySnapshot();
    this.board[row][col] = colorName;

    return true;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  removeStone(col, row) {
    if (!this.isOnBoard(col, row)) return false;
    if (this.board[row][col] === null) return false;

    this.commitHistorySnapshot();
    this.board[row][col] = null;

    return true;
  }

  /**
   * Useful later for captures, which remove several stones as one undoable action.
   *
   * @param {Array<[number, number]>} positions
   * @returns {boolean}
   */
  removeStones(positions) {
    const validOccupiedPositions = positions.filter(([col, row]) => {
      return this.isOnBoard(col, row) && this.board[row][col] !== null;
    });

    if (validOccupiedPositions.length === 0) return false;

    this.commitHistorySnapshot();

    for (const [col, row] of validOccupiedPositions) {
      this.board[row][col] = null;
    }

    return true;
  }

  /**
   * Useful later when a legal move may place one stone and remove captured stones.
   *
   * @param {(board: BoardCell[][]) => void} mutator
   * @returns {boolean}
   */
  applyMutation(mutator) {
    const before = this.cloneBoard();

    this.commitHistorySnapshot();
    mutator(this.board);

    if (this.boardsEqual(before, this.board)) {
      this.undoStack.pop();
      return false;
    }

    return true;
  }

  /**
   * @param {BoardCell[][]} a
   * @param {BoardCell[][]} b
   * @returns {boolean}
   */
  boardsEqual(a, b) {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (a[row][col] !== b[row][col]) return false;
      }
    }

    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return false;

    this.redoStack.push(this.cloneBoard());
    this.board = this.undoStack.pop();

    return true;
  }

  redo() {
    if (!this.canRedo()) return false;

    this.undoStack.push(this.cloneBoard());
    this.board = this.redoStack.pop();

    return true;
  }

  clear() {
    this.commitHistorySnapshot();
    this.board = this.createEmptyBoard();
  }
}
