let roadChunks;
const minX = -8;
const maxX = 8;
const minZ = -8;
const maxZ = 8;
const divisionsInSplineSegment = 30; 
const axes = Object.freeze({
    UP: {index: 0, minX: -3, maxX: 3, minZ: -8, maxZ: -8},
    DOWN: {index: 1, minX: -3, maxX: 3, minZ: 8, maxZ: 8},
    LEFT: {index: 2, minX: -8, maxX: -8, minZ: -3, maxZ: 3},
    RIGHT: {index: 3, minX: 8, maxX: 8, minZ: -3, maxZ: 3}
});
const axesList = [
    axes.UP,
    axes.DOWN,
    axes.LEFT,
    axes.RIGHT
];

const roadPointTypes = Object.freeze({
    nextChunkTerminating: 0,
    middlePoint: 1,
    interchangeTerminating: 2,
    sameChunkTerminating: 3
});

let tileTypes = Object.freeze({
    STRAIGHT: {
        index: 0,
        probability: 0,
        check(outputNeighbours, undefinedNeighbours) {
            if(outputNeighbours.length === 2)
                return true;
            else if(outputNeighbours.length < 2 && undefinedNeighbours.length + outputNeighbours.length >= 2)
                return true;
            else
                return false;
        },
        generatePoints(chunk, outputNeighbours, undefinedNeighbours) {
            let input;
            let output;
            if(outputNeighbours.length === 2) {
                input = outputNeighbours[0].value.pointData[getTop(outputNeighbours[0].axis).index];
                let direction = outputNeighbours[1].axis;
                let posX;
                let posZ;
                if(outputNeighbours[0].axis.maxX == outputNeighbours[0].axis.minX) {
                    posX = outputNeighbours[0].axis.maxX;
                    posZ = outputNeighbours[0].value.pointData[getTop(outputNeighbours[0].axis).index].posZ;
                }
                else {
                    posX = outputNeighbours[0].value.pointData[getTop(outputNeighbours[0].axis).index].posX;
                    posZ = outputNeighbours[0].axis.maxZ;
                }
                input = {posX, posZ};
                let outX;
                let outZ;
                if(direction.maxX == direction.minX) {
                    outX = direction.maxX;
                    outZ = outputNeighbours[1].value.pointData[getTop(outputNeighbours[1].axis).index].posZ;
                }
                else {
                    outX = outputNeighbours[1].value.pointData[getTop(outputNeighbours[1].axis).index].posX;
                    outZ = direction.maxZ;
                }
                output = {posX: outX, posZ: outZ};
                chunk.pointData[outputNeighbours[0].axis.index] = input;
                chunk.pointData[direction.index] = output;
            }
            else if(outputNeighbours.length === 1) {
                input = outputNeighbours[0].value.pointData[getTop(outputNeighbours[0].axis).index];
                let inX;
                let inZ;
                if(outputNeighbours[0].axis.maxX == outputNeighbours[0].axis.minX) {
                    inX = outputNeighbours[0].axis.maxX;
                    inZ = outputNeighbours[0].value.pointData[getTop(outputNeighbours[0].axis).index].posZ;
                }
                else {
                    inX = outputNeighbours[0].value.pointData[getTop(outputNeighbours[0].axis).index].posX;
                    inZ = outputNeighbours[0].axis.maxZ;
                }
                input = {posX: inX, posZ: inZ};
                let originDirection = outputNeighbours[0].axis;
                let destinationDirection;
                let validIndices = [];
                for(let element of undefinedNeighbours) {
                    switch(element.axis) {
                        case getLeft(originDirection):
                            validIndices.push(0);
                            continue;
                        case getTop(originDirection):
                            validIndices.push(1);
                            continue;
                        case getRight(originDirection):
                            validIndices.push(2);
                    }
                }
                let directionIndex = Math.round(Math.random() * (validIndices.length - 1));
                switch(validIndices[directionIndex]) {
                    case 0:
                        destinationDirection = getLeft(originDirection);
                        break;
                    case 1:
                        destinationDirection = getTop(originDirection);
                        break;
                    case 2:
                        destinationDirection = getRight(originDirection);
                        break;
                }
                let posX = Math.random() * (destinationDirection.maxX - destinationDirection.minX) + destinationDirection.minX;
                let posZ = Math.random() * (destinationDirection.maxZ - destinationDirection.minZ) + destinationDirection.minZ;
                output = {posX, posZ};
                chunk.pointData[outputNeighbours[0].axis.index] = input;
                chunk.pointData[destinationDirection.index] = output;
            }
            else if(undefinedNeighbours.length >= 2) {
                let originIndex = Math.round(Math.random() * (undefinedNeighbours.length - 1));
                let inputValue = undefinedNeighbours[originIndex];
                let originDirection = inputValue.axis;
                let originX = Math.random() * (originDirection.maxX - originDirection.minX) + originDirection.minX;
                let originZ = Math.random() * (originDirection.maxZ - originDirection.minZ) + originDirection.minZ;
                input = {posX: originX, posZ: originZ};
                let validIndices = [];
                for(let element of undefinedNeighbours) {
                    switch(element.axis) {
                        case getLeft(originDirection):
                            validIndices.push(0);
                            continue;
                        case getTop(originDirection):
                            validIndices.push(1);
                            continue;
                        case getRight(originDirection):
                            validIndices.push(2);
                            break;
                        case originDirection:
                            continue;
                    }
                }
                let directionIndex = Math.round(Math.random() * (validIndices.length - 1));
                let destinationDirection;
                switch(validIndices[directionIndex]) {
                    case 0:
                        destinationDirection = getLeft(originDirection);
                        break;
                    case 1:
                        destinationDirection = getTop(originDirection);
                        break;
                    case 2:
                        destinationDirection = getRight(originDirection);
                        break;
                }
                let posX = Math.random() * (destinationDirection.maxX - destinationDirection.minX) + destinationDirection.minX;
                let posZ = Math.random() * (destinationDirection.maxZ - destinationDirection.minZ) + destinationDirection.minZ;
                output = {posX, posZ};
                chunk.pointData[originDirection.index] = input;
                chunk.pointData[destinationDirection.index] = output;
            }
            chunk.hasInit = true;
            chunk.tileType = tileTypes.STRAIGHT.index;
            const edgeFarPoint = 6;
            const edgeNearPoint = 4;
            const regularRange = 3;
            let points = Object.values(chunk.pointData);
            let point1 = points[0];
            let point2 = points[1];
            let firstControlRange = [];
            if(point1.posX === maxX) {
                firstControlRange[0] = point1.posX - edgeFarPoint;
                firstControlRange[1] = point1.posX - edgeNearPoint;
            } else if(point1.posX === minX) {
                firstControlRange[0] = point1.posX + edgeNearPoint;
                firstControlRange[1] = point1.posX + edgeFarPoint;
            } else {
                firstControlRange[0] = point1.posX;
                firstControlRange[1] = point1.posX;
            }
            if(point1.posZ === maxZ) {
                firstControlRange[2] = point1.posZ - edgeFarPoint;
                firstControlRange[3] = point1.posZ - edgeNearPoint;
            } else if(point1.posZ === minZ) {
                firstControlRange[2] = point1.posZ + edgeNearPoint;
                firstControlRange[3] = point1.posZ + edgeFarPoint;
            } else {
                firstControlRange[2] = point1.posZ;
                firstControlRange[3] = point1.posZ;
            }
            let controlPoint1 = [];
            controlPoint1[0] = Math.random() * (firstControlRange[1] - firstControlRange[0]) + firstControlRange[0];
            controlPoint1[1] = Math.random() * (firstControlRange[3] - firstControlRange[2]) + firstControlRange[2];
            let secondControlRange = [];
            if(point2.posX === maxX) {
                secondControlRange[0] = point1.posX - edgeFarPoint;
                secondControlRange[1] = point1.posX - edgeNearPoint;
            } else if(point2.posX === minX) {
                secondControlRange[0] = point1.posX + edgeNearPoint;
                secondControlRange[1] = point1.posX + edgeFarPoint;
            } else {
                secondControlRange[0] = Math.max(point1.posX - regularRange, minX);
                secondControlRange[1] = Math.min(point1.posX + regularRange, maxX);
            }
            if(point2.posZ === maxZ) {
                secondControlRange[2] = point2.posZ - edgeFarPoint;
                secondControlRange[3] = point2.posZ - edgeNearPoint;
            } else if(point2.posZ === minZ) {
                secondControlRange[2] = point2.posZ + edgeNearPoint;
                firstControlRange[3] = point2.posZ + edgeFarPoint;
            } else {
                secondControlRange[2] = Math.max(point2.posZ - regularRange, minZ);
                secondControlRange[3] = Math.min(point2.posZ + regularRange, maxZ);
            }
            let controlPoint2 = [];
            controlPoint2[0] = Math.random() * (secondControlRange[1] - secondControlRange[0]) + secondControlRange[0];
            controlPoint2[1] = Math.random() * (secondControlRange[3] - secondControlRange[2]) + secondControlRange[2];
            chunk.splineData.splines = [];
            chunk.splineData.splines.push(createSpline([[[point1.posX, point1.posZ], controlPoint1, controlPoint2, [point2.posX, point2.posZ]]]));
        },
        generateSplineData(chunk) {
            let path = evenPath(pathFromSpline(chunk.splineData.splines[0], divisionsInSplineSegment));
            chunk.splineData.paths = [];
            chunk.splineData.paths[0] = path;
        },
        generateRoad(chunk) {
            chunk.roads = [];
            let totalLength = 0;
            let nextXOffset = 0;
            let nextZOffset = 0;
            if(minX - chunk.splineData.paths[0].divisions[0][0] < 0.001 && minX - chunk.splineData.paths[0].divisions[0][0] > -0.001)
                nextXOffset = -1;
            else if(maxX - chunk.splineData.paths[0].divisions[0][0] < 0.001 && maxX - chunk.splineData.paths[0].divisions[0][0] > -0.001)
                nextXOffset = 1;
            if(minZ - chunk.splineData.paths[0].divisions[0][1] < 0.001 && minZ - chunk.splineData.paths[0].divisions[0][1] > -0.001)
                nextZOffset = -1;
            else if(maxZ - chunk.splineData.paths[0].divisions[0][1] < 0.001 && maxZ - chunk.splineData.paths[0].divisions[0][1] > -0.001)
                nextZOffset = 1;
            chunk.roads.push({
                pointSegments: {},
                points: [{
                    type: roadPointTypes.nextChunkTerminating, 
                    posX: chunk.splineData.paths[0].divisions[0][0], 
                    posZ: chunk.splineData.paths[0].divisions[0][1],
                    nextIndex: 0,
                    nextChunkData: [
                        chunk.xCenter + nextXOffset,
                        chunk.zCenter + nextZOffset
                    ]
                }],
                takenSegments: [],
                totalLength
            })
            for(let i = 1; i < chunk.splineData.paths[0].divisions.length; i++) {
                if(i === chunk.splineData.paths[0].divisions.length - 1) {
                    let nextXOffset = 0;
                    let nextZOffset = 0;
                    if(minX - chunk.splineData.paths[0].divisions[i][0] < 0.001 && minX - chunk.splineData.paths[0].divisions[i][0] > -0.001)
                        nextXOffset = -1;
                    else if(maxX - chunk.splineData.paths[0].divisions[i][0] < 0.001 && maxX - chunk.splineData.paths[0].divisions[i][0] > -0.001)
                        nextXOffset = 1;
                    if(minZ - chunk.splineData.paths[0].divisions[i][1] < 0.001 && minZ - chunk.splineData.paths[0].divisions[i][1] > -0.001)
                        nextZOffset = -1;
                    else if(maxZ - chunk.splineData.paths[0].divisions[i][1] < 0.001 && maxZ - chunk.splineData.paths[0].divisions[i][1] > -0.001)
                        nextZOffset = 1;
                    chunk.roads[0].points.push({
                        type: roadPointTypes.nextChunkTerminating, 
                        posX: chunk.splineData.paths[0].divisions[i][0], 
                        posZ: chunk.splineData.paths[0].divisions[i][1],
                        prevIndex: i - 1,
                        nextChunkData: [
                            chunk.xCenter + nextXOffset,
                            chunk.zCenter + nextZOffset,
                        ]
                    });
                }
                else
                    chunk.roads[0].points.push({
                        type: roadPointTypes.middlePoint, 
                        posX: chunk.splineData.paths[0].divisions[i][0], 
                        posZ: chunk.splineData.paths[0].divisions[i][1],
                        prevIndex: i - 1,
                        nextIndex: i
                    });
                chunk.roads[0].pointSegments[i - 1] = {
                    length: chunk.splineData.paths[0].lengths[i],
                    index: i - 1
                }
                chunk.roads[0].totalLength += chunk.splineData.paths[0].lengths[i];
                chunk.roads[0].takenSegments.push({left: null, right: null});
            }
        }
    },
    NO_ROAD: {
        index: 1,
        probability: 1,
        check(outputNeighbours, undefinedNeighbours) {
            return outputNeighbours.length === 0;
        },
        generatePoints(chunk, outputNeighbours, undefinedNeighbours) {
            chunk.hasInit = true;
            chunk.tileType = tileTypes.NO_ROAD.index;
            chunk.splineData = {};
            chunk.splineData.splines = [];
            chunk.splineData.paths = [];
        },
        generateSplineData(chunk) { },
        generateRoad(chunk) { }
    },
    T_INTERSECTION: {
        index: 2,
        probability: 6,
        check(outputNeighbours, undefinedNeighbours) {
            return outputNeighbours.length === 3 || (outputNeighbours.length < 3 && outputNeighbours.length + undefinedNeighbours.length >= 3);
        },
        generatePoints(chunk, outputNeighbours, undefinedNeighbours) {
            if(outputNeighbours.length === 3) {
                chunk.pointData = {};
                for(let i = 0; i < 3; i++) {
                    let posX = outputNeighbours[i].value.pointData[getTop(outputNeighbours[i].axis).index].posX;
                    if(posX === getTop(outputNeighbours[i].axis).maxX || posX === getTop(outputNeighbours[i].axis).minX)
                        posX *= -1;
                    let posZ = outputNeighbours[i].value.pointData[getTop(outputNeighbours[i].axis).index].posZ;
                    if(posZ === getTop(outputNeighbours[i].axis).maxZ || posZ === getTop(outputNeighbours[i].axis).minZ)
                        posZ *= -1;
                    chunk.pointData[outputNeighbours[i].axis.index] = {posX, posZ};
                }
                chunk.hasInit = true;
                chunk.tileType = tileTypes.T_INTERSECTION.index;
            }
            else if(outputNeighbours.length + undefinedNeighbours.length >= 3) {
                for(let i = 0; i < outputNeighbours.length; i++) {
                    let posX = outputNeighbours[i].value.pointData[getTop(outputNeighbours[i].axis).index].posX;
                    if(posX === getTop(outputNeighbours[i].axis).maxX || posX === getTop(outputNeighbours[i].axis).minX)
                        posX *= -1;
                    let posZ = outputNeighbours[i].value.pointData[getTop(outputNeighbours[i].axis).index].posZ;
                    if(posZ === getTop(outputNeighbours[i].axis).maxZ || posZ === getTop(outputNeighbours[i].axis).minZ)
                        posZ *= -1;
                    chunk.pointData[outputNeighbours[i].axis.index] = {posX, posZ};
                }
                const undefinedSectionsToGet = 3 - outputNeighbours.length;
                for(let i = 0; i < undefinedSectionsToGet; i++) {
                    let freeNeighbours = [0, 1, 2, 3];
                    for(let neighbour of Object.values(chunk.pointData)) {
                        let newFreeNeighbours = [];
                        let elemAxis;
                        for(let axis of Object.values(axes)) {
                            if(neighbour.posX === axis.minX || neighbour.posX === axis.maxX || neighbour.posZ === axis.minZ || neighbour.posZ === axis.maxZ) {
                                elemAxis = axis;
                                break;
                            }
                        }
                        for(let element of freeNeighbours) {
                            if(element !== elemAxis.index)
                                newFreeNeighbours.push(element);
                            freeNeighbours = newFreeNeighbours;
                        }
                    }
                    let neighbourIndex = freeNeighbours[Math.round(Math.random() * freeNeighbours.length - 1)];
                    let neighbour = undefined;
                    while(neighbour === undefined) {
                        neighbour = undefinedNeighbours.reduce((acc, next) => {
                            if(next.axis.index === neighbourIndex)
                                return next;
                            else
                                return acc;
                        }, undefined);
                        neighbourIndex = freeNeighbours[Math.round(Math.random() * freeNeighbours.length - 1)];
                    }
                    let posX = Math.random() * (neighbour.axis.maxX - neighbour.axis.minX) + neighbour.axis.minX;
                    let posZ = Math.random() * (neighbour.axis.maxZ - neighbour.axis.minZ) + neighbour.axis.minZ;
                    chunk.pointData[neighbour.axis.index] = {posX, posZ};
                }
            }
            else {
                for(let i = 0; i < 3; i++) {
                    let freeNeighbours = [0, 1, 2, 3];
                    for(let neighbour of chunk.pointData) {
                        let newFreeNeighbours = [];
                        for(let element of freeNeighbours) {
                            if(element !== neighbour.axis.index)
                                newFreeNeighbours.push(element);
                            freeNeighbours = newFreeNeighbours;
                        }
                    }
                    let neighbourIndex = freeNeighbours[Math.round(Math.random() * freeNeighbours.length - 1)];
                    let neighbour = null;
                    while(neighbour === null) {
                        neighbour = undefinedNeighbours.reduce((acc, next) => {
                            if(next.axis.index === neighbourIndex)
                                return next;
                            else
                                return acc;
                        }, null);
                        neighbourIndex = freeNeighbours[Math.round(Math.random() * freeNeighbours.length - 1)];
                    }
                    let posX = Math.random() * (neighbour.axis.maxX - neighbour.axis.minX) + neighbour.axis.minX;
                    let posZ = Math.random() * (neighbour.axis.maxZ - neighbour.axis.minZ) + neighbour.axis.minZ;
                    chunk.pointData[neighbour.axis.index] = {posX, posZ};
                }
            }
            chunk.splineData = {};
            chunk.splineData.splines = [];
            chunk.splineData.paths = [];
            let xCenter = Math.random() * 2 - 1;
            let zCenter = Math.random() * 2 - 1;
            chunk.splineData.center = {
                posX: Math.random() * 6 + -3, 
                posZ: Math.random() * 6 + -3
            };
            chunk.hasInit = true;
            chunk.tileType = tileTypes.T_INTERSECTION.index;
            for(let point of Object.values(chunk.pointData)) {
                const distance = 6;
                let minXGen;
                let minZGen;
                let maxXGen;
                let maxZGen;
                if(point.posX === minX) {
                    minXGen = minX + distance;
                    maxXGen = chunk.splineData.center.posX - distance; 
                    minZGen = point.posZ;
                    maxZGen = point.posZ;
                }
                else if(point.posX === maxX) {
                    minXGen = chunk.splineData.center.posX + distance;
                    maxXGen = maxX - distance; 
                    minZGen = point.posZ;
                    maxZGen = point.posZ;
                }
                else if(point.posZ === minZ) {
                    minXGen = point.posX;
                    maxXGen = point.posX;
                    minZGen = minZ + distance;
                    maxZGen = chunk.splineData.center.posZ - distance; 
                }
                else if(point.posZ === maxZ) {
                    minXGen = point.posX;
                    maxXGen = point.posX;
                    minZGen = chunk.splineData.center.posZ + distance;
                    maxZGen = maxZ - distance;
                }
                let posX = Math.random() * (maxXGen - minXGen) + minXGen;
                let posZ = Math.random() * (maxZGen - minZGen) + minZGen;
                let xOffset = 0;
                let zOffset = 0;
                if(point.posX === minX)
                    xOffset = -1.7;
                if(point.posX === maxX)
                    xOffset = 1.7;
                if(point.posZ === minZ)
                    zOffset = -1.7;
                if(point.posZ === maxZ)
                    zOffset = 1.7;
                chunk.splineData.splines.push(createSpline([[[point.posX, point.posZ], [posX, posZ], [chunk.splineData.center.posX + xOffset, chunk.splineData.center.posZ + zOffset]]]))    
            }
        },
        generateSplineData(chunk) {
            for(let spline of chunk.splineData.splines) {
                let path = evenPath(pathFromSpline(spline, divisionsInSplineSegment));
                chunk.splineData.paths.push(path);
            }
        },
        generateRoad(chunk) {
            chunk.roads = [];
            chunk.interchangeRoads = [];
            let index = 0;
            for(let path of chunk.splineData.paths) {
                let totalLength = 0;
                let nextXOffset = 0;
                let nextZOffset = 0;
                if(minX - path.divisions[0][0] < 0.001 && minX - path.divisions[0][0] > -0.001)
                    nextXOffset = -1;
                else if(maxX - path.divisions[0][0] < 0.001 && maxX - path.divisions[0][0] > -0.001)
                    nextXOffset = 1;
                if(minZ - path.divisions[0][1] < 0.001 && minZ - path.divisions[0][1] > -0.001)
                    nextZOffset = -1;
                else if(maxZ - path.divisions[0][1] < 0.001 && maxZ - path.divisions[0][1] > -0.001)
                    nextZOffset = 1;
                chunk.roads.push({
                    pointSegments: {},
                    points: [{
                        type: roadPointTypes.nextChunkTerminating, 
                        posX: path.divisions[0][0], 
                        posZ: path.divisions[0][1],
                        nextIndex: 0,
                        nextChunkData: [
                            chunk.xCenter + nextXOffset,
                            chunk.zCenter + nextZOffset
                        ]
                    }],
                    takenSegments: [],
                    totalLength
                })
                for(let i = 1; i < path.divisions.length; i++) {
                    if(i === path.divisions.length - 1) {
                        chunk.roads[index].points.push({
                            type: roadPointTypes.interchangeTerminating, 
                            posX: path.divisions[i][0], 
                            posZ: path.divisions[i][1],
                            prevIndex: i - 1,
                            nextChunkData: [
                                chunk.xCenter + nextXOffset,
                                chunk.zCenter + nextZOffset
                            ]
                        });
                    }
                    else
                        chunk.roads[index].points.push({
                            type: roadPointTypes.middlePoint, 
                            posX: chunk.splineData.paths[index].divisions[i][0], 
                            posZ: chunk.splineData.paths[index].divisions[i][1],
                            prevIndex: i - 1,
                            nextIndex: i
                        });
                    chunk.roads[index].pointSegments[i - 1] = {
                        length: chunk.splineData.paths[index].lengths[i],
                        index: i - 1
                    }
                    chunk.roads[index].totalLength += chunk.splineData.paths[index].lengths[i];
                    chunk.roads[index].takenSegments.push({left: null, right: null});
                }
                index++;
            }
            let endPoints = chunk.roads.map((x) => x.points[x.points.length - 1]);
            let firstPoint = endPoints[0];
            let straightPoints = [];
            let sidePoint;
            for(let i = 1; i < endPoints.length; i++) {
                let currPoint = endPoints[i];
                if(linearAlgebra.getVectorMagnitudeVec2(linearAlgebra.getVector2(currPoint.posX - firstPoint.posX, currPoint.posZ - firstPoint.posZ)) - 3.4 < 0.001 &&
                linearAlgebra.getVectorMagnitudeVec2(linearAlgebra.getVector2(currPoint.posX - firstPoint.posX, currPoint.posZ - firstPoint.posZ)) - 3.4 > -0.001) {
                    straightPoints.push(firstPoint);
                    straightPoints.push(currPoint);
                    sidePoint = i === 2? endPoints[1] : endPoints[2];
                    break;
                }
            }
            if(sidePoint === undefined) {
                straightPoints.push(endPoints[1]);
                straightPoints.push(endPoints[2]);
                sidePoint = firstPoint;
            }
            let sideVec = linearAlgebra.getVector2(sidePoint.posX - chunk.splineData.center.posX, sidePoint.posZ - chunk.splineData.center.posZ);
            sideVec = linearAlgebra.normalizeVec2(sideVec);
            let angle = Math.atan2(-sideVec[1], sideVec[0]);
            chunk.interchange = {
                type: T_INTERSECTION,
                angle
            };
            chunk.edgePoints = [];
            let interchangeMat = linearAlgebra.rotateAroundY(chunk.interchange.angle);
            index = 0;
            let nonPriorityIndex = Math.round(Math.random() * 2);
            while(true) {
                chunk.interchangeRoads.push([]);
                chunk.edgePoints.push([T_INTERSECTION["road" + String(index)].entryPoint[0], T_INTERSECTION["road" + String(index)].entryPoint[1]]);
                let vectorRotate = linearAlgebra.getVector4(chunk.edgePoints[index][0], 0, chunk.edgePoints[index][1], 0);
                vectorRotate = linearAlgebra.multiplyMatrixAndVector(linearAlgebra.rotateAroundY(angle), vectorRotate);
                chunk.edgePoints[index][0] = vectorRotate[0];
                chunk.edgePoints[index][1] = vectorRotate[1];
                chunk.edgePoints[index][0] += chunk.splineData.center.posX;
                chunk.edgePoints[index][1] += chunk.splineData.center.posZ;
                if(index === nonPriorityIndex)
                    chunk.nonPriorityPoint = [chunk.edgePoints[index][0], chunk.edgePoints[index][1]];
                for(let contiuningDirection = 0; contiuningDirection < chunk.interchange.type.options; contiuningDirection++) {
                    if(index === 0 && contiuningDirection === 1) {
                        console.log("debugica");
                    }
                    let reconstructedRoad = {
                        pointSegments: {},
                        points: [],
                        takenSegments: [],
                        totalLength: 0
                    };
                    let roadData = chunk.interchange.type["road" + String(index)];
                    let pointDatas = [];
                    pointDatas.push(roadData.entryPoint);
                    pointDatas.push(roadData.decidingPoint);
                    pointDatas.push(roadData[contiuningDirection]);
                    pointDatas.push(chunk.interchange.type["road" + String(roadData["index" + String(contiuningDirection)])].exitPoint);
                    let pointIndex = 0;
                    for(let point of pointDatas) {
                        let appliedPoint = linearAlgebra.multiplyMatrixAndVector(interchangeMat, linearAlgebra.getVector4(point[0], 0, point[1], 0));
                        reconstructedRoad.points.push({
                            posX: appliedPoint[0] + chunk.splineData.center.posX,
                            posZ: appliedPoint[2] + chunk.splineData.center.posZ,
                        });
                        if(pointIndex > 0)
                            reconstructedRoad.points[pointIndex].prevIndex = pointIndex - 1;
                        if(pointIndex < pointDatas.length - 1) {
                            reconstructedRoad.points[pointIndex].nextIndex = pointIndex;
                            reconstructedRoad.points[pointIndex].type = roadPointTypes.middlePoint;
                        }
                        else {
                            reconstructedRoad.points[pointIndex].type = roadPointTypes.sameChunkTerminating;
                        }
                        pointIndex++;
                    }
                    for(let i = 0; i < reconstructedRoad.points.length - 1; i++) {
                        reconstructedRoad.pointSegments[i] = {
                            length: linearAlgebra.getVectorMagnitudeVec2(linearAlgebra.getVector2(
                                reconstructedRoad.points[i + 1].posX - reconstructedRoad.points[i].posX,
                                reconstructedRoad.points[i + 1].posZ - reconstructedRoad.points[i].posZ,
                            )),
                            index: i
                        }
                        reconstructedRoad.totalLength += reconstructedRoad.pointSegments[i].length;
                        reconstructedRoad.takenSegments.push({left: null, right: null});
                    }
                    chunk.interchangeRoads[index].push(reconstructedRoad);
                }
                chunk.noPriority = Math.round(Math.random() * 2);
                index++;
                if(index === chunk.interchange.type.roadsCount)
                    break;
            }
        }
    }
});

