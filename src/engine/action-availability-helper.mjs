import {
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
   * }} params
   * @returns {ActionEnabledState}
   */
  getEnabledActionsForPlayer({ currentColorName, scores, cooldowns }) {
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
      enabled[actionKey] =
        scoreDelta >= (this.actionScoreDeltas[actionKey] ?? Infinity);
    }

    return enabled;
  }

  getTopScore(scores) {
    return Math.max(...Object.values(scores));
  }
}
