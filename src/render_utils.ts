import { HAND_CONNECTIONS } from "../public/hands";
import { drawConnectors, drawLandmarks } from "../public/drawing_utils";
import * as BABYLON from 'babylonjs';

interface Results {
  image: CanvasImageSource;
  multiHandLandmarks: {
    x: number[];
    y: number[];
    z: number[];
  }[][]
}

class Joints {
  leftHand: number[][];
  rightHand: number[][];
  length: number;
}

function createCtx2D(width=0, height=0): (arg0: Results) => void {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;;
  const canvasCtx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  canvas.style.height = "auto";

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

function createCtx3D(): (arg0: Joints) => void {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  const engine = new BABYLON.Engine(canvas, true);

  window.addEventListener("resize", function () {
    engine.resize();
  });

  const createScene = function (joints?: Joints): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);
    BABYLON.MeshBuilder.CreateBox("box", {});

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    return scene;
  };

  return (joints) => {
    const scene = createScene(joints);
    engine.runRenderLoop(function () {
      scene.render();
    });
  }
}

export { createCtx2D, createCtx3D, Results, Joints};