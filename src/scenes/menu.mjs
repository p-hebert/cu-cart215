import { BaseScene, SceneRequest } from "src/p5/scene.mjs";

export default class MenuScene extends BaseScene {
  static key = "menu";
  static label = "Menu";

  constructor() {
    super();
    this._setupped = false;
    console.log("hello menu")
  }

  setup(p5) {
    if (this._setupped) {
      this._rebuildButtons(p5);
      return;
    }

    this._setupped = true;
  }

  /**
   * @template {BaseScene} Scene
   * @param {import("p5")} p5
   */
  onEnter(p5) {

  }

  /**
   * @template {BaseScene} Scene
   * @param {import("p5")} p5
   * @param {Scene} nextScene
   */
  onExit(p5) {

  }

  /**
   * @param {import("p5")} p5
   */
  draw(p5) {
    p5.background("black");

  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mouseMoved(p5, event) {

  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {

  }

  /**
   * @param {import("p5")} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest | void}
   */
  mouseReleased(p5, event) {

  }

  /**
   * Optional keyboard support.
   *
   * @param {import("p5")} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
  }

}
