import {
  ACTIONS,
  ACTION_LIST,
  ACTION_SCORE_DELTAS,
  createDisabledActionState,
} from "src/engine/actions.mjs";

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {import("src/engine/actions.mjs").ActionKey} ActionKey
 */

/**
 * @typedef {Record<StoneColorName, number>} ScoreMap
 */

/**
 * @typedef {Record<ActionKey, boolean>} ActionEnabledState
 */

/**
 * @typedef {Record<StoneColorName, boolean>} ActionCooldownState
 */

export default class ActionAvailabilityHelper {
  /**
   * @param {{
   *   actionScoreDeltas?: Partial<Record<ActionKey, number>>,
   * }} options
   */
  constructor(options = {}) {
    this.actionScoreDeltas = {
      ...ACTION_SCORE_DELTAS,
      ...(options.actionScoreDeltas ?? {}),
    };

    this.actionKeys = ACTION_LIST.map((action) => action.key);
  }

  /**
   * @param {{
   *   currentColorName: StoneColorName,
   *   scores: ScoreMap,
   *   cooldowns: ActionCooldownState,
   *   gameState?: import("src/engine/game-state.mjs").default,
   * }} params
   * @returns {ActionEnabledState}
   */
  getEnabledActionsForPlayer({
    currentColorName,
    scores,
    cooldowns,
    gameState,
  }) {
    const disabled = createDisabledActionState();

    if (cooldowns[currentColorName]) {
      return disabled;
    }

    const topScore = this.getTopScore(scores);
    const currentScore = scores[currentColorName] ?? 0;
    const scoreDelta = topScore - currentScore;

    // Topmost player, including ties for top.
    if (scoreDelta <= 0) {
      return disabled;
    }

    const enabled = {};

    for (const actionKey of this.actionKeys) {
      const requiredDelta = this.actionScoreDeltas[actionKey] ?? Infinity;
      enabled[actionKey] = scoreDelta >= requiredDelta;
    }

    this.applyBoardPreconditions(enabled, {
      currentColorName,
      scores,
      gameState,
    });

    return enabled;
  }

  /**
   * @param {ActionEnabledState} enabled
   * @param {{
   *   currentColorName: StoneColorName,
   *   scores: ScoreMap,
   *   gameState?: import("src/engine/game-state.mjs").default,
   * }} params
   */
  applyBoardPreconditions(enabled, { currentColorName, scores, gameState }) {
    if (!gameState) return;

    const currentPlayerHasStone = gameState.hasStoneOfColor(currentColorName);

    // Shield: must have at least one own stone to protect.
    if (!currentPlayerHasStone) {
      enabled[ACTIONS.SHIELD] = false;
    }

    // Switch: must have at least one own stone to swap.
    if (!currentPlayerHasStone) {
      enabled[ACTIONS.SWITCH] = false;
    }

    // Optional but useful: Switch also needs at least one valid enemy target.
    if (
      !this.hasHigherScoringNonCenterTarget({
        currentColorName,
        scores,
        gameState,
      })
    ) {
      enabled[ACTIONS.SWITCH] = false;
    }
  }

  /**
   * @param {{
   *   currentColorName: StoneColorName,
   *   scores: ScoreMap,
   *   gameState: import("src/engine/game-state.mjs").default,
   * }} params
   * @returns {boolean}
   */
  hasHigherScoringNonCenterTarget({ currentColorName, scores, gameState }) {
    const board = gameState.getBoard();
    const currentScore = scores[currentColorName] ?? 0;

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const stone = board[row][col];

        if (stone === null) continue;
        if (stone.colorName === "scar") continue;
        if (stone.colorName === currentColorName) continue;
        if (gameState.isCenterIntersection(col, row)) continue;

        const targetScore = scores[stone.colorName] ?? 0;

        if (targetScore > currentScore) {
          return true;
        }
      }
    }

    return false;
  }

  getTopScore(scores) {
    return Math.max(...Object.values(scores));
  }
}
