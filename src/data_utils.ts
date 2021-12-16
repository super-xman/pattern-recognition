import * as math from "mathjs";

const REFERENCE = [0, 5, 17] //基准参考系

const testData: RefinedResults = {
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
 * @param refer 由三点确定的基准参考系
 * @returns 变换坐标系后的各关节点三维坐标
 */
function getOrthJoints(data: number[][], refer = REFERENCE): number[][] {
  var numJoints: number = data.length;
  // 掌心的三个关节作为基准点
  var [p1, p2, p3]: [number[], number[], number[]] = [data[refer[0]], data[refer[1]], data[refer[2]]];
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
  vx = math.multiply(R1, vx.concat([1])).toArray() as number[];
  var cos: number = vx[0];
  var sin: number = (math.cross(math.resize(vx, [3]) as number[], [1, 0, 0]) as number[])[2] > 0 ? -vx[1] : vx[1];
  var R2: math.Matrix = math.matrix([[cos, -sin, 0, 0], [sin, cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);

  // 合并 R2、R1、T 得到变换矩阵
  var tran: math.Matrix = math.multiply(math.multiply(R2, R1), T);
  // 计算变换坐标系后的关节点坐标
  var forthCol: number[] = math.ones(numJoints, 1) as number[];
  var joints: math.Matrix = math.transpose(math.concat(data, forthCol, 1)) as math.Matrix;
  var orthJoints: number[][] = math.transpose(math.multiply(tran, joints)).toArray() as number[][];

  return orthJoints;
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
 * 获取正则化后的左右手手掌关节坐标。
 * @param landmarks 各关节点三维坐标
 * @param palmJoints 组成手掌的关节的索引
 * @param isLeft 是否为左手
 * @param scale 缩放系数
 * @returns 正则化的手掌关节坐标，下标1为左手，下标2为右手
 */
function getPalmOrthJoints(landmarks: number[][], palmJoints: number[], isLeft: boolean, scale = 1): number[][][] {
  var handJointsLandmarks: number[][] = getOrthJoints(landmarks);
  var palmJointsLandmarks1: number[][] = palmJoints.map((joint) => math.multiply(handJointsLandmarks[joint], scale));
  var palmJointsLandmarks2: number[][] = palmJointsLandmarks1.map((landmark) => [-landmark[0], landmark[1], landmark[2]]); // x镜像
  return isLeft ? [palmJointsLandmarks1, palmJointsLandmarks2] : [palmJointsLandmarks2, palmJointsLandmarks1];
}


export { OringinResults, RefinedResults, CurrentResults, getBonesLength, getPalmOrthJoints, testData };