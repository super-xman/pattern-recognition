import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength } from "./data_utils";


const createScene = function (canvas: HTMLCanvasElement, engine: BABYLON.Engine, results: RefinedResults): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
  camera.upperRadiusLimit = 100; // 相机的最远距离
  camera.lowerRadiusLimit = 2; // 相机的最近距离
  camera.attachControl(canvas, true); // 相机视角受鼠标控制
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene); // 灯光

  const sizeScale = 1; // 缩放系数
  const lengthScale = 1; // 缩放系数
  const bones: number[] = getBonesLength(results.leftLandmarks || results.rightLandmarks); // 关节长度

  // 定义关节点模型
  const wrist = BABYLON.MeshBuilder.CreateSphere("wrist", {diameter:3*scale});
  const jointsSize: number[] = [2.5, 2, 1.5, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1];
  const joints: BABYLON.Mesh[] = Array(20).fill({}).map((_, i) => {
    return BABYLON.MeshBuilder.CreateSphere(`joint${i}`, {diameter:jointsSize[i]*scale});
  });
  
  for(let joint of joints){
    wrist.addChild(joint);
  }

  wrist.position = new BABYLON.Vector3(...results.leftLandmarks[0]);

  scene.registerBeforeRender(function () {
    // todo: 动画
  });

  return scene;
};


export default createScene;