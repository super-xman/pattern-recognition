// import * as math from "mathjs";
import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength, getOrthJoints } from "./data_utils";

const JOINTS_SIZE = [2, 1.7, 1.5, 1.2, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const BONE_SIZE = 0.75;
const FINGER_CONNECTIONS = [ // 活动关节的连接信息
  [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20]
];
const PALM_CONNECTIONS = [0, 1, 5, 9, 13, 17, 0]; // 手掌关节的连接信息
const LENGTH_SCALE = 1; // 手骨长度缩放系数
const SIZE_SCALE = 0.04; // 关节大小缩放系数


class HandModel {
  private _scene: BABYLON.Scene;
  private _bonesLength: number[];
  isLeft: boolean;
  joints: BABYLON.Mesh[];
  fingerBones: BABYLON.Mesh[];
  palmBone: BABYLON.Mesh;

  /**
   * 创建手模型，手关节由小球表示。
   * @param handType 'left' or 'right'
   * @param landmarks 各关节三维坐标
   * @param color 关节模型颜色
   * @param scene 场景对象
   */
  constructor(handType: string, landmarks: number[][], color: BABYLON.Color3, scene: BABYLON.Scene) {
    this._scene = scene;
    this.isLeft = handType === 'left';
    // 将手腕设为所有关节的父节点
    // for (let joint of this.joints.slice(1)) {
    //   this.joints[0].addChild(joint);
    // }
    let orthLandmarks = getOrthJoints(landmarks, this.isLeft).joints;
    this.createMeshes(orthLandmarks, color);
    this.setMeshRelation();
    this.setMeshPosition(orthLandmarks);
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
    let { joints, axes } = getOrthJoints(landmarks, this.isLeft);

    // 局部坐标系的坐标轴向量
    let vecs = axes.map((axis) => new BABYLON.Vector3(...axis));

    // 将所有关节作为整体进行平移和旋转
    // this.joints[0].rotation = BABYLON.Vector3.RotationFromAxis(vecs[0], vecs[1], vecs[2]);
    // this.joints[0].position = new BABYLON.Vector3(...landmarks[0]);

    // 确定手指关节坐标，通过关节1和方向向量推断出相邻关节2的坐标
    FINGER_CONNECTIONS.map((group, index) => {
      let vec1 = new BABYLON.Vector3(...joints[group[0]]);
      let vec2 = new BABYLON.Vector3(...joints[group[1]]);
      let offset = vec2.subtract(vec1).normalize().scale(this._bonesLength[index]);
      this.joints[group[1]].position = this.joints[group[0]].position.add(offset);
    });
  }

  /**
   * 设置初始关节和手骨位置。
   * @param orthLandmarks 关节点坐标
   */
  createMeshes(orthLandmarks: number[][], color: BABYLON.Color3) {
    const jointMat = new BABYLON.StandardMaterial('mat', this._scene);
    jointMat.diffuseColor = color;

    // 定义关节模型
    this.joints = Array(21).fill({}).map((_, index) => {
      let joint = BABYLON.MeshBuilder.CreateSphere(`joint${index}`, { diameter: JOINTS_SIZE[index] * SIZE_SCALE });
      joint.material = jointMat;
      return joint;
    });

    // 定义指骨模型
    this.fingerBones = this._bonesLength.map((len, index) => {
      let bone = BABYLON.MeshBuilder.CreateCylinder(`bone${index}`, { height: len, diameter: BONE_SIZE * SIZE_SCALE });
      bone.setPivotMatrix(BABYLON.Matrix.Translation(0, len / 2, 0), false);
      return bone;
    });

    // 定义手掌模型
    this.palmBone = (() => {
      let path = PALM_CONNECTIONS.map(i => new BABYLON.Vector3(...orthLandmarks[i]));
      return BABYLON.MeshBuilder.CreateTube(`palm`, { path: path, radius: BONE_SIZE * SIZE_SCALE / 2 });
    })();
  }

  setMeshRelation() {
    // 手腕关节是所有手骨的父模型
    this.palmBone.parent = this.joints[0];
    // 手骨是其顺连关节的父模型
    this.fingerBones.map((bone, index) => {
      let joint = this.joints[FINGER_CONNECTIONS[index][1]];
      joint.position.y = this._bonesLength[index] / 2;
      joint.parent = bone;
      bone.parent = this.joints[0];
    });
    // 手掌是手掌关节的父模型
    PALM_CONNECTIONS.map(i => {
      if (i === 0) return;
      this.joints[i].parent = this.palmBone;
    });
  }

  setMeshPosition(landmarks: number[][]) {
    PALM_CONNECTIONS.map(i => {
      this.joints[i].position = new BABYLON.Vector3(...landmarks[i]);
    });
    this.fingerBones.map((bone, index) => {
      bone.position = new BABYLON.Vector3(...landmarks[FINGER_CONNECTIONS[index][0]]);
    });
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
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene); // 灯光
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
      HandModel.prototype.bonesLength = getBonesLength(landmarks, FINGER_CONNECTIONS, LENGTH_SCALE);
    }

    // 如果捕捉到左手，更新左手坐标
    if (results.isLeftHandCaptured) {
      if (!leftHand) {
        leftHand = new HandModel('left', results.leftLandmarks, new BABYLON.Color3(1, 0.4, 0.4), scene);
      }
      // leftHand.updatePosition(results.leftLandmarks);
    }

    // 如果捕捉到右手，更新右手坐标
    if (results.isRightHandCaptured) {
      if (!rightHand) {
        rightHand = new HandModel('right', results.rightLandmarks, new BABYLON.Color3(0.4, 0.58, 0.77), scene);
      }
      // rightHand.updatePosition(results.rightLandmarks);
    }
  });
  scene.debugLayer.show();
  return scene;
};


export default createScene;