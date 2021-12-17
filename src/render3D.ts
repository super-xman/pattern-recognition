// import * as math from "mathjs";
import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength, getPalmOrthJoints, getAxes, testData } from "./data_utils";

const JOINTS_SIZE = [3, 2.5, 2, 1.5, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const PALMJOINTS = [0, 5, 9, 13, 17]; // 手掌关节，0为手腕
const REFERENCE = [0, 5, 17] //基准参考系
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
  protected _referJoints: number[] = REFERENCE;
  protected _palmJoints: number[] = PALMJOINTS;
  protected _palmsOrthLandmarks: number[][][]; // todo: 给定一个初始值
  joints: BABYLON.Mesh[];

  /**
   * 创建手模型，手关节由小球表示。
   * @param handType 'left' or 'right'
   */
  constructor(handType: string) {
    // 定义关节模型
    this.joints = Array(20).fill({}).map((_, i) => {
      return BABYLON.MeshBuilder.CreateSphere(`joint${i}`, { diameter: this._jointsSize[i] });
    });
    this.initPalmPosition(handType === 'right');
  }

  set jointsSize(newSize: number[]) {
    this._jointsSize = newSize;
  }

  set bonesLength(newLength: number[]) {
    this._bonesLength = newLength;
  }

  set palmOrthLandmarks(newLandmarks: number[][][]) {
    this._palmsOrthLandmarks = newLandmarks;
  }

  /**
   * 更新各关节带点坐标
   * @param landmarks 
   */
  updatePosition(landmarks: number[][]) {
    // 掌心的三个关节作为基准点
    var [p1, p2, p3] = [...this._referJoints.map((joint) => landmarks[joint])];
    // 局部坐标系的坐标轴向量
    var axes = getAxes(p1, p2, p3).map((axis) => new BABYLON.Vector3(...axis));
    // 将手掌关节作为整体进行平移和旋转
    this.joints[0].rotation = BABYLON.Vector3.RotationFromAxis(axes[0], axes[1], axes[2]);
    this.joints[0].position = new BABYLON.Vector3(...p1);
    // 确定手掌关节后再确定手指关节坐标，通过关节1和方向向量推断出相邻关节2的坐标
    this._conections.map((joints, index) => {
      let vec1 = new BABYLON.Vector3(...landmarks[joints[0]]);
      let vec2 = new BABYLON.Vector3(...landmarks[joints[1]]);
      let offset = vec2.subtract(vec1).normalize().scale(this._bonesLength[index]);
      this.joints[joints[1]].position = offset.add(this.joints[joints[0]].position);
    })
  }

  /**
   * 设置手掌关节的相对坐标（以手腕为原点的相对坐标系），实例化时调用。
   * @param 是否为右手
   */
  initPalmPosition(isRight: boolean) {
    // 将手腕设为手掌关节的父节点
    for (let i = 1; i < this._palmJoints.length; i++) {
      this.joints[0].addChild(this.joints[i]);
    }
    // 设置手掌其余关节的相对坐标
    let palmOrthLandmarks = this._palmsOrthLandmarks[Number(isRight)];
    this._palmJoints.slice(1).map((i) => {
      this.joints[i].position = new BABYLON.Vector3(...palmOrthLandmarks[i]);
    });
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
      HandModel.prototype.palmOrthLandmarks = getPalmOrthJoints(landmarks, PALMJOINTS, results.isLeftHandCaptured);
    }

    if (results.isLeftHandCaptured) {
      if (!leftHand) {
        leftHand = new HandModel('left');
      }
      leftHand.updatePosition(results.leftLandmarks);
    }

    if (results.isRightHandCaptured) {
      if (!rightHand) {
        rightHand = new HandModel('right');
      }
      rightHand.updatePosition(results.rightLandmarks);
    }
  });

  return scene;
};


export default createScene;