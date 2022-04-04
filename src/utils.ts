import * as math from "mathjs";

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

interface TestData {
  leftHand: RefinedResults;
  rightHand: RefinedResults;
}

const testData: TestData = {
  leftHand: {
    isLeftHandCaptured: true,
    isRightHandCaptured: false,
    leftLandmarks: [
      [0.8092934489250183, -0.7622916102409363, -1.3928426190190635e-9],
      [0.7580729126930237, -0.7101923227310181, -0.01688704639673233],
      [0.7202193140983582, -0.6322453618049622, -0.02415304258465767],
      [0.6890637278556824, -0.5771089792251587, -0.03225882351398468],
      [0.6574849486351013, -0.5602167248725891, -0.04038286581635475],
      [0.7700287699699402, -0.5061377882957458, -0.0004826500662602484],
      [0.7539368271827698, -0.4105468988418579, -0.007142764050513506],
      [0.7470663189888, -0.35346198081970215, -0.015125317499041557],
      [0.7422776222229004, -0.30440184473991394, -0.021268552169203758],
      [0.8065078854560852, -0.497707337141037, -0.000791295082308352],
      [0.8122539520263672, -0.390910267829895, -0.0027521324809640646],
      [0.8174718022346497, -0.32828235626220703, -0.011547088623046875],
      [0.8222532868385315, -0.2781364917755127, -0.01953420601785183],
      [0.8400189876556396, -0.5149427652359009, -0.0041259159334003925],
      [0.8520215749740601, -0.42328566312789917, -0.00622995151206851],
      [0.8590445518493652, -0.36505699157714844, -0.015864696353673935],
      [0.8636305332183838, -0.3181387782096863, -0.023605354130268097],
      [0.8708460330963135, -0.5522238612174988, -0.011026785708963871],
      [0.8895282745361328, -0.4916885793209076, -0.011985239572823048],
      [0.8972622156143188, -0.4540017247200012, -0.01621156558394432],
      [0.9034345746040344, -0.4226062297821045, -0.020081892609596252]
    ],
    rightLandmarks: undefined,
  },

  rightHand: {
    isLeftHandCaptured: false,
    isRightHandCaptured: true,
    leftLandmarks: undefined,
    rightLandmarks: [
      [-0.8092934489250183, -0.7622916102409363, -1.3928426190190635e-9],
      [-0.7580729126930237, -0.7101923227310181, -0.01688704639673233],
      [-0.7202193140983582, -0.6322453618049622, -0.02415304258465767],
      [-0.6890637278556824, -0.5771089792251587, -0.03225882351398468],
      [-0.6574849486351013, -0.5602167248725891, -0.04038286581635475],
      [-0.7700287699699402, -0.5061377882957458, -0.0004826500662602484],
      [-0.7539368271827698, -0.4105468988418579, -0.007142764050513506],
      [-0.7470663189888, -0.35346198081970215, -0.015125317499041557],
      [-0.7422776222229004, -0.30440184473991394, -0.021268552169203758],
      [-0.8065078854560852, -0.497707337141037, -0.000791295082308352],
      [-0.8122539520263672, -0.390910267829895, -0.0027521324809640646],
      [-0.8174718022346497, -0.32828235626220703, -0.011547088623046875],
      [-0.8222532868385315, -0.2781364917755127, -0.01953420601785183],
      [-0.8400189876556396, -0.5149427652359009, -0.0041259159334003925],
      [-0.8520215749740601, -0.42328566312789917, -0.00622995151206851],
      [-0.8590445518493652, -0.36505699157714844, -0.015864696353673935],
      [-0.8636305332183838, -0.3181387782096863, -0.023605354130268097],
      [-0.8708460330963135, -0.5522238612174988, -0.011026785708963871],
      [-0.8895282745361328, -0.4916885793209076, -0.011985239572823048],
      [-0.8972622156143188, -0.4540017247200012, -0.01621156558394432],
      [-0.9034345746040344, -0.4226062297821045, -0.020081892609596252]
    ],
  }
}


class CurrentResults implements RefinedResults {
  leftLandmarks: number[][];
  rightLandmarks: number[][];
  isLeftHandCaptured: boolean;
  isRightHandCaptured: boolean;

