/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {StoneColorName | null} BoardCell
 */

/**
 * @typedef {{ col: number, row: number }} GridPosition
 */

/**
 * @typedef {{
 *   legal: boolean,
 *   reason: null | "occupied" | "suicide" | "ko" | "out-of-bounds",
 *   resultingBoard: BoardCell[][],
 *   capturedPositions: GridPosition[],
 * }} MoveResult
 */

export default class GoRulesHelper {
  /**
   * @param {{ boardSize?: number }} options
   */
  constructor(options = {}) {
    this.boardSize = options.boardSize ?? 7;
  }

  /**
   * @param {BoardCell[][]} board
   * @param {number} col
   * @param {number} row
   * @param {StoneColorName} colorName
   * @param {{ previousBoard?: BoardCell[][] | null }} options
   * @returns {MoveResult}
   */
  getMoveResult(board, col, row, colorName, options = {}) {
    const previousBoard = options.previousBoard ?? null;

    if (!this.isOnBoard(col, row)) {
      return {
        legal: false,
        reason: "out-of-bounds",
        resultingBoard: this.cloneBoard(board),
        capturedPositions: [],
      };
    }

    if (board[row][col] !== null) {
      return {
        legal: false,
        reason: "occupied",
        resultingBoard: this.cloneBoard(board),
        capturedPositions: [],
      };
    }

    const resultingBoard = this.cloneBoard(board);

    // 1. Place stone first.
    resultingBoard[row][col] = colorName;

    // 2. Determine all enemy groups that would be captured.
    // Important: this is simultaneous. We collect all captured positions first,
    // then remove them afterward.
    const capturedPositions = this.getAdjacentEnemyGroupsToCapture(
      resultingBoard,
      col,
      row,
      colorName,
    );

    // 3. Remove all captured stones simultaneously.
    for (const position of capturedPositions) {
      resultingBoard[position.row][position.col] = null;
    }

    // 4. Now check own liberties after captures.
    const ownGroup = this.getGroup(resultingBoard, col, row);
    const ownLiberties = this.getGroupLiberties(resultingBoard, ownGroup);

    if (ownLiberties.length === 0) {
      return {
        legal: false,
        reason: "suicide",
        resultingBoard,
        capturedPositions,
      };
    }

    // 5. Simple ko check.
    if (
      previousBoard !== null &&
      this.boardsEqual(resultingBoard, previousBoard)
    ) {
      return {
        legal: false,
        reason: "ko",
        resultingBoard,
        capturedPositions,
      };
    }

    return {
      legal: true,
      reason: null,
      resultingBoard,
      capturedPositions,
    };
  }

  /**
   * @param {BoardCell[][]} board
   * @param {number} col
   * @param {number} row
   * @param {StoneColorName} colorName
   * @param {{ previousBoard?: BoardCell[][] | null }} options
   * @returns {boolean}
   */
  isMoveLegal(board, col, row, colorName, options = {}) {
    return this.getMoveResult(board, col, row, colorName, options).legal;
  }

  /**
   * Returns all adjacent enemy stones that should be captured.
   *
   * This does NOT mutate the board.
   *
   * Important for 4-player Go:
   * Multiple adjacent enemy groups of different colors are evaluated against
   * the same placed-stone board state, before any group is removed.
   *
   * @param {BoardCell[][]} board
   * @param {number} placedCol
   * @param {number} placedRow
   * @param {StoneColorName} placedColorName
   * @returns {GridPosition[]}
   */
  getAdjacentEnemyGroupsToCapture(
    board,
    placedCol,
    placedRow,
    placedColorName,
  ) {
    const capturedPositions = [];
    const checkedGroupStones = new Set();

    for (const neighbor of this.getNeighbors(placedCol, placedRow)) {
      const neighborColor = board[neighbor.row][neighbor.col];

      if (neighborColor === null) continue;
      if (neighborColor === placedColorName) continue;

      const neighborKey = this.positionKey(neighbor.col, neighbor.row);
      if (checkedGroupStones.has(neighborKey)) continue;

      const enemyGroup = this.getGroup(board, neighbor.col, neighbor.row);

      for (const position of enemyGroup) {
        checkedGroupStones.add(this.positionKey(position.col, position.row));
      }

      const liberties = this.getGroupLiberties(board, enemyGroup);

      if (liberties.length === 0) {
        capturedPositions.push(...enemyGroup);
      }
    }

    return capturedPositions;
  }

  /**
   * @param {BoardCell[][]} board
   * @param {number} startCol
   * @param {number} startRow
   * @returns {GridPosition[]}
   */
  getGroup(board, startCol, startRow) {
    const colorName = board[startRow][startCol];

    if (colorName === null) return [];

    const group = [];
    const stack = [{ col: startCol, row: startRow }];
    const visited = new Set();

    while (stack.length > 0) {
      const current = stack.pop();
      const key = this.positionKey(current.col, current.row);

      if (visited.has(key)) continue;
      visited.add(key);

      if (board[current.row][current.col] !== colorName) continue;

      group.push(current);

      for (const neighbor of this.getNeighbors(current.col, current.row)) {
        if (board[neighbor.row][neighbor.col] === colorName) {
          stack.push(neighbor);
        }
      }
    }

    return group;
  }

  /**
   * @param {BoardCell[][]} board
   * @param {GridPosition[]} group
   * @returns {GridPosition[]}
   */
  getGroupLiberties(board, group) {
    const liberties = [];
    const libertyKeys = new Set();

    for (const stone of group) {
      for (const neighbor of this.getNeighbors(stone.col, stone.row)) {
        if (board[neighbor.row][neighbor.col] !== null) continue;

        const key = this.positionKey(neighbor.col, neighbor.row);

        if (libertyKeys.has(key)) continue;

        libertyKeys.add(key);
        liberties.push(neighbor);
      }
    }

    return liberties;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {GridPosition[]}
   */
  getNeighbors(col, row) {
    return [
      { col, row: row - 1 },
      { col: col + 1, row },
      { col, row: row + 1 },
      { col: col - 1, row },
    ].filter((position) => this.isOnBoard(position.col, position.row));
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
   * @param {BoardCell[][]} board
   * @returns {BoardCell[][]}
   */
  cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  /**
   * @param {BoardCell[][]} a
   * @param {BoardCell[][]} b
   * @returns {boolean}
   */
  boardsEqual(a, b) {
    if (a.length !== b.length) return false;

    for (let row = 0; row < a.length; row++) {
      if (a[row].length !== b[row].length) return false;

      for (let col = 0; col < a[row].length; col++) {
        if (a[row][col] !== b[row][col]) return false;
      }
    }

    return true;
  }

  /**
   * @param {number} col
   * @param {number} row
   * @returns {string}
   */
  positionKey(col, row) {
    return `${col},${row}`;
  }
}
