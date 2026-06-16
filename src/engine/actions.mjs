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
