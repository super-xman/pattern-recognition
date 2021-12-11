import * as BABYLON from "babylonjs";
import { RefinedResults } from "./data_utils";

const createScene = function (canvas: HTMLCanvasElement, engine: BABYLON.Engine, results: RefinedResults): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
  camera.upperRadiusLimit = 100;
  camera.lowerRadiusLimit = 2;
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
  const wrist = BABYLON.MeshBuilder.CreateSphere("wrist", {diameterX:2});
  const center = BABYLON.MeshBuilder.CreateSphere("center", {diameterX:2});
  const joint1 = BABYLON.MeshBuilder.CreateSphere("joint1", {diameterX:1, diameterY:2});
  const joint2 = BABYLON.MeshBuilder.CreateSphere("joint2", {diameterX:1, diameterY:2});
  const joint3 = BABYLON.MeshBuilder.CreateSphere("joint3", {diameterX:1, diameterY:2});
  let joints = [center, joint1, joint2, joint3];
  for(let joint of joints){
    wrist.addChild(joint);
  }
  joint2.position = new BABYLON.Vector3(4,0,0);
  joint3.position = new BABYLON.Vector3(3,3,0);
  return scene;
};


export default createScene;