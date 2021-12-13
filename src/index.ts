// import * as math from "../public/math.min";
import Camera from "../public/camera_utils";
import {Hands} from "../public/hands";
import { render2D, render3D } from "./render_utils";

const videoElement = document.getElementsByClassName('input_video')[0];

// 定义相机参数并开启相机
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280, // 像素越低，处理速度越快，但精度越低
  height: 720
});
camera.start();

// 加载模型
const hands = new Hands({locateFile: (file: string) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2, // 手的数量上限
  modelComplexity: 0.2, // 模型复杂度，0~1
  minDetectionConfidence: 0.5, // 最小检测置信度，如果score大于阈值才被认为是手
  minTrackingConfidence: 0.5 // todo:有待确认
});

render3D(hands);