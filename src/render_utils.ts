import { HAND_CONNECTIONS } from "../public/hands";
import { drawConnectors, drawLandmarks } from "../public/drawing_utils";
import * as BABYLON from 'babylonjs';

interface Results {
  image: HTMLImageElement | HTMLVideoElement;
  multiHandLandmarks: {
    x: number[];
    y: number[];
    z: number[];
  }[]
}

class Joints {
  leftHand: number[][];
  rightHand: number[][];
  length: number;
}

function renderJoints3D() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  const engine = new BABYLON.Engine(canvas, true);

  canvas.className = "canvas_3D";
  window.addEventListener("resize", function () {
    engine.resize();
  });

  const createScene = function (joints: Joints): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);
    BABYLON.MeshBuilder.CreateBox("box", {});

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    return scene;
  };

  return (joints: Joints) => {
    const scene = createScene(joints);
    engine.runRenderLoop(function () {
      scene.render();
    });
  }
}

function renderJoints2D() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;;
  const canvasCtx = canvas.getContext('2d');

  canvas.className = "canvas_2D";
  canvas.width = 1280;
  canvas.height = 720;

  return (results: Results) => {
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

function assertNever(x: any): never {
  throw new Error("Unexpected object: " + x);
}

function render(type: string) {
  switch(type){
    case '2d': return renderJoints2D();
    case '3d': return renderJoints3D();
    default: return assertNever(type);
  }
}

export { render,  Results, Joints};