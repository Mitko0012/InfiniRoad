const divisionSize = 3.4/3;

function getPointOnQuadCurve(curve, point) {
    let ab = linearAlgebra.lerpVec2(curve[0], curve[1], point);
    let bc = linearAlgebra.lerpVec2(curve[1], curve[2], point);    
    return linearAlgebra.lerpVec2(ab, bc, point);
}

function getPointOnCubicCurve(curve, point) {
    let ab = linearAlgebra.lerpVec2(curve[0], curve[1], point);
    let bc = linearAlgebra.lerpVec2(curve[1], curve[2], point);    
    let cd = linearAlgebra.lerpVec2(curve[2], curve[3], point);
    let ab_bc = linearAlgebra.lerpVec2(ab, bc, point);
    let bc_cd = linearAlgebra.lerpVec2(bc, cd, point);
    return linearAlgebra.lerpVec2(ab_bc, bc_cd, point);
}

function createSpline(curves) {
    let start = curves[0].shift();
    let segments = [];
    for(let i = 0; i < curves.length; i++) {
        let currentSegment = curves[i];
        segments.push(currentSegment);
    }
    return {
        start,
        segments
    };
}

function getPointOnSpline(spline, point, locationIndex) {
    let start = [locationIndex === 0? spline.start : spline.segments[locationIndex - 1][spline.segments[locationIndex - 1].length - 1]];
    let segment = spline.segments[locationIndex];
    let arr = start.concat(segment);
    switch(arr.length) {
        case 3:
            return getPointOnQuadCurve(arr, point)
        case 4:
            return getPointOnCubicCurve(arr, point)
    }
}

function pathFromSpline(spline, divisionsInSegment) {
    let divisions = [];
    let lengths = [];
    let currentIndex = 0;
    for(let i = 0; i < spline.segments.length; i++) {
        let increment = 1 / divisionsInSegment;
        for(let j = 1; j <= divisionsInSegment; j++) {
            divisions.push(getPointOnSpline(spline, increment * j > 1 ? 1 : increment * j, i));
            lengths.push(linearAlgebra.getVectorMagnitudeVec2([divisions[divisions.length - 1][0] - (divisions[divisions.length - 2] === undefined ? spline.start[0] : divisions[divisions.length - 2][0]), divisions[divisions.length - 1][1] - (divisions[divisions.length - 2] === undefined? spline.start[1] : divisions[divisions.length - 2][1])]));
        }
    }
    return {
        start: spline.start,
        divisions,
        lengths
    };
}

function pointOnPath(path, index) {
    let acc = index;
    let i = 0;
    let start;
    let end;
    let toMove;
    while(true) {
        if(acc - path.lengths[i] < 0) {
            start = i === 0 ? path.start : path.divisions[i - 1];
            end = path.divisions[i];
            break;
        }
        acc -= path.lengths[i];
        i++;
        if(i === path.divisions.length)
            return path.divisions[-1];
    }
    toMove = acc / path.lengths[i];
    return linearAlgebra.lerpVec2(start, end, toMove);
}

function evenPath(path) {
    let totalLength = path.lengths.reduce((acc, next) => acc + next, 0);
    let divisions = [];
    let lengths = [];
    let currPoint = 0;
    while(true) {
        divisions.push(pointOnPath(path, currPoint));
        lengths.push(divisionSize)
        currPoint += divisionSize;
        if(currPoint >= totalLength) {
            divisions.push([path.divisions[path.divisions.length - 1][0], path.divisions[path.divisions.length - 1][1]]);
            lengths.push(linearAlgebra.getVectorMagnitudeVec2([path.divisions[path.divisions.length - 1][0] - (path.divisions[path.divisions.length - 2] === undefined ? path.start[0] : divisions[divisions.length - 2][0]), divisions[divisions.length - 1][1] - (divisions[divisions.length - 2] === undefined? path.start[1] : divisions[divisions.length - 2][1])]));
            break;
        }
    }
    return {
        divisions,
        lengths
    };
}