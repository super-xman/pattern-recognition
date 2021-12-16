import * as math from "mathjs";
import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength, getPalmOrthJoints, testData } from "./data_utils";

const JOINTS_SIZE = [3, 2.5, 2, 1.5, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const PALMJOINS = [0, 5, 9, 13, 17]; // 手掌关节，0为手腕
const CONNECTIONS = [ // 活动关节的连接信息
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20]
];

class HandModel {
  protected _jointsSize: number[] = JOINTS_SIZE;
  protected _bonesLength: number[] = new Array(21).fill(3);
  protected _conections: number[][] = CONNECTIONS;
  protected _palmJoints: number[] = PALMJOINS;
  protected _palmOrthLandmarks: number[][][]; // todo: 给定一个初始值
  private handType: string;
  joints: BABYLON.Mesh[];

  /**
   * 创建手模型，手关节由小球表示
   * @param handType 'left' or 'right'
   */
  constructor(handType: string) {
    this.handType = handType;
    // 定义关节模型
    this.joints = Array(20).fill({}).map((_, i) => {
      return BABYLON.MeshBuilder.CreateSphere(`joint${i}`, { diameter: this._jointsSize[i] });
    });
    // 手腕是手掌关节的父节点
    for (let i = 1; i < this._palmJoints.length; i++) {
      this.joints[0].addChild(this.joints[i]);
    }
  }

  set jointsSize(newSize: number[]) {
    this._jointsSize = newSize;
  }

  set bonesLength(newBones: number[]) {
    this._bonesLength = newBones;
  }

  set palmOrthLandmarks(newLandmarks: number[][][]) {
    this._palmOrthLandmarks = newLandmarks;
  }

  updatePosition(landmarks: number[]) {
    this.joints.map((joint, index) => {
      joint.position = new BABYLON.Vector3(landmarks[index]);
    });
  }

  setPalmPosition() {

  }
}


/**
 * 创建三维场景对象，包含相机、灯光、三维模型。
 * @param canvas 画布元素
 * @param engine 渲染引擎
 * @param results 关节点识别结果
 * @return 场景对象（未渲染）
 */
const createScene = function (canvas: HTMLCanvasElement, engine: BABYLON.Engine, results: RefinedResults): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene); // 灯光
  camera.upperRadiusLimit = 100; // 相机的最远距离
  camera.lowerRadiusLimit = 2; // 相机的最近距离
  camera.attachControl(canvas, true);

  let leftHand: HandModel = null;
  let rightHand: HandModel = null;

  scene.registerBeforeRender(function () {
    if (!results.isLeftHandCaptured && !results.isRightHandCaptured) {
      return;
    }

    // 第一次捕捉到手时进行初始化
    if (!leftHand && !rightHand) {
      let landmarks = results.leftLandmarks || results.rightLandmarks;
      HandModel.prototype.jointsSize = JOINTS_SIZE;
      HandModel.prototype.bonesLength = getBonesLength(landmarks, CONNECTIONS);
      HandModel.prototype.palmOrthLandmarks = getPalmOrthJoints(landmarks, PALMJOINS, results.isLeftHandCaptured);
    }

    if (results.isLeftHandCaptured) {
      if (!leftHand) {
        leftHand = new HandModel('left');
      }
    }

    if (results.isRightHandCaptured) {
      if (!rightHand) {
        rightHand = new HandModel('right');
      }
    }
  });

  return scene;
};


export default createScene;