const tileTypesList = Object.freeze([tileTypes.STRAIGHT, tileTypes.NO_ROAD, tileTypes.T_INTERSECTION]);

function getLeft(axis) {
    switch(axis) {
        case axes.UP:
            return axes.RIGHT;
        case axes.DOWN:
            return axes.LEFT;
        case axes.LEFT:
            return axes.UP;
        case axes.RIGHT:
            return axes.DOWN;
    }
}
function getRight(axis) {
    switch(axis) {
        case axes.UP:
            return axes.LEFT;
        case axes.DOWN:
            return axes.RIGHT;
        case axes.LEFT:
            return axes.DOWN;
        case axes.RIGHT:
            return axes.UP;
    }
}
function getTop(axis) {
    switch(axis) {
        case axes.UP:
            return axes.DOWN;
        case axes.DOWN:
            return axes.UP;
        case axes.LEFT:
            return axes.RIGHT;
        case axes.RIGHT:
            return axes.LEFT;
    }
}


function generateChunkData() {

}

function collapseChunks(chunkPass) {
    let chunkData = {};
    for(let chunk of chunkPass)
        chunkData[String(chunk.xCenter) + " " + String(chunk.zCenter)] = determineValues(chunk);
    let values = Object.values(chunkData).sort((a, b) => a.possibleTiles.length - b.possibleTiles.length);
    let savedValues = Object.values(chunkData).sort((a, b) => a.possibleTiles.length - b.possibleTiles.length);
    for(let i = 0; i < values.length; i++) {
        let tileValueLength = values[i].possibleTiles.reduce((acc, next) => acc + next, 0);
        let tileIndex;
        let currentTileValue = 0;
        let tileValue = Math.round(Math.random() * tileValueLength);
        if(values[i].possibleTiles.length === 0)
            continue;
        for(let j = 0; j < values[i].possibleTiles.length; j++) {
            currentTileValue += tileTypesList[values[i].possibleTiles[j]].probability;
            if(currentTileValue >= tileValue) {
                tileIndex = values[i].possibleTiles[j];
                break;
            }
        }
        switch(tileIndex) {
            case 0:
                tileTypes.STRAIGHT.generatePoints(values[i].chunk, values[i].neighboursWithOutputs, values[i].undefinedNeighbours)
                break;
            case 1:
                tileTypes.NO_ROAD.generatePoints(values[i].chunk, values[i].neighboursWithOutputs, values[i].undefinedNeighbours)
                break;
            case 2:
                tileTypes.T_INTERSECTION.generatePoints(values[i].chunk, values[i].neighboursWithOutputs, values[i].undefinedNeighbours)
                break;
        }
        for(let neighbourData of values[i].neighbours) {
            if(neighbourData === undefined || neighbourData.value === undefined)
                continue;
            let updatedNeighbourValue = chunks[String(neighbourData.value.xCenter) + " " + String(neighbourData.value.zCenter)];
            if(updatedNeighbourValue === undefined || updatedNeighbourValue.hasInit)
                continue;
            chunkData[String(updatedNeighbourValue.xCenter) + " " + String(updatedNeighbourValue.zCenter)] = determineValues(updatedNeighbourValue);
        }
        delete chunkData[String(values[i].chunk.xCenter) + " " + String(values[i].chunk.zCenter)];
        values = Object.values(chunkData).sort((a, b) => a.possibleTiles.length - b.possibleTiles.length);
        i = -1;
    }
}

