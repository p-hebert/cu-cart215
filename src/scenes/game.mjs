import Board from "src/components/board.mjs";
import StoneSelector from "src/components/stone-selector.mjs";
import { BaseScene } from "src/p5/scene.mjs";
// import FontBook from "src/utils/fonts.mjs";

/**
 * Game Scene
 *
 * TODO: Docs.
 */
export default class GameScene extends BaseScene {
  static key = "game";
  static label = "Game";

  constructor({} = {}) {
    super();
    this.board = null;
    this.stones = null;
    this._setupped = false;
  }

  /**
   * Load assets
   *
   * @param {import('p5')} p5
   */

  setup(p5) {
    if (this._setupped) {
      return;
    }

    this.board = new Board({
      boardSize: 7,
      cellSize: 70,
      margin: 100,
      alignment: ["center", "center"],
    });
    this.board.setup(p5);

    this.stoneSelector = new StoneSelector({
      board: this.board,
      selectedColorName: "black",
      offsetY: 44,
    });
    this.stoneSelector.setup(p5);

    this.stones = [];

    this._setupped = true;
  }

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} prevScene
   */
  onEnter(p5, prevScene) {
    console.log(`Entering '${this.key}' from '${prevScene.key}'`);
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.background("#ecf4f7");
    if (!this._setupped) {
      return;
    }

    this.board.draw(p5);

    for (const stone of this.stones) {
      stone.draw(p5);
    }

    this.stoneSelector.draw(p5);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {
    this.stoneSelector.mouseMoved(p5, event);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this.stoneSelector.mousePressed(p5, event);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseReleased(p5, event) {
    const selectorHandledClick = this.stoneSelector.mouseReleased(p5, event);

    if (selectorHandledClick) return;

    // Otherwise handle board click / stone placement.
    const colorName = this.stoneSelector.getSelectedColorName();

    // place stone using colorName
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {}

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {}

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} nextScene
   */
  onExit(p5, nextScene) {
    console.log(`Exiting '${this.key}' to '${nextScene.key}'`);
  }
}
