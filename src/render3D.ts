// import * as math from "mathjs";
import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength, getPalmOrthJoints, getAxes, getOrthJoints } from "./data_utils";

const JOINTS_SIZE = [2.5, 2, 1.5, 1.2, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const PALM_JOINTS = [0, 5, 9, 13, 17]; // 手掌关节，0为手腕
const REFERENCE = [0, 5, 17] //基准参考系
const CONNECTIONS = [ // 活动关节的连接信息
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20]
];
const PALM_SCALE = 5;
const BONES_SCALE = 10;


class HandModel {
  private _jointsSize: number[] = JOINTS_SIZE;
  private _conections: number[][] = CONNECTIONS;
  private _referJoints: number[] = REFERENCE;
  private _palmJoints: number[] = PALM_JOINTS;
  private _palmsOrthLandmarks: number[][][];
  private _bonesLength: number[];
  joints: BABYLON.Mesh[];
  scene: BABYLON.Scene;

  /**
   * 创建手模型，手关节由小球表示。
   * @param handType 'left' or 'right'
   */
  constructor(handType: string, scene: BABYLON.Scene) {
    // 定义关节模型
    this.joints = Array(21).fill({}).map((_, i) => {
      return BABYLON.MeshBuilder.CreateSphere(`joint${i}`, { diameter: this._jointsSize[i] / 3 });
    });
    this.setPalmPosition(handType === 'right');
    this.scene = scene;
    this.showAxis(8, new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1));
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
    // this._conections.map((joints, index) => {
    //   let vec1 = new BABYLON.Vector3(...landmarks[joints[0]]);
    //   let vec2 = new BABYLON.Vector3(...landmarks[joints[1]]);
    //   let offset = vec2.subtract(vec1).normalize().scale(this._bonesLength[index]);
    //   this.joints[joints[1]].position = this.joints[joints[0]].position.add(offset);
    // })
  }

  // updatePosition(_landmarks: number[][]) {
  //   let landmarks = getOrthJoints(_landmarks);
  //   this.joints.map((joint, index) => { joint.position = new BABYLON.Vector3(landmarks[index][0], landmarks[index][1], landmarks[index][2]); });
  // }

  /**
   * 设置手掌关节的相对坐标（以手腕为原点的相对坐标系），实例化时调用。
   * @param 是否为右手
   */
  setPalmPosition(isRight: boolean) {
    // 将手腕设为手掌关节的父节点
    for (let i of this._palmJoints.slice(1)) {
      this.joints[0].addChild(this.joints[i]);
    }
    // 设置手掌其余关节的相对坐标
    let palmOrthLandmarks = this._palmsOrthLandmarks[Number(isRight)];
    this._palmJoints.map((v, i) => {
      this.joints[v].position = new BABYLON.Vector3(...palmOrthLandmarks[i]);
    });
  }

  set palmsOrthLandmarks(landmarks: number[][][]) {
    this._palmsOrthLandmarks = landmarks;
  }

  set bonesLength(length: number[]) {
    this._bonesLength = length;
  }

  showAxis(size: number, origin: BABYLON.Vector3, x: BABYLON.Vector3, y: BABYLON.Vector3, z: BABYLON.Vector3) {
    var axisX = BABYLON.Mesh.CreateLines("axisX", [origin, x.scale(size)], this.scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    var axisY = BABYLON.Mesh.CreateLines("axisY", [origin, y.scale(size)], this.scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [origin, z.scale(size)], this.scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
  };
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

  scene.registerBeforeRender(function () {
    if (!results.isLeftHandCaptured && !results.isRightHandCaptured) {
      return;
    }

    // 第一次捕捉到手时初始化手掌坐标和手骨长度
    if (!leftHand && !rightHand) {
      let landmarks = results.leftLandmarks || results.rightLandmarks;
      HandModel.prototype.palmsOrthLandmarks = getPalmOrthJoints(landmarks, PALM_JOINTS, results.isLeftHandCaptured, PALM_SCALE);
      HandModel.prototype.bonesLength = getBonesLength(landmarks, CONNECTIONS, BONES_SCALE);
    }

    if (results.isLeftHandCaptured) {
      if (!leftHand) {
        leftHand = new HandModel('left', scene);
      }
      leftHand.updatePosition(results.leftLandmarks);
    }

    if (results.isRightHandCaptured) {
      if (!rightHand) {
        rightHand = new HandModel('right', scene);
      }
      rightHand.updatePosition(results.rightLandmarks);
    }
  });

  return scene;
};


export default createScene;