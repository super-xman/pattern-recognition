import { Engine } from "babylonjs";
import * as HandData from "./data_utils";
import createScene from "./render3D";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;


const engine = new Engine(canvas, true);

window.addEventListener("resize", function () {
  engine.resize();
});

const scene = createScene(canvas, engine, HandData.testData);
engine.runRenderLoop(function () {
  scene.render();
});