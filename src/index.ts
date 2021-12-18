import { Engine } from "babylonjs";
import createScene from "./render3D";
import { RefinedResults, testData } from "./data_utils";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;

function createCtx3D(results: RefinedResults) {
  const engine = new Engine(canvas, true);

  window.addEventListener("resize", function () {
    engine.resize();
  });

  const scene = createScene(canvas, engine, results);
  engine.runRenderLoop(function () {
    scene.render();
  });
}

createCtx3D(testData);