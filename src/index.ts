// import * as math from "../public/math.min";
import Camera from "../public/camera_utils";
import {Hands} from "../public/hands";
import { createCtx2D, createCtx3D, Results, Joints } from "./render_utils";

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
  const onResults = (results: Results) => {
    createCtx2D(1280,720)(results);
  }
  hands.onResults(onResults);
}

function render3D() {
  const joints = new Joints();
  const onResults = (results: Results) => {
    // todo
  }
  hands.onResults(onResults);
  createCtx3D()(joints);
  console.log(joints)
}
render3D();
