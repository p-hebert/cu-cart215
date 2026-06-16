import { isPointValueAt } from "src/engine/points.mjs";
import StoneData from "src/engine/stone-data.mjs";

/**
 * @typedef {"shield" | "scar" | "spread" | "switch" | "assimilate"} ActionKey
 */

export const ACTIONS = Object.freeze({
  SHIELD: "shield",
  SCAR: "scar",
  SPREAD: "spread",
  SWITCH: "switch",
  ASSIMILATE: "assimilate",
});

export const ACTION_LIST = [
  {
    key: ACTIONS.SHIELD,
    label: "🛡️",
    name: "Shield",
    description: "Protect one of your stones until the end of your next turn",
  },
  {
    key: ACTIONS.SCAR,
    label: "⚡",
    name: "Scar",
    description:
      "Replace a higher-scoring player’s stone with a temporary hostile blocker",
  },
  {
    key: ACTIONS.SPREAD,
    label: "🦠",
    name: "Spread",
    description: "Place two stones on 1-point or 3-point intersections",
  },
  {
    key: ACTIONS.SWITCH,
    label: "🔀",
    name: "Switch",
    description:
      "Swap one of your stones with a higher-scoring player’s non-center stone",
  },
  {
    key: ACTIONS.ASSIMILATE,
    label: "🏴‍☠️",
    name: "Assimilate",
    description:
      "Convert a higher-scoring player’s stone adjacent to two of yours",
  },
];

export const ACTION_SCORE_DELTAS = Object.freeze({
  [ACTIONS.SHIELD]: 6,
  [ACTIONS.SCAR]: 10,
  [ACTIONS.SPREAD]: 13,
  [ACTIONS.SWITCH]: 16,
  [ACTIONS.ASSIMILATE]: 18,
});

export function createDisabledActionState() {
  return ACTION_LIST.reduce((state, action) => {
    state[action.key] = false;
    return state;
  }, {});
}

export class ShieldAction {
  constructor() {
    this.key = ACTIONS.SHIELD;
  }

  /**
   * @param {{
   *   gameState: import("src/engine/game-state.mjs").default,
   *   col: number,
   *   row: number,
   * }} params
   * @returns {{ legal: boolean, reason: string | null }}
   */
  execute({ gameState, col, row }) {
    const currentColorName = gameState.getCurrentColorName();
    const stone = gameState.getBoard()?.[row]?.[col] ?? null;

    if (stone === null) {
      return {
        legal: false,
        reason: "empty-target",
      };
    }

    if (stone.colorName !== currentColorName) {
      return {
        legal: false,
        reason: "not-your-stone",
      };
    }

    if (!stone.capturable) {
      return {
        legal: false,
        reason: "already-shielded",
      };
    }

    gameState.commitSnapshot();

    stone.capturable = false;
    stone.shieldedByColorName = currentColorName;

    gameState.markCurrentPlayerActionUsedAndAdvanceTurn();

    return {
      legal: true,
      reason: null,
    };
  }
}

export class ScarAction {
  constructor() {
    this.key = ACTIONS.SCAR;
  }

  /**
   * @param {{
   *   gameState: import("src/engine/game-state.mjs").default,
   *   col: number,
   *   row: number,
   * }} params
   * @returns {{ legal: boolean, reason: string | null }}
   */
  execute({ gameState, col, row }) {
    const currentColorName = gameState.getCurrentColorName();
    const board = gameState.getBoard();
    const targetStone = board?.[row]?.[col] ?? null;

    if (targetStone === null) {
      return {
        legal: false,
        reason: "empty-target",
      };
    }

    if (targetStone.colorName === "scar") {
      return {
        legal: false,
        reason: "target-already-scar",
      };
    }

    if (targetStone.colorName === currentColorName) {
      return {
        legal: false,
        reason: "cannot-scar-own-stone",
      };
    }

    if (
      !gameState.isHigherScoringPlayer(targetStone.colorName, currentColorName)
    ) {
      return {
        legal: false,
        reason: "target-player-not-higher-scoring",
      };
    }

    gameState.commitSnapshot();

    board[row][col] = new StoneData({
      colorName: "scar",
      capturable: false,
      originalColorName: targetStone.colorName,
      scarCreatedByColorName: currentColorName,

      // Start of user's second future turn.
      expiresOnTurnNumber:
        gameState.getTurnNumber() + gameState.getTurnOrderLength() * 2,
    });

    const capturedPositions =
      gameState.goBoardState.resolveCapturesAroundPositions([{ col, row }]);

    gameState.markCurrentPlayerActionUsedAndAdvanceTurn();

    return {
      legal: true,
      reason: null,
      capturedPositions,
    };
  }
}

