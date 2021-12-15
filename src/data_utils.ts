import * as math from "mathjs";
import { HAND_CONNECTIONS } from "../public/hands";


interface OringinResults {
  image: CanvasImageSource;
  multiHandLandmarks: {
    x: number;
    y: number;
    z: number;
  }[][];
  multiHandedness: {
    label: string; // 'Left' or 'Right'
    score: number; // 置信度
  }[];
}


interface RefinedResults {
  isLeftHandCaptured: boolean;
  isRightHandCaptured: boolean;
  leftLandmarks: number[][] | undefined; // 左手关节点三维坐标
  rightLandmarks: number[][] | undefined; // 右手关节点三维坐标
}


class CurrentResults implements RefinedResults {
  leftLandmarks: number[][];
  rightLandmarks: number[][];
  isLeftHandCaptured: boolean;
  isRightHandCaptured: boolean;

  private strategies = [
    function (_results: OringinResults) {
      this.isLeftHandCaptured = false;
      this.isRightHandCaptured = false;
    },
    function (results: OringinResults) {
      let landmarks = results.multiHandLandmarks[0].map((joint) => Object.values(joint).slice(3));
      this.isLeftHandCaptured = results.multiHandedness[0].label === "Left";
      this.isRightHandCaptured = !this.isLeftHandCaptured;
      this.leftLandmarks = this.isLeftHandCaptured && landmarks;
      this.rightLandmarks = this.isRightHandCaptured && landmarks;
    },
    function (results: OringinResults) {
      let landmarks1 = results.multiHandLandmarks[0].map((joint) => Object.values(joint).slice(3));
      let landmarks2 = results.multiHandLandmarks[1].map((joint) => Object.values(joint).slice(3));
      this.isLeftHandCaptured = true;
      this.isRightHandCaptured = true;
      this.leftLandmarks = landmarks1;
      this.rightLandmarks = landmarks2;
    }
  ];

  /**
   * 更新关节点坐标。
   * @param results 识别结果的原始数据，包含关节点坐标，标签，置信度等
   */
  update(results: OringinResults) {
    this.strategies[results.multiHandLandmarks.length].call(this, results);
  }
}


/**
 * 获取两向量围成的平面的法向量。
 * @param v1 向量1
 * @param v2 向量2
 * @returns 两向量叉积的标准化结果：v1 x v2
 */
function normVec<T extends math.Matrix | math.MathArray>(v1: T, v2: T): T {
  var mat = math.cross(v1, v2);
  var den = math.norm(mat);
  return math.divide(mat, den) as T;
}


/**
 * 获取正则化后的各关节点坐标，即将关节点从世界坐标系转换到手掌坐标系
 * @param data 各关节点三维坐标
 * @param std 由三点确定的基准参考系
 * @returns 变换坐标系后的各关节点三维坐标
 */
function getOrthJoints(data: number[][], std = [0, 5, 17]): math.Matrix {
  var numJoints: number = data.length;
  // 掌心的三个关节作为基准点
  var [p1, p2, p3]: [number[], number[], number[]] = [data[std[0]], data[std[1]], data[std[2]]];
  // 平移矩阵T
  var T: math.Matrix = math.matrix([[1, 0, 0, -p1[0]], [0, 1, 0, -p1[1]], [0, 0, 1, -p1[2]], [0, 0, 0, 1]]);

  // 计算以基准点构建的局部坐标系
  var vec13: number[] = math.subtract(p3, p1) as number[];
  var vy: number[] = math.divide(vec13, math.norm(vec13) as number + 1e-6) as number[];
  var vz: number[] = normVec(math.subtract(p2, p1) as number[], vy);
  var vx: number[] = normVec(vy, vz);

  // 求将局部坐标系旋转到与世界坐标系 z 轴重合的旋转矩阵 R1
  var uz: number[] = vz;
  var uy: number[] = normVec(vz, [1, 0, 0]);
  var ux: number[] = math.cross(uy, uz) as number[];
  var R1: math.Matrix = math.matrix([ux.concat([0]), uy.concat([0]), uz.concat([0]), [0, 0, 0, 1]]);

  // 求将局部坐标系绕 z 轴旋转到与世界坐标系 x,y 轴重合的旋转矩阵 R2
  vx = math.multiply(R1, vx.concat([1])) as unknown as number[];
  var cos: number = vx[0];
  var sin: number = (math.cross(math.resize(vx, [3]) as number[], [1, 0, 0]) as number[])[2] > 0 ? -vx[1] : vx[1];
  var R2: math.Matrix = math.matrix([[cos, -sin, 0, 0], [sin, cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);

  // 合并 R2、R1、T 得到变换矩阵
  var tran: math.Matrix = math.multiply(math.multiply(R2, R1), T);
  // 计算变换坐标系后的关节点坐标
  var forthCol: number[] = math.ones(numJoints, 1) as number[];
  var joints: math.Matrix = math.transpose(math.concat(data, forthCol, 1)) as math.Matrix;
  var orthJoints: math.Matrix = math.transpose(math.multiply(tran, joints));

  return orthJoints;
}


/**
 * 获取各节手骨长度
 * @param data 各关节点三维坐标
 * @param scale 缩放系数
 * @returns 各手骨长度
 */
function getBonesLength(data: number[][], scale = 1): number[] {
  return HAND_CONNECTIONS.map((joints: number[]) => {
    var vec = math.subtract(data[joints[1]], data[joints[0]]) as math.MathArray;
    return <number>math.norm(vec) * scale;
  });
}


export { OringinResults, RefinedResults, CurrentResults, getBonesLength };