function determineValues(chunk) {
    let neighbours = [];
    let undefinedNeighbours = [];
    let neighboursWithOutputs = [];
    let possibleTiles = [];
    neighbours.push({value: chunks[String(chunk.xCenter) + " " + String(chunk.zCenter + 1)], axis: axes.DOWN});
    neighbours.push({value: chunks[String(chunk.xCenter) + " " + String(chunk.zCenter - 1)], axis: axes.UP});
    neighbours.push({value: chunks[String(chunk.xCenter - 1) + " " + String(chunk.zCenter)], axis: axes.LEFT});
    neighbours.push({value: chunks[String(chunk.xCenter + 1) + " " + String(chunk.zCenter)], axis: axes.RIGHT});

    neighbours.forEach(element => {
        if(element.value === undefined || element.value.hasInit === false)
            undefinedNeighbours.push(element);
        else if(element.value.pointData[getTop(element.axis).index] !== undefined)
            neighboursWithOutputs.push(element);
    });
    for(let tileType of Object.values(tileTypes)) {
        if(tileType.check(neighboursWithOutputs, undefinedNeighbours))
            possibleTiles.push(tileType.index);;
    }
    return {
        chunk, undefinedNeighbours, neighboursWithOutputs, possibleTiles, neighbours
    };
}

function equalFloatNumbers(a, b) {
    return a - b > -0.001 && a - b < 0.001; 
}