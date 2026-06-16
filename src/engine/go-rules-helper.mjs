import StoneData from "src/engine/stone-data.mjs";

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {import("src/engine/stone-data.mjs").default | null} BoardCell
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
    resultingBoard[row][col] = new StoneData({
      colorName,
    });

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

  getCellColorName(board, col, row) {
    return board[row][col]?.colorName ?? null;
  }

  isCellEmpty(board, col, row) {
    return board[row][col] === null;
  }

  isCellCapturable(board, col, row) {
    return board[row][col]?.capturable ?? true;
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
      const neighborColor = this.getCellColorName(
        board,
        neighbor.col,
        neighbor.row,
      );

      if (neighborColor === null) continue;
      if (neighborColor === placedColorName) continue;

      const neighborKey = this.positionKey(neighbor.col, neighbor.row);
      if (checkedGroupStones.has(neighborKey)) continue;

      const enemyGroup = this.getGroup(board, neighbor.col, neighbor.row);

      for (const position of enemyGroup) {
        checkedGroupStones.add(this.positionKey(position.col, position.row));
      }

      const liberties = this.getGroupLiberties(board, enemyGroup);

      if (liberties.length > 0) continue;

      const capturablePositions = this.getCapturablePositionsInGroup(
        board,
        enemyGroup,
      );

      capturedPositions.push(...capturablePositions);
    }

    return capturedPositions;
  }

  /**
   * Removes all no-liberty stones of a given color from the board.
   *
   * This mutates the provided board.
   *
   * Important:
   * - Shielded / non-capturable stones are not removed.
   * - If a dead group contains both capturable and non-capturable stones,
   *   only capturable stones are removed.
   *
   * @param {BoardCell[][]} board
   * @param {StoneColorName} colorName
   * @returns {GridPosition[]} positions actually removed
   */
  removeDeadGroupsForColor(board, colorName) {
    const removedPositions = [];
    const checked = new Set();

    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const cellColorName = this.getCellColorName(board, col, row);

        if (cellColorName !== colorName) continue;

        const key = this.positionKey(col, row);
        if (checked.has(key)) continue;

        const group = this.getGroup(board, col, row);

        for (const position of group) {
          checked.add(this.positionKey(position.col, position.row));
        }

        const liberties = this.getGroupLiberties(board, group);

        if (liberties.length > 0) continue;

        const capturablePositions = this.getCapturablePositionsInGroup(
          board,
          group,
        );

        for (const position of capturablePositions) {
          board[position.row][position.col] = null;
          removedPositions.push(position);
        }
      }
    }

    return removedPositions;
  }

  /**
   * Non-mutating version of removeDeadGroupsForColor.
   *
   * @param {BoardCell[][]} board
   * @param {StoneColorName} colorName
   * @returns {{
   *   resultingBoard: BoardCell[][],
   *   removedPositions: GridPosition[],
   * }}
   */
  getBoardAfterRemovingDeadGroupsForColor(board, colorName) {
    const resultingBoard = this.cloneBoard(board);

    const removedPositions = this.removeDeadGroupsForColor(
      resultingBoard,
      colorName,
    );

    return {
      resultingBoard,
      removedPositions,
    };
  }

  /**
   * @param {BoardCell[][]} board
   * @param {number} startCol
   * @param {number} startRow
   * @returns {GridPosition[]}
   */
  getGroup(board, startCol, startRow) {
    const colorName = this.getCellColorName(board, startCol, startRow);

    if (colorName === null) return [];

    const group = [];
    const stack = [{ col: startCol, row: startRow }];
    const visited = new Set();

    while (stack.length > 0) {
      const current = stack.pop();
      const key = this.positionKey(current.col, current.row);

      if (visited.has(key)) continue;
      visited.add(key);

      if (
        this.getCellColorName(board, current.col, current.row) !== colorName
      ) {
        continue;
      }

      group.push(current);

      for (const neighbor of this.getNeighbors(current.col, current.row)) {
        if (
          this.getCellColorName(board, neighbor.col, neighbor.row) === colorName
        ) {
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
        if (!this.isCellEmpty(board, neighbor.col, neighbor.row)) continue;

        const key = this.positionKey(neighbor.col, neighbor.row);

        if (libertyKeys.has(key)) continue;

        libertyKeys.add(key);
        liberties.push(neighbor);
      }
    }

    return liberties;
  }

  getCapturablePositionsInGroup(board, group) {
    return group.filter((position) => {
      return this.isCellCapturable(board, position.col, position.row);
    });
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
