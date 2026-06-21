import ActionButton from "src/components/action-button.mjs";
import StoneButton from "src/components/stone-button.mjs";
import { ACTION_LIST } from "src/engine/actions.mjs";
import { IP5Lifecycle } from "src/p5/interfaces.mjs";

/** @typedef {import("src/components/board.mjs").default} Board */

/**
 * @typedef {"black" | "white" | "blood-red" | "midnight-blue"} StoneColorName
 */

/**
 * @typedef {Object} StoneColor
 * @property {StoneColorName} name
 * @property {string} value
 */

/**
 * @callback StoneSelectorChangeHandler
 * @param {StoneColorName} colorName
 * @param {string} colorValue
 * @returns {void}
 */

/**
 * @typedef {Object} StoneSelectorAction
 * @property {string} key
 * @property {string} label
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Record<string, boolean>} ActionEnabledState
 */

/**
 * @typedef {Object} StoneSelectorOptions
 * @property {Board} board
 * @property {StoneColor[]} [colors]
 * @property {StoneColorName} [selectedColorName]
 * @property {boolean} [enabled]
 * @property {boolean} [isOnActionCooldown]
 * @property {number} [stoneSize]
 * @property {number} [gap]
 * @property {number} [offsetY]
 * @property {StoneSelectorAction[]} [actions]
 * @property {object} [actionRequirementText]
 * @property {ActionEnabledState} [actionEnabledState]
 * @property {string | null} [selectedActionKey]
 * @property {number} [actionTextSize]
 * @property {number} [actionGap]
 * @property {number} [actionOffsetY]
 * @property {((actionKey: string | null) => void) | null} [onActionChange]
 * @property {StoneSelectorChangeHandler | null} [onChange]
 */

export default class StoneSelector extends IP5Lifecycle {
  /**
   * @param {StoneSelectorOptions} options
   */
  constructor(options) {
    super();

    this.board = options.board;
    // New: enabled = clickable, disabled = visual-only / externally controlled.
    this.enabled = options.enabled ?? true;

    this.colors = options.colors ?? [
      { name: "black", value: "#000000" },
      { name: "white", value: "#ffffff" },
      { name: "blood-red", value: "#f00" },
      { name: "midnight-blue", value: "#00f" },
    ];

    this.selectedColorName = options.selectedColorName ?? this.colors[0].name;

    this.actions = options.actions ?? ACTION_LIST;
    this.actionEnabledState = options.actionEnabledState ?? {
      shield: true,
      scar: true,
      spread: true,
      switch: true,
      assimilate: true,
    };
    this.actionRequirementText = options.actionRequirementText ?? {};

    this.selectedActionKey = options.selectedActionKey ?? null;

    this.actionTextSize = options.actionTextSize ?? 18;
    this.actionGap = options.actionGap ?? 18;
    this.actionOffsetY = options.actionOffsetY ?? 38;
    this.onActionChange = options.onActionChange ?? null;
    this.actionButtons = [];

    this.isOnActionCooldown = options.isOnActionCooldown ?? false;
    this.cooldownText = options.cooldownText ?? "cooldown";
    this.cooldownTextSize = options.cooldownTextSize ?? 13;
    this.cooldownOffsetY = options.cooldownOffsetY ?? 18;

    this.stoneSize = options.stoneSize ?? 28;
    this.gap = options.gap ?? 16;
    this.offsetY = options.offsetY ?? 42;

    this.onChange = options.onChange ?? null;

    this.buttons = [];
  }

  /**
   * @param {import("p5")} p5
   */
  setup(p5) {
    this.createButtons();
    this.createActionButtons();
    this.updateButtonLayout(p5);
    this.updateActionButtonLayout(p5);
  }

  createButtons() {
    this.buttons = this.colors.map((color) => {
      return new StoneButton({
        x: 0,
        y: 0,
        size: this.stoneSize,
        colorName: color.name,
        colorValue: color.value,
        selected: color.name === this.selectedColorName,
        onClick: () => {
          if (!this.enabled) return;
          this.selectColor(color.name);
        },
      });
    });
  }

