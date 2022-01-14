import * as BABYLON from "babylonjs";
import * as math from "mathjs";
import { RefinedResults, getOrthJoints, getAxes, getRotateMatrix, getVecsAngle } from "./utils";

const JOINTS_SIZE = [2, 1.7, 1.5, 1.2, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const BONE_LENGTH = [
  0.09058110310302066, 0.07518780823304178, 0.06049806422527013,
  0.08325330870496479, 0.052474935672141475, 0.04631153970555138,
  0.09313590473351081, 0.06185541728154114, 0.05181620155012202,
  0.0874648140693265, 0.05690057491928873, 0.048035611573838156,
  0.06119228713309975, 0.04572042765349261, 0.045541290729764866
];
const PALM_JOINTS = new Map([
  [0, [0, 0, 0]],
  [1, [-0.0377495979457132, 0.0571060328058447, -0.02110707486659749]],
  [5, [-1.1102230246251565e-16, 0.25110762324272273, -1.3877787807814457e-17]],
  [9, [0.05022329996157915, 0.24951101244189366, 0.011326611131577222]],
  [13, [0.08963687514000007, 0.21369765203961089, 0.011026983237065184]],
  [17, [0.11883115061908689, 0.154739311693879, -1.3877787807814457e-17]]
]);
const FINGER_CONNECTIONS = [ // 活动关节的连接信息
  [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20]
];
const BONE_SIZE = 0.75; // 骨骼半径与关节半径之比
const BONE_LENGTH_SCALE = 1; // 手骨长度缩放系数
const SIZE_SCALE = 0.04; // 关节大小缩放系数
const MOVE_SCALE = 1; // 平移放大系数

const LEFT_COLOR = [255, 102, 102];
const RIGHT_COLOR = [102, 148, 196];
const LEFT_BASE = [1, 0, 0];
const RIGHT_BASE = [-1, 0, 0];

class HandModel {
  private _scene: BABYLON.Scene;
  private _primaryPoint: BABYLON.Vector3;
  private _basePoint: BABYLON.Vector3;
  private _bonesLength = BONE_LENGTH;
  private _palmJoints = new Map();
  isLeft: boolean;
  joints: BABYLON.Mesh[];
  fingerBones: BABYLON.Mesh[];
  palmBone: BABYLON.Mesh;

  /**
   * 创建手模型，手关节由小球表示。
   * @param handType 'left' or 'right'
   * @param landmarks 各关节三维坐标
   * @param color 关节模型颜色
   * @param basePoint 基准点，手模型会在基准点附近运动
   * @param scene 场景对象
   */
  constructor(handType: string, landmarks: number[][], color: number[], basePoint: number[], scene: BABYLON.Scene) {
    this.isLeft = handType === 'left';
    this._scene = scene;
    this._primaryPoint = new BABYLON.Vector3(...landmarks[0]);
    this._basePoint = new BABYLON.Vector3(...basePoint);

    PALM_JOINTS.forEach((value, key) => {
      this._palmJoints.set(key, [!this.isLeft ? value[0] : -value[0], value[1], value[2]]);
    });

    this._createMeshes(new BABYLON.Color3(...color.map(c => c / 255)));
    this._setMeshesRelation();

    showAxis(0.2, BABYLON.Vector3.Zero(), this.palmBone);
    showAxis(0.1, BABYLON.Vector3.Zero(), this.joints[2]);
    showAxis(0.1, BABYLON.Vector3.Zero(), this.joints[6]);
    showAxis(0.1, BABYLON.Vector3.Zero(), this.joints[10]);
    showAxis(0.1, BABYLON.Vector3.Zero(), this.joints[14]);
    showAxis(0.1, BABYLON.Vector3.Zero(), this.joints[18]);

  }

  /**
   * 设置初始关节和手骨位置。
   * @param orthLandmarks 关节点坐标
   */
  private _createMeshes(color: BABYLON.Color3) {
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
      let bone = BABYLON.MeshBuilder.CreateCylinder(`bone${index}`, { height: len * BONE_LENGTH_SCALE, diameter: BONE_SIZE * SIZE_SCALE });
      bone.setPivotMatrix(BABYLON.Matrix.Translation(0, len * BONE_LENGTH_SCALE / 2, 0), false);
      return bone;
    });

    // 定义手掌模型
    this.palmBone = (() => {
      let path = Array.from(this._palmJoints.values()).concat([[0, 0, 0]]).map(arr => new BABYLON.Vector3(...arr).scale(BONE_LENGTH_SCALE));
      return BABYLON.MeshBuilder.CreateTube(`palm`, { path: path, radius: BONE_SIZE * SIZE_SCALE / 2 });
    })();

    // 将关节模型定位到手掌上
    this._palmJoints.forEach((v, i: number) => {
      this.joints[i].position = new BABYLON.Vector3(...v).scale(BONE_LENGTH_SCALE);
    });
  }

  /**
   * 设置模型间的从属关系
   */
  private _setMeshesRelation() {
    // 手腕关节是所有手骨的父模型
    this.palmBone.parent = this.joints[0];

    // 手骨是其顺连关节的父模型
    this.fingerBones.map((bone, index) => {
      let joint = this.joints[FINGER_CONNECTIONS[index][1]];
      joint.parent = bone;
      joint.position.y = this._bonesLength[index] * BONE_LENGTH_SCALE / 2;
      bone.parent = this.joints[FINGER_CONNECTIONS[index][0]];
      bone.position = BABYLON.Vector3.Zero();
    });

    // 手掌是手掌关节的父模型
    PALM_JOINTS.forEach((_, i) => {
      if (i === 0) return;
      this.joints[i].parent = this.palmBone;
    });
  }

  /**
   * 更新各关节带点坐标
   * @param landmarks
   */
  updatePosition(landmarks: number[][]) {
    // 根据手掌参照点旋转手掌模型
    let axse = getAxes(landmarks[0], landmarks[5], landmarks[17], this.isLeft).map(axis => new BABYLON.Vector3(...axis));
    this.palmBone.rotation = BABYLON.Vector3.RotationFromAxis(axse[0], axse[1], axse[2]);

    // 将手掌变换至基准坐标系的旋转矩阵(3x3)
    let rotateMatrix = getRotateMatrix(-this.palmBone.rotation.x, -this.palmBone.rotation.y, -this.palmBone.rotation.z);

    // 根据手腕坐标平移整体模型
    let wristLandmark = new BABYLON.Vector3(...landmarks[0]);
    this.joints[0].position = wristLandmark.subtract(this._primaryPoint).scale(MOVE_SCALE).add(this._basePoint);

    // 平移和旋转手骨模型到指定位置
    FINGER_CONNECTIONS.map((group, index) => {
      let axis: BABYLON.Vector3;
      let angle: number;

      if (index % 3 > 0) {
        let direction1 = math.subtract(landmarks[group[0]], landmarks[FINGER_CONNECTIONS[index - 1][0]]) as number[];
        let direction2 = math.subtract(landmarks[group[1]], landmarks[group[0]]) as number[];
        angle = getVecsAngle(direction1, direction2);
        axis = BABYLON.Axis.X;
      } else {
        let direction1 = [0, 1, 0];
        let direction2 = math.multiply(rotateMatrix, math.subtract(landmarks[group[1]], landmarks[group[0]])).toArray() as number[];
        angle = getVecsAngle(direction1, direction2);
        // if (math.abs(direction2[0]) > 0.4) {
        //   direction2 = [0.4 * math.sign(direction2[0]), 0.6 * (direction2[1] / (direction2[1] + direction2[2])), 0.6 * (direction2[2] / (direction2[1] + direction2[2]))];
        // }
        axis = new BABYLON.Vector3(...math.cross(direction1, direction2) as number[]).normalize();
        axis.z = math.min(math.max(0, axis.z), 0.5);
        console.log(axis.z);
      }

      this.fingerBones[index].rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, math.min([angle, 1.57]));
      this.fingerBones[0].rotate(BABYLON.Axis.Y, -1);
    });
  }

  /**
   * 显示/隐藏手模型
   * @param visibility 0-显示，1-隐藏
   */
  showMeshes(visibility: number) {
    if (this.palmBone.visibility === visibility) return;
    this.joints.map(joint => {
      joint.visibility = visibility;
    });
    this.fingerBones.map(bone => {
      bone.visibility = visibility;
    });
    this.palmBone.visibility = visibility;
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

  showAxis(4, BABYLON.Vector3.Zero());

  scene.registerBeforeRender(function () {
    // 如果捕捉到左手，更新左手坐标
    if (results.isLeftHandCaptured) {
      leftHand = leftHand || new HandModel('left', results.leftLandmarks, LEFT_COLOR, LEFT_BASE, scene);
      leftHand.showMeshes(1);
      leftHand.updatePosition(results.leftLandmarks);
    } else {
      !leftHand || leftHand.showMeshes(0);
    }

    // 如果捕捉到右手，更新右手坐标
    if (results.isRightHandCaptured) {
      rightHand = rightHand || new HandModel('right', results.rightLandmarks, RIGHT_COLOR, RIGHT_BASE, scene);
      rightHand.showMeshes(1);
      rightHand.updatePosition(results.rightLandmarks);
    } else {
      !rightHand || rightHand.showMeshes(0);
    }
  });
  // scene.debugLayer.show();
  return scene;
};

/**
 * 绘制坐标轴。
 * @param size 坐标轴长度
 * @param origin 原点坐标
 * @param parentMesh 父模型
 */
function showAxis<T extends BABYLON.Vector3>(size: number, origin: T, parentMesh?: BABYLON.Mesh) {
  const axisX = BABYLON.Mesh.CreateLines("axisX", [origin, origin.add(BABYLON.Axis.X.scale(size))]);
  axisX.color = new BABYLON.Color3(1, 0, 0); //红
  const axisY = BABYLON.Mesh.CreateLines("axisY", [origin, origin.add(BABYLON.Axis.Y.scale(size))]);
  axisY.color = new BABYLON.Color3(0, 1, 0); //绿
  const axisZ = BABYLON.Mesh.CreateLines("axisZ", [origin, origin.add(BABYLON.Axis.Z.scale(size))]);
  axisZ.color = new BABYLON.Color3(0, 0, 1); //蓝
  if (parentMesh) {
    axisX.parent = parentMesh;
    axisY.parent = parentMesh;
    axisZ.parent = parentMesh;
  }
};


export default createScene;