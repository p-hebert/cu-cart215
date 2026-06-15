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
    this._setupped = true
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
    p5.background("black");
    if (!this._setupped) {
      return;
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {

  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseReleased(p5, event) {

  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {

  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {

  }

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} nextScene
   */
  onExit(p5, nextScene) {
    console.log(`Exiting '${this.key}' to '${nextScene.key}'`);
  }
}