  createActionButtons() {
    this.actionButtons = this.actions.map((action) => {
      return new ActionButton({
        x: 0,
        y: 0,
        key: action.key,
        label: action.label,
        name: action.name,
        description: action.description,
        enabled: this.isActionEnabled(action.key),
        selected: this.selectedActionKey === action.key,
        textSize: this.actionTextSize,
        hitSize: this.actionTextSize + 12,
        requirementText: this.actionRequirementText[action.key] ?? null,
        hoverDelayMillis: 250,
        onClick: (actionKey) => {
          this.toggleAction(actionKey);
        },
      });
    });
  }

  /**
   * @param {Record<string, string | null>} actionRequirementText
   */
  setActionRequirementText(actionRequirementText) {
    this.actionRequirementText = {
      ...this.actionRequirementText,
      ...actionRequirementText,
    };

    for (const actionButton of this.actionButtons) {
      actionButton.setRequirementText(
        this.actionRequirementText[actionButton.key] ?? null,
      );
    }
  }

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    this.updateButtonLayout(p5);
    this.updateActionButtonLayout(p5);

    for (const button of this.buttons) {
      button.selected = button.colorName === this.selectedColorName;
      button.draw(p5);
    }

    if (this.isOnActionCooldown) {
      this.drawCooldownLabel(p5);
    }