  private _strategies = [
    function (results: OringinResults) {
      this.isLeftHandCaptured = false;
      this.isRightHandCaptured = false;
    },
    function (results: OringinResults) {
      let landmarks = results.multiHandLandmarks[0].map((joint) => [joint.x, -joint.y, joint.z]);
      this.isLeftHandCaptured = results.multiHandedness[0].label === "Right";
      this.isRightHandCaptured = !this.isLeftHandCaptured;
      this.leftLandmarks = this.isLeftHandCaptured && landmarks;
      this.rightLandmarks = this.isRightHandCaptured && landmarks;
    },
    function (results: OringinResults) {
      let label = results.multiHandedness[0].label;
      this.isLeftHandCaptured = true;
      this.isRightHandCaptured = true;
      this.leftLandmarks = results.multiHandLandmarks[Number(label === "Left")].map((joint) => [joint.x, -joint.y, joint.z]);
      this.rightLandmarks = results.multiHandLandmarks[Number(label === "Right")].map((joint) => [joint.x, -joint.y, joint.z]);
    }
  ];

  /**
   * 更新关节点坐标。
   * @param results 识别结果的原始数据，包含关节点坐标，标签，置信度等
   */
  update(results: OringinResults) {
    this._strategies[Math.min(results.multiHandLandmarks.length, 2)].call(this, results);
  }
}


/**
 * 获取两向量围成的平面的法向量。
 * @param v1 向量1
 * @param v2 向量2
 * @returns 两向量叉积：v1 x v2
 */
function _normVec<T extends math.Matrix | math.MathArray>(v1: T, v2: T): T {
  return math.cross(v1, v2) as T;
}


/**
 * 根据手掌的三个基准点求出局部坐标系的坐标轴向量。
 * @param p1 基准点1（原点）
 * @param p2 基准点2
 * @param p3 基准点3
 * @param isLeft 是否为左手
 * @returns 坐标轴向量
 */
function getAxes(landmarks: number[][], isLeft: boolean): number[][] {
  // 计算以基准点构建的局部坐标系
  var vy: number[] = math.subtract(landmarks[5], landmarks[0]) as number[];
  var ux: number[] = math.subtract(landmarks[17], landmarks[0]) as number[];
  var vz: number[] = isLeft ? _normVec(vy, ux) : _normVec(ux, vy);
  var vx: number[] = _normVec(vy, vz);
  return [vx, vy, vz];
}


interface OrthJoints {
  joints: number[][];
  axes: number[][];
}

/**
 * 获取正则化后的各关节点坐标，即将关节点从世界坐标系转换到手掌坐标系
 * @param data 各关节点三维坐标
 * @param refer 用于确定基准参考系的三个关节点索引
 * @returns 变换坐标系后的各关节点三维坐标及手掌坐标系
 */
