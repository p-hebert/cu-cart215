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
  [ACTIONS.SCAR]: 13,
  [ACTIONS.SPREAD]: 13,
  [ACTIONS.SWITCH]: 21,
  [ACTIONS.ASSIMILATE]: 21,
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

    gameState.markCurrentPlayerActionUsedAndAdvanceTurn();

    return {
      legal: true,
      reason: null,
    };
  }
}
