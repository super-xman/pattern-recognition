// import * as math from "../public/math.min";
import Camera from "../public/camera_utils";
import {Hands} from "../public/hands";
import { createCtx2D, createCtx3D, OringinResults, RefinedResults } from "./render_utils";

const videoElement = document.getElementsByClassName('input_video')[0];

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();

const hands = new Hands({locateFile: (file: string) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

function render2D() {
  const render = createCtx2D(1280,720);
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

function render3D() {
  const currentResults = new CurrentResults();
  const onResults = (results: OringinResults) => {
    currentResults.update(results);
  }
  hands.onResults(onResults);
  const render = createCtx3D()
  render(currentResults);
}
render3D();