export class SpreadAction {
  constructor() {
    this.key = ACTIONS.SPREAD;
    this.allowedPointValues = [1, 3];
    this.requiredTargetCount = 2;
  }

  /**
   * @param {{
   *   gameState: import("src/engine/game-state.mjs").default,
   *   positions: Array<{ col: number, row: number }>,
   * }} params
   * @returns {{ legal: boolean, reason: string | null, capturedPositions?: Array<{ col: number, row: number }> }}
   */
  execute({ gameState, positions }) {
    const currentColorName = gameState.getCurrentColorName();

    if (!Array.isArray(positions)) {
      return {
        legal: false,
        reason: "missing-targets",
      };
    }

    if (positions.length !== this.requiredTargetCount) {
      return {
        legal: false,
        reason: "spread-requires-two-targets",
      };
    }

    for (const position of positions) {
      if (
        !isPointValueAt(position.col, position.row, this.allowedPointValues)
      ) {
        return {
          legal: false,
          reason: "spread-target-must-be-1-or-3-point-intersection",
        };
      }
    }

    const moveResult = gameState.getMultiStoneMovePreview(
      positions,
      currentColorName,
    );

    if (!moveResult.legal) {
      return {
        legal: false,
        reason: moveResult.reason,
      };
    }

    gameState.commitSnapshot();

    gameState.goBoardState.setBoard(moveResult.resultingBoard);

    gameState.markCurrentPlayerActionUsedAndAdvanceTurn();

    return {
      legal: true,
      reason: null,
      capturedPositions: moveResult.capturedPositions,
    };
  }
}

export class SwitchAction {
  constructor() {
    this.key = ACTIONS.SWITCH;
    this.requiredTargetCount = 2;
  }

  /**
   * @param {{
   *   gameState: import("src/engine/game-state.mjs").default,
   *   positions: Array<{ col: number, row: number }>,
   * }} params
   * @returns {{ legal: boolean, reason: string | null }}
   */
  execute({ gameState, positions }) {
    const currentColorName = gameState.getCurrentColorName();

    if (!Array.isArray(positions)) {
      return {
        legal: false,
        reason: "missing-targets",
      };
    }

    if (positions.length !== this.requiredTargetCount) {
      return {
        legal: false,
        reason: "switch-requires-two-targets",
      };
    }

    const [ownPosition, targetPosition] = positions;

    const ownStone = gameState.getStoneAt(ownPosition.col, ownPosition.row);
    const targetStone = gameState.getStoneAt(
      targetPosition.col,
      targetPosition.row,
    );

    if (ownStone === null || ownStone.colorName !== currentColorName) {
      return {
        legal: false,
        reason: "first-target-must-be-your-stone",
      };
    }

    if (targetStone === null) {
      return {
        legal: false,
        reason: "second-target-must-be-enemy-stone",
      };
    }

    if (targetStone.colorName === "scar") {
      return {
        legal: false,
        reason: "cannot-switch-with-scar",
      };
    }

    if (targetStone.colorName === currentColorName) {
      return {
        legal: false,
        reason: "second-target-must-be-enemy-stone",
      };
    }

    if (
      gameState.isCenterIntersection(targetPosition.col, targetPosition.row)
    ) {
      return {
        legal: false,
        reason: "cannot-switch-with-center-stone",
      };
    }

    if (
      !gameState.isHigherScoringPlayer(targetStone.colorName, currentColorName)
    ) {
      return {
        legal: false,
        reason: "target-player-not-higher-scoring",
      };
    }

    const simulatedBoard = gameState.goBoardState.cloneBoard(
      gameState.getBoard(),
    );

    const simulatedOwnStone = simulatedBoard[ownPosition.row][ownPosition.col];
    const simulatedTargetStone =
      simulatedBoard[targetPosition.row][targetPosition.col];

    simulatedBoard[ownPosition.row][ownPosition.col] = simulatedTargetStone;
    simulatedBoard[targetPosition.row][targetPosition.col] = simulatedOwnStone;

    const capturedPositions =
      gameState.goBoardState.rulesHelper.resolveCapturesAroundPositions(
        simulatedBoard,
        [ownPosition, targetPosition],
      );

    const currentPlayerStoneAfterCapture =
      simulatedBoard?.[targetPosition.row]?.[targetPosition.col] ?? null;

    if (
      currentPlayerStoneAfterCapture !== null &&
      currentPlayerStoneAfterCapture.colorName === currentColorName &&
      gameState.goBoardState.rulesHelper.doAnyPositionsHaveNoLiberties(
        simulatedBoard,
        [targetPosition],
      )
    ) {
      return {
        legal: false,
        reason: "suicide",
      };
    }

    gameState.commitSnapshot();

    gameState.goBoardState.setBoard(simulatedBoard);

    gameState.markCurrentPlayerActionUsedAndAdvanceTurn();

    return {
      legal: true,
      reason: null,
      capturedPositions,
    };
  }
}

