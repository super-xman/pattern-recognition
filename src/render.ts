import { Engine } from "babylonjs";
import { HAND_CONNECTIONS } from "../public/hands";
import { drawConnectors, drawLandmarks } from "../public/drawing_utils";
import { OringinResults, RefinedResults, CurrentResults } from "./utils";
import createScene from "./scene";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;


/**
 * 创建二维画布环境。
 * @param width 画布宽度
 * @param height 画布高度
 * @return 绘制函数
 */
function createCtx2D(width: number, height: number): (results: OringinResults) => void {
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


/**
 * 创建三维画布环境，并绘制。
 * @param results 关节点识别结果
 */
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


type Hands = {
  onResults: (arg0: (results: OringinResults) => void) => void;
}

/**
 * 绘制二维手势关键点。
 * @param hands 手的识别结果，包含数据处理方法 onResult，每帧调用一次
 * @param width 画布宽度
 * @param height 画布高度
 */
function render2D(hands: Hands, width = 1280, height = 720) {
  const render = createCtx2D(width, height);
  const onResults = (results: OringinResults) => {
    render(results);
  }
  hands.onResults(onResults);
}


/**
 * 绘制三维手势关键点。
 * @param hands 手的识别结果，包含数据处理方法 onResult，每帧调用一次
 */
function render3D(hands: Hands) {
  const currentResults = new CurrentResults();
  const onResults = (results: OringinResults) => {
    currentResults.update(results);
  }
  hands.onResults(onResults);
  createCtx3D(currentResults);
}


export { render2D, render3D };