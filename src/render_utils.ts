import { Engine } from "babylonjs";
import { HAND_CONNECTIONS } from "../public/hands";
import { drawConnectors, drawLandmarks } from "../public/drawing_utils";
import * as HandData from "./data_utils";
import createScene from "./render3D";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;


function createCtx2D(width:number, height:number): (results: HandData.OringinResults) => void {
  const canvasCtx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  canvas.style.objectFit = "contain";

  return (results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
          { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
      }
    }
    canvasCtx.restore();
  }
}


function createCtx3D(results: HandData.RefinedResults) {
  const engine = new Engine(canvas, true);

  window.addEventListener("resize", function () {
    engine.resize();
  });

  const scene = createScene(canvas, engine, results);
  engine.runRenderLoop(function () {
    scene.render();
  });
}


type Hands = {
  onResults: (arg0: (results: HandData.OringinResults) => void) => void;
}


function render2D(hands: Hands, width=1280, height=720) {
  const render = createCtx2D(width, height);
  const onResults = (results: HandData.OringinResults) => {
    render(results);
  }
  hands.onResults(onResults);
}


function render3D(hands: Hands) {
  const currentResults = new HandData.CurrentResults();
  const onResults = (results: HandData.OringinResults) => {
    currentResults.update(results);
  }
  hands.onResults(onResults);
  createCtx3D(currentResults);
}


export { render2D, render3D };