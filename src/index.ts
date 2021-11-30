// import * as math from "../public/math.min";
import * as math from "mathjs";

function norm_vec<T extends math.Matrix | math.MathArray>(v1: T, v2: T): T{
    var mat = math.cross(v1, v2);
    var den = math.norm(mat);
    return math.divide(mat, den) as T; 
}

function get_orth_joints(data: number[][], std = [0,5,17]): math.Matrix{
    var numJoints: number = data.length;
    // 掌心的三个关节作为基准点
    var [p1, p2, p3]: [number[], number[], number[]] = [data[std[0]], data[std[1]], data[std[2]]];
    // 平移矩阵T
    var T: math.Matrix = math.matrix([[1,0,0,-p1[0]], [0,1,0,-p1[1]], [0,0,1,-p1[2]], [0,0,0,1]]);
    
    // 计算以基准点构建的局部坐标系
    var vec13: number[] = math.subtract(p3, p1) as number[];
    var vy: number[] = math.divide(vec13, math.norm(vec13) as number + 1e-6) as number[];
    var vz: number[] = norm_vec(math.subtract(p2, p1) as number[], vy);
    var vx: number[] = norm_vec(vy, vz);

    // 求将局部坐标系旋转到与世界坐标系 z 轴重合的旋转矩阵 R1
    var uz: number[] = vz;
    var uy: number[] = norm_vec(vz, [1,0,0]);
    var ux: number[] = math.cross(uy, uz) as number[];
    var R1: math.Matrix = math.matrix([ux.concat([0]), uy.concat([0]), uz.concat([0]), [0,0,0,1]]);
    
    // 求将局部坐标系绕 z 轴旋转到与世界坐标系 x,y 轴重合的旋转矩阵 R2
    vx = math.multiply(R1, vx.concat([1])) as unknown as number[];
    var cos: number = vx[0];
    var sin: number = (math.cross(math.resize(vx, [3]) as number[], [1,0,0]) as number[])[2] > 0 ? -vx[1] : vx[1];
    var R2: math.Matrix = math.matrix([[cos,-sin,0,0], [sin,cos,0,0], [0,0,1,0], [0,0,0,1]]);

    // 合并 R2、R1、T 得到变换矩阵
    var tran: math.Matrix = math.multiply(math.multiply(R2, R1), T);
    // 计算变换坐标系后的关节点坐标
    var forthCol: number[] = math.ones(numJoints, 1) as number[];
    var joints: math.Matrix = math.transpose(math.concat(data, forthCol, 1)) as math.Matrix;
    var orthJoints: math.Matrix = math.transpose(math.multiply(tran, joints));

    return orthJoints;
}

// let data: number[][] = math.random([21, 3]) as unknown as number[][];
// let res: math.Matrix = get_orth_joints(data);
// console.log(res);

function download(filename: string, content:string, contentType?:string) {
    if (!contentType) contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content]);
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}