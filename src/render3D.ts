// import * as math from "mathjs";
import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength, getOrthJoints } from "./data_utils";

const JOINTS_SIZE = [2.5, 1.8, 1.5, 1.2, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const CONNECTIONS = [ // 活动关节的连接信息
  [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20]
];
const LENGTH_SCALE = 2; // 手骨长度缩放系数
const SIZE_SCALE = 0.04; // 关节大小缩放系数


class HandModel {
  private _bonesLength: number[];
  joints: BABYLON.Mesh[];

  /**
   * 创建手模型，手关节由小球表示。
   * @param handType 'left' or 'right'
   */
  constructor(landmarks: number[][]) {
    // 定义关节模型
    this.joints = Array(21).fill({}).map((_, i) => {
      return BABYLON.MeshBuilder.CreateSphere(`joint${i}`, { diameter: JOINTS_SIZE[i] * SIZE_SCALE });
    });
    this.setInitPosition(landmarks);
    // 将手腕设为所有关节的父节点
    for (let joint of this.joints.slice(1)) {
      this.joints[0].addChild(joint);
    }
  }

  /**
   * 更新各关节带点坐标
   * @param landmarks
   */
  // updatePosition(landmarks: number[][]) {
  //   this.joints.map((joint, index) => {
  //     joint.position = new BABYLON.Vector3(...landmarks[index]);
  //   })
  // }

  updatePosition(landmarks: number[][]) {
    // 获取相对坐标轴和正则化后的关节坐标
    let { joints, axes } = getOrthJoints(landmarks);

    // 局部坐标系的坐标轴向量
    var vecs = axes.map((axis) => new BABYLON.Vector3(...axis));

    // 将所有关节作为整体进行平移和旋转
    this.joints[0].rotation = BABYLON.Vector3.RotationFromAxis(vecs[0], vecs[1], vecs[2]);
    this.joints[0].position = new BABYLON.Vector3(...landmarks[0]);

    // 确定手指关节坐标，通过关节1和方向向量推断出相邻关节2的坐标
    CONNECTIONS.map((group, index) => {
      let vec1 = new BABYLON.Vector3(...joints[group[0]]);
      let vec2 = new BABYLON.Vector3(...joints[group[1]]);
      let offset = vec2.subtract(vec1).normalize().scale(this._bonesLength[index]);
      this.joints[group[1]].position = this.joints[group[0]].position.add(offset);
    })
  }

  /**
   * 设置初始关节坐标。
   * @param landmarks 关节点坐标
   */
  setInitPosition(landmarks: number[][]) {
    var jointsLandmarks: number[][] = getOrthJoints(landmarks).joints;
    this.joints.map((joint, index) => {
      joint.position = new BABYLON.Vector3(...jointsLandmarks[index]);
    })
  }

  set bonesLength(length: number[]) {
    this._bonesLength = length;
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

  let leftHand: HandModel | null = null;
  let rightHand: HandModel | null = null;

  showAxis(8, BABYLON.Vector3.Zero(), BABYLON.Axis.X, BABYLON.Axis.Y, BABYLON.Axis.Z);

  /**
   * 绘制坐标轴。
   * @param size 坐标轴长度
   * @param origin 原点坐标
   * @param x x轴的终点坐标
   * @param y y轴的终点坐标
   * @param z z轴的终点坐标
   */
  function showAxis<T extends BABYLON.Vector3>(size: number, origin: T, x: T, y: T, z: T) {
    var axisX = BABYLON.Mesh.CreateLines("axisX", [origin, origin.add(x.scale(size))]);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    var axisY = BABYLON.Mesh.CreateLines("axisY", [origin, origin.add(y.scale(size))]);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [origin, origin.add(z.scale(size))]);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
  };

  scene.registerBeforeRender(function () {
    if (!results.isLeftHandCaptured && !results.isRightHandCaptured) {
      return;
    }

    // 第一次捕捉到手时初始化手掌坐标和手骨长度
    if (!leftHand && !rightHand) {
      let landmarks = results.leftLandmarks || results.rightLandmarks;
      HandModel.prototype.bonesLength = getBonesLength(landmarks, CONNECTIONS, LENGTH_SCALE);
    }

    // 如果捕捉到左手，更新左手坐标
    if (results.isLeftHandCaptured) {
      console.log('l')
      if (!leftHand) {
        leftHand = new HandModel(results.leftLandmarks);
      }
      leftHand.updatePosition(results.leftLandmarks);
    }

    // 如果捕捉到右手，更新右手坐标
    if (results.isRightHandCaptured) {
      console.log('r')
      if (!rightHand) {
        rightHand = new HandModel(results.rightLandmarks);
      }
      rightHand.updatePosition(results.rightLandmarks);
    }
  });

  return scene;
};


export default createScene;