    for (const actionButton of this.actionButtons) {
      actionButton.draw(p5);
    }
  }

  /**
   * @param {import("p5")} p5
   */
  drawCooldownLabel(p5) {
    if (this.actionButtons.length === 0) return;

    const firstButton = this.actionButtons[0];
    const lastButton = this.actionButtons[this.actionButtons.length - 1];

    const centerX = (firstButton.x + lastButton.x) / 2;
    const y = firstButton.y - this.cooldownOffsetY;

    p5.push();
    {
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textFont("monospace");
      p5.textSize(this.cooldownTextSize);
      p5.textStyle(p5.BOLD);
      p5.noStroke();
      p5.fill("#c76b00");
      p5.text(this.cooldownText, centerX, y);
    }
    p5.pop();
  }

  /**
   * @param {import("p5")} p5
   */
  updateButtonLayout(p5) {
    const boardOrigin = this.board.getOrigin(p5);
    const boardPixelSize = this.board.getBoardPixelSize();

    const totalWidth =
      this.colors.length * this.stoneSize + (this.colors.length - 1) * this.gap;

    const startX = boardOrigin.x + boardPixelSize / 2 - totalWidth / 2;
    const y = boardOrigin.y + boardPixelSize + this.offsetY;

    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];

      button.x = startX + this.stoneSize / 2 + i * (this.stoneSize + this.gap);

      button.y = y;
      button.size = this.stoneSize;
      button.selected = button.colorName === this.selectedColorName;
    }
  }

  /**
   * @param {import("p5")} p5
   */
  updateActionButtonLayout(p5) {
    if (this.buttons.length === 0) return;

    const firstButton = this.buttons[0];
    const lastButton = this.buttons[this.buttons.length - 1];

    const centerX = (firstButton.x + lastButton.x) / 2;
    const y = firstButton.y + firstButton.size / 2 + this.actionOffsetY;

    const totalWidth =
      this.actions.length * this.actionTextSize +
      (this.actions.length - 1) * this.actionGap;

    const startX = centerX - totalWidth / 2 + this.actionTextSize / 2;

    for (let i = 0; i < this.actionButtons.length; i++) {
      const actionButton = this.actionButtons[i];
      const action = this.actions[i];

      actionButton.x = startX + i * (this.actionTextSize + this.actionGap);
      actionButton.y = y;
      actionButton.textSize = this.actionTextSize;
      actionButton.hitSize = this.actionTextSize + 12;

      actionButton.enabled = this.isActionEnabled(actionButton.key);
      actionButton.selected = this.selectedActionKey === actionButton.key;
      actionButton.setRequirementText(
        this.actionRequirementText[actionButton.key] ?? null,
      );
    }
  }

  /**
   * @param {string} actionKey
   * @returns {boolean}
   */
  isActionEnabled(actionKey) {
    return this.actionEnabledState[actionKey] ?? false;
  }

  /**
   * @param {string} actionKey
   * @param {boolean} enabled
   */
  setActionEnabled(actionKey, enabled) {
    this.actionEnabledState[actionKey] = enabled;

    if (!enabled && this.selectedActionKey === actionKey) {
      this.selectedActionKey = null;
      this.onActionChange?.(null);
    }
  }

  /**
   * @param {ActionEnabledState} actionEnabledState
   */
  setActionEnabledState(actionEnabledState) {
    this.actionEnabledState = {
      ...this.actionEnabledState,
      ...actionEnabledState,
    };

    if (
      this.selectedActionKey !== null &&
      !this.isActionEnabled(this.selectedActionKey)
    ) {
      this.selectedActionKey = null;
      this.onActionChange?.(null);
    }
  }

  /**
   * @param {string | null} actionKey
   */
  setSelectedActionKey(actionKey) {
    if (actionKey === null) {
      this.selectedActionKey = null;
      this.onActionChange?.(null);
      return;
    }

    if (!this.isActionEnabled(actionKey)) return;

    this.selectedActionKey = actionKey;
    this.onActionChange?.(actionKey);
  }

  /**
   * @param {string} actionKey
   */
  toggleAction(actionKey) {
    if (!this.isActionEnabled(actionKey)) return;

    if (this.selectedActionKey === actionKey) {
      this.setSelectedActionKey(null);
    } else {
      this.setSelectedActionKey(actionKey);
    }
  }

  getSelectedActionKey() {
    return this.selectedActionKey;
  }

  /**
   * User-driven selection.
   *
   * @param {StoneColorName} colorName
   */
  selectColor(colorName) {
    this.setSelectedColorName(colorName);
  }

  /**
   * External/GameScene-driven selection.
   *
   * @param {StoneColorName} colorName
   */
  setSelectedColorName(colorName) {
    const color = this.colors.find((c) => c.name === colorName);
    if (!color) return;

    this.selectedColorName = color.name;
    this.onChange?.(color.name, color.value);
  }

  /**
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    // Clear transient button state when disabling.
    if (!enabled) {
      for (const button of this.buttons) {
        button.hovered = false;
        button.pressed = false;
      }
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getSelectedColorName() {
    return this.selectedColorName;
  }

  getSelectedColorValue() {
    const color = this.colors.find((c) => c.name === this.selectedColorName);
    return color?.value ?? "#000000";
  }

  getSelectedColorIndex() {
    return this.colors.findIndex((c) => c.name === this.selectedColorName);
  }

  selectNextColor() {
    const currentIndex = this.getSelectedColorIndex();

    if (currentIndex === -1) {
      this.setSelectedColorName(this.colors[0].name);
      return;
    }

    const nextIndex = (currentIndex + 1) % this.colors.length;
    this.setSelectedColorName(this.colors[nextIndex].name);
  }

  selectPreviousColor() {
    const currentIndex = this.getSelectedColorIndex();

    if (currentIndex === -1) {
      this.setSelectedColorName(this.colors[0].name);
      return;
    }

    const previousIndex =
      (currentIndex - 1 + this.colors.length) % this.colors.length;

    this.setSelectedColorName(this.colors[previousIndex].name);
  }

  /**
   * @param {boolean} isOnActionCooldown
   */
  setIsOnActionCooldown(isOnActionCooldown) {
    this.isOnActionCooldown = isOnActionCooldown;
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    this.updateButtonLayout(p5);
    this.updateActionButtonLayout(p5);

    let handCursorRequested = false;

    if (this.enabled) {
      for (const button of this.buttons) {
        button.mouseMoved(p5, event);

        if (button.hovered) {
          handCursorRequested = true;
        }
      }
    }

    for (const actionButton of this.actionButtons) {
      actionButton.mouseMoved(p5, event);

      if (actionButton.enabled && actionButton.hovered) {
        handCursorRequested = true;
      }
    }

    p5.cursor(handCursorRequested ? p5.HAND : p5.ARROW);
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this.updateButtonLayout(p5);
    this.updateActionButtonLayout(p5);

    if (this.enabled) {
      for (const button of this.buttons) {
        button.mousePressed(p5, event);
      }
    }

    for (const actionButton of this.actionButtons) {
      actionButton.mousePressed(p5, event);
    }
  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   * @returns {boolean}
   */
  mouseReleased(p5, event) {
    this.updateButtonLayout(p5);
    this.updateActionButtonLayout(p5);

    if (this.enabled) {
      for (const button of this.buttons) {
        const clicked = button.mouseReleased(p5, event);

        if (clicked) {
          button.click(p5, event);
          return true;
        }
      }
    }

    for (const actionButton of this.actionButtons) {
      const clicked = actionButton.mouseReleased(p5, event);

      if (clicked) {
        actionButton.click();
        return true;
      }
    }

    return false;
  }
}