export class AssimilateAction {
  constructor() {
    this.key = ACTIONS.ASSIMILATE;
    this.requiredAdjacentOwnStones = 2;
  }

  /**
   * @param {{
   *   gameState: import("src/engine/game-state.mjs").default,
   *   col: number,
   *   row: number,
   * }} params
   * @returns {{
   *   legal: boolean,
   *   reason: string | null,
   *   capturedPositions?: Array<{ col: number, row: number }>,
   * }}
   */
  execute({ gameState, col, row }) {
    const currentColorName = gameState.getCurrentColorName();
    const board = gameState.getBoard();
    const targetStone = board?.[row]?.[col] ?? null;

    if (targetStone === null) {
      return {
        legal: false,
        reason: "empty-target",
      };
    }

    if (targetStone.colorName === "scar") {
      return {
        legal: false,
        reason: "cannot-assimilate-scar",
      };
    }

    if (targetStone.colorName === currentColorName) {
      return {
        legal: false,
        reason: "cannot-assimilate-own-stone",
      };
    }

    if (
      !gameState.isHigherScoringPlayer(targetStone.colorName, currentColorName)
    ) {
      return {
        legal: false,
        reason: "target-player-not-higher-scoring",
      };
    }

    const isAdjacentToLargeEnoughGroup =
      gameState.isAdjacentToControlledGroupOfSize(
        col,
        row,
        currentColorName,
        this.requiredAdjacentOwnStones,
      );

    if (!isAdjacentToLargeEnoughGroup) {
      return {
        legal: false,
        reason: "target-must-be-adjacent-to-your-group-of-two-or-more",
      };
    }

    const simulatedBoard = gameState.goBoardState.cloneBoard(board);

    // Convert the target to the current player's color.
    // We create a fresh StoneData to clear target-specific effects.
    simulatedBoard[row][col] = new StoneData({
      colorName: currentColorName,
      capturable: true,
    });

    const capturedPositions =
      gameState.goBoardState.rulesHelper.resolveCapturesAroundPositions(
        simulatedBoard,
        [{ col, row }],
      );

    const convertedStoneAfterCapture = simulatedBoard?.[row]?.[col] ?? null;

    if (
      convertedStoneAfterCapture !== null &&
      convertedStoneAfterCapture.colorName === currentColorName &&
      gameState.goBoardState.rulesHelper.doAnyPositionsHaveNoLiberties(
        simulatedBoard,
        [{ col, row }],
      )
    ) {
      return {
        legal: false,
        reason: "suicide",
      };
    }

    gameState.commitSnapshot();

    gameState.goBoardState.setBoard(simulatedBoard);

    gameState.markCurrentPlayerActionUsedAndAdvanceTurn();

    return {
      legal: true,
      reason: null,
      capturedPositions,
    };
  }
}
