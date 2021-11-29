// import * as math from "../public/math.min";
import * as math from "mathjs";

type MathArray = number[] | math.Matrix;
type MathMatrix = number[][] | math.Matrix;

function norm_vec<T extends MathArray>(v1: T, v2: T): T{
    var mat = math.cross(v1, v2);
    var den = math.norm(mat);
    return math.divide(mat, den) as T; 
}

function get_orth_joints<T extends number[][]>(data: T, std = [0,5,17]): number[][]{
    var numJoints: number = (math.size(data) as number[])[0];
    var [p1, p2, p3]: [number[], number[], number[]] = [data[std[0]], data[std[1]], data[std[2]]];
    var matT: MathMatrix = math.matrix([[1,0,0,-p1[0]], [0,1,0,-p1[1]], [0,0,1,-p1[2]], [0,0,0,1]]);
    
    var vec13: MathArray = math.subtract(p3, p1) as MathArray;
    var vy: MathArray = math.divide(vec13, math.norm(vec13) as number + 1e-6) as MathArray;
    var _vx: MathArray = math.subtract(p2, p1) as MathArray;
    var vz: MathArray = norm_vec(_vx, vy);
    var vx: MathArray = norm_vec(vy, vz);

    var uz: MathArray = vz;
    var uy: MathArray = norm_vec(vz, [1,0,0]);
    var ux: MathArray = math.cross(uy, uz) as MathArray;
    var R1: MathMatrix = [math.concat(ux, [0]), math.concat(uy, [0]), math.concat(uz, [0]), [0,0,0,1]] as MathMatrix;

    vx = math.multiply(R1, math.concat(vx, [1])) as unknown as number[];
    var cos: number = vx[0];
    var sin: number = (math.cross(math.resize(vx, [3]) as number[], [1,0,0]) as number[])[2] > 0 ? -vx[1] : vx[1];
    var R2: MathMatrix = math.matrix([[cos,-sin,0,0], [sin,cos,0,0], [0,0,1,0], [0,0,0,1]]);
    var tran = math.multiply(math.multiply(R2, R1), matT);

    var forthCol = math.ones(numJoints, 1);
    var joints = math.transpose(math.concat(data, forthCol, 1));
    var orthJoints = math.transpose(math.multiply(tran, joints));

    return orthJoints as unknown as number[][];
}

function download(filename: string, content:string, contentType?:string) {
    if (!contentType) contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content]);
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}