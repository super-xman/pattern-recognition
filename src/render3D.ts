import * as BABYLON from "babylonjs";
import { RefinedResults, getBonesLength } from "./data_utils";

const JOINTS_SIZE = [3, 2.5, 2, 1.5, 1, 1.4, 1, 1, 1, 1.5, 1, 1, 1, 1.4, 1, 1, 1, 1.3, 1, 1, 1]; // 关节尺寸
const PALMJOINS = [5, 9, 13, 17]; // 手掌关节（不包含手腕）
const CONNECTIONS = [ // 活动关节的连接信息
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20]
];

const data: RefinedResults = {
  isLeftHandCaptured: true,
  isRightHandCaptured: false,
  leftLandmarks: [
    [0.6300205588340759, 1.0445104837417603, 8.649211125089096e-9],
    [0.5864482522010803, 1.0033149719238281, 0.006611919030547142],
    [0.5583881139755249, 0.9182900190353394, -0.006401084829121828],
    [0.5533966422080994, 0.838855504989624, -0.021055834367871284],
    [0.5637791156768799, 0.7830133438110352, -0.03486724570393562],
    [0.5604788661003113, 0.9178844690322876, -0.04905194044113159],
    [0.5737835168838501, 0.7903791666030884, -0.060112129896879196],
    [0.5852957963943481, 0.7999221682548523, -0.050489768385887146],
    [0.5839471817016602, 0.8316378593444824, -0.04335594177246094],
    [0.5931977033615112, 0.9300706386566162, -0.06271127611398697],
    [0.6101372241973877, 0.7916884422302246, -0.07930155843496323],
    [0.6199352741241455, 0.8246104121208191, -0.06420440226793289],
    [0.617077648639679, 0.8718233108520508, -0.050849221646785736],
    [0.6280784010887146, 0.9377634525299072, -0.07144881784915924],
    [0.6417489051818848, 0.8150600790977478, -0.07974396646022797],
    [0.6471017003059387, 0.8471201658248901, -0.056434616446495056],
    [0.6431535482406616, 0.8932198882102966, -0.03965077921748161],
    [0.6618053317070007, 0.9475839734077454, -0.07996515929698944],
    [0.6704261898994446, 0.8552306294441223, -0.08090528845787048],
    [0.6721728444099426, 0.8792961835861206, -0.06409379839897156],
    [0.670359194278717, 0.9185646176338196, -0.05126398056745529]],
  rightLandmarks: [[]],
}


class HandModel {
  protected _size: number[] = JOINTS_SIZE;
  protected _bones: number[] = new Array(21).fill(3);
  protected _conections: number[][] = CONNECTIONS;
  protected _palm: number[] = PALMJOINS;
  joints: BABYLON.Mesh[];

  /**
   * 创建手模型，手关节由小球表示
   * @param size 关节大小
   * @param bones 手骨长度
   */
  constructor() {
    // 定义关节模型
    this.joints = Array(20).fill({}).map((_, i) => {
      return BABYLON.MeshBuilder.CreateSphere(`joint${i}`, { diameter: this._size[i] });
    });
    // 手腕是手掌关节的父节点
    for (let i of PALMJOINS) {
      this.joints[0].addChild(this.joints[i]);
    }
  }

  set size(newSize: number[]) {
    this._size = newSize;
  }

  set bones(newBones: number[]) {
    this._bones = newBones;
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
  let bonesLength: number[];

  scene.registerBeforeRender(function () {
    if (!results.isLeftHandCaptured && !results.isRightHandCaptured) {
      return;
    }

    if (!leftHand && !rightHand) {
      bonesLength = getBonesLength(results.leftLandmarks || results.rightLandmarks);
      HandModel.prototype.size = JOINTS_SIZE;
      HandModel.prototype.bones = bonesLength;
    }

    if (results.isLeftHandCaptured) {
      if (!leftHand) {
        leftHand = new HandModel();
      }
      leftHand.joints[0].position = new BABYLON.Vector3(...results.leftLandmarks[0]);
    }

    if (results.isRightHandCaptured) {
      if (!rightHand) {
        rightHand = new HandModel();
      }
      rightHand.joints[0].position = new BABYLON.Vector3(...results.rightLandmarks[0]);
    }
  });

  return scene;
};


export default createScene;