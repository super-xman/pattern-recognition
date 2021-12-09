import { HAND_CONNECTIONS } from "../public/hands";
import { drawConnectors, drawLandmarks } from "../public/drawing_utils";
import * as BABYLON from 'babylonjs';

interface OringinResults {
  image: CanvasImageSource;
  multiHandLandmarks: {
    x: number;
    y: number;
    z: number;
  }[][];
  multiHandedness: {
    label: string;
    score: number;
  }[];
}

interface RefinedResults {
  leftLandmarks: number[][];
  rightLandmarks: number[][];
  isLeftHandCaptured: boolean;
  isRightHandCaptured: boolean;
}

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;

function createCtx2D(width:number, height:number): (results: OringinResults) => void {
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

function createCtx3D(): (results: RefinedResults) => void {
  const engine = new BABYLON.Engine(canvas, true);
  
  const createScene = function (results: RefinedResults): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);
    BABYLON.MeshBuilder.CreateBox("box", {});

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    return scene;
  };

  window.addEventListener("resize", function () {
    engine.resize();
  });

  return (results) => {
    const scene = createScene(results);
    engine.runRenderLoop(function () {
      scene.render();
    });
  }
}

type Hands = {
  onResults: (arg0: (results: OringinResults) => void) => void;
}

function render2D(hands: Hands, width=1280, height=720) {
  const render = createCtx2D(width, height);
  const onResults = (results: OringinResults) => {
    render(results);
  }
  hands.onResults(onResults);
}

class CurrentResults implements RefinedResults {
  leftLandmarks: number[][];
  rightLandmarks: number[][];
  isLeftHandCaptured: boolean;
  isRightHandCaptured: boolean;

  private strategies = [
    function(_results: OringinResults){
      this.isLeftHandCaptured = false;
      this.isRightHandCaptured = false;
    },
    function(results: OringinResults){
      let landmarks = results.multiHandLandmarks[0].map((joint) => Object.values(joint));
      this.isLeftHandCaptured = results.multiHandedness[0].label === "Left";
      this.isRightHandCaptured = !this.isLeftHandCaptured;
      this.leftLandmarks = this.isLeftHandCaptured && landmarks;
      this.rightLandmarks = this.isRightHandCaptured && landmarks;
    },
    function(results: OringinResults){
      let landmarks1 = results.multiHandLandmarks[0].map((joint) => Object.values(joint));
      let landmarks2 = results.multiHandLandmarks[1].map((joint) => Object.values(joint));
      this.isLeftHandCaptured = true;
      this.isRightHandCaptured = true;
      this.leftLandmarks = landmarks1;
      this.rightLandmarks = landmarks2;
    }
  ];

  update(results: OringinResults) {
    this.strategies[results.multiHandLandmarks.length].call(this, results);
  }
}

function render3D(hands: Hands) {
  const currentResults = new CurrentResults();
  const onResults = (results: OringinResults) => {
    currentResults.update(results);
  }
  hands.onResults(onResults);
  const render = createCtx3D()
  render(currentResults);
}

export { render2D, render3D};