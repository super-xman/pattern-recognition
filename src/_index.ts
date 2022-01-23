import { Engine } from "babylonjs";
import * as HandData from "./utils";
import createScene from "./scene";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;

const engine = new Engine(canvas, true);

window.addEventListener("resize", function () {
  engine.resize();
});

const scene = createScene(canvas, engine, HandData.testData.leftHand);
engine.runRenderLoop(function () {
  scene.render();
});