function getOrthJoints(data: number[][], isLeft: boolean): OrthJoints {
  // 局部坐标系的坐标轴向量
  var [vx, vy, vz] = getAxes(data, isLeft);

  // 求将局部坐标系旋转到与世界坐标系 z 轴重合的旋转矩阵 R1
  var uz: number[] = vz;
  var uy: number[] = _normVec(vz, [1, 0, 0]);
  var ux: number[] = math.cross(uy, uz) as number[];
  var R1: math.Matrix = math.matrix([ux.concat([0]), uy.concat([0]), uz.concat([0]), [0, 0, 0, 1]]);

  // 求将局部坐标系绕 z 轴旋转到与世界坐标系 x,y 轴重合的旋转矩阵 R2
  vx = math.multiply(R1, vx.concat([1])).toArray() as number[];
  var cos: number = vx[0];
  var sin: number = -vx[1];
  var R2: math.Matrix = math.matrix([[cos, -sin, 0, 0], [sin, cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);

  // 平移矩阵T
  var T: math.Matrix = math.matrix([[1, 0, 0, -data[0][0]], [0, 1, 0, -data[0][1]], [0, 0, 1, -data[0][2]], [0, 0, 0, 1]]);
  // 合并 R2、R1、T 得到变换矩阵
  var tran: math.Matrix = math.multiply(math.multiply(R2, R1), T);
  // 计算变换坐标系后的关节点坐标
  var forthCol: number[] = math.ones(data.length, 1) as number[];
  var joints: math.Matrix = math.transpose(math.concat(data, forthCol, 1)) as math.Matrix;
  var orthJoints: number[][] = math.transpose(math.multiply(tran, joints)).toArray() as number[][];

  return {
    joints: orthJoints,
    axes: [vx, vy, vz],
  };
}


/**
 * 获取各节手骨长度。
 * @param landmarks 各关节点三维坐标
 * @param connections 活动关节的连接信息
 * @param scale 缩放系数
 * @returns 各手骨长度
 */
function getBonesLength(landmarks: number[][], connections: number[][], scale = 1): number[] {
  return connections.map((joints: number[]) => {
    var vec = math.subtract(landmarks[joints[1]], landmarks[joints[0]]) as math.MathArray;
    return <number>math.norm(vec) * scale;
  });
}


/**
 * 根据绕 x,y,z 轴的旋转角度（弧度值）计算整体旋转矩阵。
 * @param rotX 绕 x 轴的旋转角度
 * @param rotY 绕 y 轴的旋转角度
 * @param rotZ 绕 z 轴的旋转角度
 * @returns 旋转矩阵
 */
function getRotateMatrix(rotX: number, rotY: number, rotZ: number): math.Matrix {
  let matX = math.matrix([[1, 0, 0], [0, Math.cos(rotX), -Math.sin(rotX)], [0, Math.sin(rotX), Math.cos(rotX)]]);
  let matY = math.matrix([[Math.cos(rotY), 0, Math.sin(rotY)], [0, 1, 0], [-Math.sin(rotY), 0, Math.cos(rotY)]]);
  let matZ = math.matrix([[Math.cos(rotZ), -Math.sin(rotZ), 0], [Math.sin(rotZ), Math.cos(rotZ), 0], [0, 0, 1]]);
  return math.multiply(matZ, math.multiply(matY, matX));
}


/**
 * 求两向量之间的夹角。
 * @param vec1
 * @param vec2
 * @returns 夹角（弧度值）
 */
function getVecsAngle(vec1: number[], vec2: number[]): number {
  let cos = math.dot(vec1, vec2) / (<number>math.norm(vec1) * <number>math.norm(vec2));
  return math.acos(cos);
}


/**
 * 检测是否处于捏的动作状态。
 * @param landmarks 各关节点三维坐标
 * @returns 拇指指尖与食指指尖的相对距离
 */
function isPinching(landmarks: number[][]) {
  let distance = math.norm(math.subtract(landmarks[4], landmarks[8]) as number[]) as number;
  return distance < 0.08;
}


/**
 * 获取手的握紧程度
 * @param landmarks 
 * @returns 0~1，越小表示握的越紧
 */
function getGraspStrength(landmarks: number[][]) {
  let finger1_0 = math.subtract(landmarks[6], landmarks[5]) as number[];
  let finger1_1 = math.subtract(landmarks[7], landmarks[6]) as number[];
  let finger2_0 = math.subtract(landmarks[10], landmarks[9]) as number[];
  let finger2_1 = math.subtract(landmarks[11], landmarks[10]) as number[];
  let finger3_0 = math.subtract(landmarks[14], landmarks[13]) as number[];
  let finger3_1 = math.subtract(landmarks[15], landmarks[14]) as number[];
  let finger4_0 = math.subtract(landmarks[18], landmarks[17]) as number[];
  let finger4_1 = math.subtract(landmarks[19], landmarks[18]) as number[];
  let cos1 = math.divide(math.dot(finger1_0, finger1_1), <number>math.norm(finger1_0) * <number>math.norm(finger1_1));
  let cos2 = math.divide(math.dot(finger2_0, finger2_1), <number>math.norm(finger2_0) * <number>math.norm(finger2_1));
  let cos3 = math.divide(math.dot(finger3_0, finger3_1), <number>math.norm(finger3_0) * <number>math.norm(finger3_1));
  let cos4 = math.divide(math.dot(finger4_0, finger4_1), <number>math.norm(finger4_0) * <number>math.norm(finger4_1));
  console.log(math.max(cos1, cos2, cos3, cos4))
  return math.max(cos1, cos2, cos3, cos4);
}


export { OringinResults, RefinedResults, CurrentResults, testData, getAxes, getOrthJoints, getRotateMatrix, getVecsAngle, isPinching, getGraspStrength };