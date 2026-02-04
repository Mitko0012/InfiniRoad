const maxSpeed = 8;
const minSpeed = 2;
const backDist = 1;
const minSafeDist = 7;
const minVisibleDist = 5;
const minAllowedDivergion = 0.4;
const tolerance = 3;
const carLength = 2;
const lookForward = 1.4;
let carMesh;
let carTexture;
let carShaderProgram;

class NpcCar {
    constructor(chunk, road, posOnRoad, facing, speed) {
        this.roadHistory = [];
        this.currRoad = road;
        this.currChunk = chunk;
        this.roadHistory.push(road);
        this.facing = facing;
        if(road === undefined)
            console.log("6u6mar");
        this.currPoint = walkOnRoad(road, posOnRoad, facing);
        this.pointIndex = posOnRoad;
        this.isActive = true;
        let pv = this.getPerpDirVec();
        this.perpVec = pv.perp;
        this.dirVec = pv.dir;
        this.speed = speed;
        this.roadHistory = [road];
        this.number = null;
    }

    getPerpDirVec() {
        let start;
        let end;
        let startRoad = this.currRoad;
        let endRoad = this.currRoad;
        let startFacing = this.facing;
        let endFacing = this.facing;
        let startChunk = this.currChunk;
        let endChunk = this.currChunk;
        if(this.pointIndex - lookForward < 0 || this.pointIndex + lookForward > this.currRoad.totalLength - 0.01) {
            let endPoint;
            if(this.pointIndex - lookForward < 0)
                if(this.facing)
                    endPoint = this.currRoad.points[0];
                else
                    endPoint = this.currRoad.points[this.currRoad.points.length - 1];
            else
                if(this.facing)
                    endPoint = this.currRoad.points[this.currRoad.points.length - 1];
                else
                    endPoint = this.currRoad.points[0];
            switch(endPoint.type) {
                case roadPointTypes.nextChunkTerminating: 
                    let toMoveX = 0;
                    let toMoveZ = 0;
                    if(equalFloatNumbers(endPoint.posX, minX))
                        toMoveX = -1;
                    if(equalFloatNumbers(endPoint.posX, maxX))
                        toMoveX = 1;
                    if(equalFloatNumbers(endPoint.posZ, minZ))
                        toMoveZ = -1;
                    if(equalFloatNumbers(endPoint.posZ, maxZ))
                        toMoveZ = 1;
                    let nextChunk = chunks[String(this.currChunk.xCenter + toMoveX) + " " + String(this.currChunk.zCenter + toMoveZ)];
                    if(nextChunk === undefined || nextChunk.isActive === false) {
                        if(this.pointIndex - lookForward < 0) {
                            end = 0;
                            start = lookForward * 2;
                        }
                        else {
                            end = this.currRoad.totalLength - 0.01;
                            start = this.currRoad.totalLength - lookForward * 2;
                        }
                        break;
                    }
                    for(let road of nextChunk.roads) {
                        let endPoints = [
                            road.points[0],
                            road.points[road.points.length - 1]
                        ];
                        let index = 0;
                        let foundRoad = false;
                        for(let point of endPoints) {
                            if((equalFloatNumbers(point.posX, endPoint.posX) && (
                                (equalFloatNumbers(point.posZ, minZ) && equalFloatNumbers(endPoint.posZ, maxZ))
                                || (equalFloatNumbers(point.posZ, maxZ) && equalFloatNumbers(endPoint.posZ, minZ))))
                            || (equalFloatNumbers(point.posZ, endPoint.posZ) && (
                                (equalFloatNumbers(point.posX, minX) && equalFloatNumbers(endPoint.posX, maxX))
                                || (equalFloatNumbers(point.posX, maxX) && equalFloatNumbers(endPoint.posX, minX))))) {
                                    if(this.pointIndex - lookForward < 0) {
                                        foundRoad = true;
                                        startRoad = road;
                                        start = lookForward - this.pointIndex;
                                        startChunk = nextChunk;
                                        end = this.pointIndex + lookForward;
                                        if(index === 0)
                                            startFacing = true;
                                        else
                                            startFacing = false;
                                    }
                                    else {
                                        foundRoad = true;
                                        endRoad = road;
                                        start = this.pointIndex - lookForward;
                                        endChunk = nextChunk;
                                        end = lookForward - (this.currRoad.totalLength - this.pointIndex);
                                        if(index === 0)
                                            endFacing = true;
                                        else
                                            endFacing = false;
                                    }
                                    break;
                                }
                            index++;
                        }
                    }
                    break;
                    case roadPointTypes.interchangeTerminating:
                        for(let roadGroup of this.currChunk.interchangeRoads) {
                            let startPoint = roadGroup[0].points[0];
                            if(equalFloatNumbers(endPoint.posX, startPoint.posX) && equalFloatNumbers(endPoint.posZ, startPoint.posZ)) {
                                if(this.direction === null || this.direction === undefined)
                                    this.direction = Math.round(Math.random());
                                let nextRoad = roadGroup[this.direction];
                                if(this.pointIndex - lookForward < 0) {
                                    if(this.roadHistory.length > 1) {
                                        startRoad = this.roadHistory[this.roadHistory.length - 2];
                                        start = lookForward - this.pointIndex;
                                        end = this.pointIndex + lookForward;
                                        startFacing = false;
                                    }
                                    else {
                                        start = this.pointIndex;
                                        end = this.pointIndex + lookForward;
                                    }
                                }
                                else {
                                    endRoad = nextRoad;
                                    start = this.pointIndex - lookForward;
                                    end = lookForward - (this.currRoad.totalLength - this.pointIndex);
                                    endFacing = true;
                                }
                                break;
                            } 
                        }
                        break;
                    case roadPointTypes.sameChunkTerminating:
                        for(let road of this.currChunk.roads) {
                            let contEndPoint = road.points[road.points.length - 1];
                            if(equalFloatNumbers(contEndPoint.posX, endPoint.posX) && equalFloatNumbers(contEndPoint.posZ, endPoint.posZ)) {
                                if(this.pointIndex - lookForward < 0) {
                                    startRoad = road;
                                    start = lookForward - this.pointIndex;
                                    end = this.pointIndex + lookForward;
                                    startFacing = false;
                                }
                                else {
                                    endRoad = road;
                                    start = this.pointIndex -lookForward;
                                    end = lookForward - (this.currRoad.totalLength - this.pointIndex);
                                    endFacing = false;
                                }
                            }
                        }
                        break;
                    default:
                        if(this.pointIndex -lookForward < 0) {
                            end = 2.6;
                            start = 0;
                        }
                        else {
                            end = this.currRoad.totalLength - 0.01;
                            start = this.currRoad.totalLength - lookForward * 2;
                            end = this.currRoad.totalLength - 0.01;
                            start = this.currRoad.totalLength - lookForward * 2;
                        }
                }
        }
        else {
            start = this.pointIndex - lookForward;
            end = this.pointIndex + lookForward;
        }
        if(startRoad === undefined)
            console.log("6u6mar");
        if(endRoad === undefined)
            console.log("6u6mar");
        let startPoint = walkOnRoad(startRoad, start, startFacing);
        let endPoint = walkOnRoad(endRoad, end, endFacing);
        endPoint.point[0] += endChunk.xCenter * 16;
        endPoint.point[1] += endChunk.zCenter * 16;
        startPoint.point[0] += startChunk.xCenter * 16;
        startPoint.point[1] += startChunk.zCenter * 16;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        return {
            perp: linearAlgebra.scaleVector(linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-(endPoint.point[1] - startPoint.point[1]), endPoint.point[0] - startPoint.point[0])), 0.6),
            dir: linearAlgebra.normalizeVec2(linearAlgebra.getVector2((endPoint.point[0] - startPoint.point[0]), (endPoint.point[1] - startPoint.point[1])))
        }; 
    }

    update() {
        let freeDist = this.index === undefined? minSafeDist : this.checkFree(this.index);
        let vel = maxSpeed * (freeDist / minSafeDist);
        vel = Math.min(vel, this.speed);
        this.pointIndex += (vel * 0.02);
        if(this.currRoad === undefined)
            console.log("6u6mar");
        let point = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
        if(point.lengthTaken !== undefined) {
            let edgePoint = this.currRoad.points[this.facing ? this.currRoad.points.length - 1 : 0];
            let pv;
            switch(edgePoint.type) {
                case roadPointTypes.nextChunkTerminating:
                    let nextChunk = chunks[String(edgePoint.nextChunkData[0]) + " " + String(edgePoint.nextChunkData[1])];
                    if(nextChunk !== undefined && nextChunk.geometry !== null && nextChunk.isActive) {
                        this.currChunk = nextChunk;
                        for(let road of nextChunk.roads) {
                            let startPoint = road.points[0];
                            let endPoint = road.points[road.points.length - 1];  
                            if(
                                ((startPoint.posX - minX < 0.001 && startPoint.posX - minX > -0.001) &&
                                (edgePoint.posX - maxX < 0.001 && edgePoint.posX - maxX > -0.001)) ||
                                ((startPoint.posX - maxX < 0.001 && startPoint.posX - maxX > -0.001) &&
                                (edgePoint.posX - minX < 0.001 && edgePoint.posX - minX > -0.001)) ||
                                ((startPoint.posZ - minZ < 0.001 && startPoint.posZ - minZ > -0.001) &&
                                (edgePoint.posZ - maxZ < 0.001 && edgePoint.posZ - maxZ > -0.001)) ||
                                ((startPoint.posZ - maxZ < 0.001 && startPoint.posZ - maxZ > -0.001) &&
                                (edgePoint.posZ - minZ < 0.001 && edgePoint.posZ - minZ > -0.001))  
                            ) {
                                this.currRoad = road;
                                this.roadHistory.push(road);
                                this.facing = true;
                                break;
                            }
                            if(
                                ((endPoint.posX - minX < 0.001 && endPoint.posX - minX > -0.001) &&
                                (edgePoint.posX - maxX < 0.001 && edgePoint.posX - maxX > -0.001)) ||
                                ((endPoint.posX - maxX < 0.001 && endPoint.posX - maxX > -0.001) &&
                                (edgePoint.posX - minX < 0.001 && edgePoint.posX - minX > -0.001)) ||
                                ((endPoint.posZ - minZ < 0.001 && endPoint.posZ - minZ > -0.001) &&
                                (edgePoint.posZ - maxZ < 0.001 && edgePoint.posZ - maxZ > -0.001)) ||
                                ((endPoint.posZ - maxZ < 0.001 && endPoint.posZ - maxZ > -0.001) &&
                                (edgePoint.posZ - minZ < 0.001 && edgePoint.posZ - minZ > -0.001))  
                            ) {
                                this.currRoad = road;
                                this.roadHistory.push(road);
                                this.facing = false;
                                break;
                            }
                        }
                        this.pointIndex = point.lengthTaken;
                    }
                    else {
                        this.isActive = false;
                        return;
                    }
                    point = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
                    this.index = point.segment.index;
                    break;
                case roadPointTypes.interchangeTerminating:
                    edgePoint = this.currRoad.points[this.currRoad.points.length - 1];
                    let interchangeRoadIndex;
                    for(let i = 0; i < this.currChunk.interchangeRoads.length; i++) {
                        if(equalFloatNumbers(this.currChunk.interchangeRoads[i][0].points[0].posX, edgePoint.posX) &&
                        equalFloatNumbers(this.currChunk.interchangeRoads[i][0].points[0].posZ, edgePoint.posZ)) {
                            interchangeRoadIndex = i;
                            break;
                        }
                    }
                    let direction = this.directon === undefined || this.direction === null? Math.round(Math.random() * (this.currChunk.interchange.type.options - 1)) : this.direction;
                    this.pointIndex = point.lengthTaken;
                    this.currRoad = this.currChunk.interchangeRoads[interchangeRoadIndex][direction];
                    this.roadHistory.push(this.currRoad);
                    this.facing = true;
                    point = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
                    this.index = point.segment.index;
                    break;
                case roadPointTypes.sameChunkTerminating:
                    for(let road of this.currChunk.roads) {
                        let startPoint = road.points[road.points.length - 1];
                        if(equalFloatNumbers(startPoint.posX, edgePoint.posX) && equalFloatNumbers(startPoint.posZ, edgePoint.posZ)) {
                            this.currRoad = road;
                            this.facing = false;
                            this.roadHistory.push(this.currRoad);
                            this.pointIndex = point.lengthTaken;
                            if(this.currRoad === undefined)
                            console.log("6u6mar");
                            point = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
                            this.index = point.segment.index;
                            break;
                        }
                    }
            }
        }
        let pv = this.getPerpDirVec();
        this.perpVec = pv.perp;
        this.dirVec = pv.dir;
        let walked = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
        let index = point.segment.index + (this.facing ? -1 : 1);
        this.index = point.segment.index;
        this.currPoint = linearAlgebra.getVector2(walked.point[0] + this.perpVec[0], walked.point[1] + this.perpVec[1]);
        this.currRoad.takenSegments[point.segment.index][this.facing ? "right" : "left"] = this;    
        let checkingRoad = this.currRoad;
        let checkingChunk = this.currChunk;
        let checkFacing = this.facing;
        let i = 0;
        let accumulatedLength = 0;
        let historyIndex = this.roadHistory.length - 1;
        while(true) {
            if(index + i < 0 || index + i >= checkingRoad.takenSegments.length) {
                let oldPoint = checkFacing? checkingRoad.points[0] : checkingRoad.points[checkingRoad.points.length - 1]; 
                historyIndex--;
                if(historyIndex < 0)
                    break;
                let road = this.roadHistory[historyIndex];
                let startPoint = road.points[0];
                let endPoint = road.points[road.points.length - 1];  
                if(
                    (startPoint.posX - oldPoint.posX < 0.001 && startPoint.posX - oldPoint.posX > -0.001) ||
                    (startPoint.posZ - oldPoint.posZ < 0.001 && startPoint.posZ - oldPoint.posZ > -0.001)
                ) {
                    checkingRoad = road;
                    checkFacing = false;
                    index = 0;
                    i = 0;
                }
                if(
                    (endPoint.posX - oldPoint.posX < 0.001 && endPoint.posX - oldPoint.posX > -0.001) ||
                    (endPoint.posZ - oldPoint.posZ < 0.001 && endPoint.posZ - oldPoint.posZ > -0.001)
                ) {
                    checkingRoad = road;
                    checkFacing = true;
                    index = checkingRoad.takenSegments.length - 1;
                    i = 0;
                }
            }
            checkingRoad.takenSegments[index + i][checkFacing ? "right" : "left"] = this;
            accumulatedLength += checkingRoad.pointSegments[index + i].length;
            if(accumulatedLength >= carLength)
                break;
            if(checkFacing)
                i--;
            else
                i++;
        }
        index = index + i;
        if(checkFacing)
            index--;
        else
            index++;
        let collectedTolerance = 0;
        while(true) {
            if(index < 0 || index >= checkingRoad.takenSegments.length) {
                let oldPoint = checkFacing? checkingRoad.points[0] : checkingRoad.points[checkingRoad.points.length - 1]; 
                historyIndex--;
                if(historyIndex < 0)
                    break;
                let road = this.roadHistory[historyIndex];
                let startPoint = road.points[0];
                let endPoint = road.points[road.points.length - 1];  
                if(
                    (startPoint.posX - oldPoint.posX < 0.001 && startPoint.posX - oldPoint.posX > -0.001) ||
                    (startPoint.posZ - oldPoint.posZ < 0.001 && startPoint.posZ - oldPoint.posZ > -0.001)
                ) {
                    checkingRoad = road;
                    checkFacing = false;
                    index = 0;
                }
                if(
                    (endPoint.posX - oldPoint.posX < 0.001 && endPoint.posX - oldPoint.posX > -0.001) ||
                    (endPoint.posZ - oldPoint.posZ < 0.001 && endPoint.posZ - oldPoint.posZ > -0.001)
                ) {
                    checkingRoad = road;
                    checkFacing = true;
                    index = checkingRoad.takenSegments.length - 1;
                }
            }
            if(checkingRoad.takenSegments[index][checkFacing ? "right" : "left"] === this)
                checkingRoad.takenSegments[index][checkFacing ? "right" : "left"] = null;
            else if(collectedTolerance > tolerance)
                break;
            else
                collectedTolerance++;
            if(checkFacing)
                index--;
            else
                index++;
        }
    }

    render() {
        let angle = Number(Math.atan2(this.dirVec[1], this.dirVec[0]).toFixed(2)); 
        let rotationMatirx = linearAlgebra.rotateAroundY(Math.PI/2 - angle);
        let translationMatrix = linearAlgebra.getTranslationMatrix(this.currChunk.xCenter * 16 + this.currPoint[0], 0.3, this.currChunk.zCenter * 16 + this.currPoint[1]);
        if(drawingData.getBoundShaderProgram() !== carShaderProgram) {
            carShaderProgram.bind();
            carShaderProgram.setUniform("uSampler", carTexture);
        }
        carMesh.bind();
        carShaderProgram.setUniform("transformationMatrix", linearAlgebra.formatMatrix(linearAlgebra.multiplyMatrices(translationMatrix, rotationMatirx)));
        carShaderProgram.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
        carShaderProgram.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
        gl.drawElements(gl.TRIANGLES, carMesh.getVertexCount(), gl.UNSIGNED_SHORT, 0);
    }

    checkFree(index) {
        let distance = 0;
        let currentlyFacing = this.facing;
        let checkingRoad = this.currRoad;
        let checkingChunk = this.currChunk;
        let i = currentlyFacing? index + 1 : index - 1;
        while(true) {
            if((currentlyFacing && i >= checkingRoad.takenSegments.length) || (!currentlyFacing && i <= 0)) {
                let endPoint = currentlyFacing? checkingRoad.points[checkingRoad.points.length - 1] : checkingRoad.points[0];
                switch(endPoint.type) {
                    case roadPointTypes.nextChunkTerminating:
                        let x = checkingChunk.xCenter;
                        let z = checkingChunk.zCenter; 
                        if(endPoint.posX - maxX < 0.001 && endPoint.posX - maxX > -0.001)
                            x++;
                        else if(endPoint.posX - minX < 0.001 && endPoint.posX - minX > -0.001)
                            x--;
                        else if(endPoint.posZ - maxZ < 0.001 && endPoint.posZ - maxZ > -0.001)
                            z++;
                        else if(endPoint.posZ - minZ < 0.001 && endPoint.posZ - minZ > -0.001)
                            z--;
                        let chunk = chunks[String(x) + " " + String(z)];
                        if(chunk === undefined || chunk.geometry === null)
                            return minSafeDist;
                        checkingChunk = chunk;
                        for(let road of checkingChunk.roads) {
                            let startPoint = road.points[0];
                            let endPoint = road.points[road.points.length - 1];  
                            if(
                                (startPoint.posX - endPoint.posX < 0.001 && endPoint.posX - endPoint.posX > -0.001) ||
                                (startPoint.posZ - endPoint.posZ < 0.001 && endPoint.posZ - endPoint.posZ > -0.001)
                            ) {
                                checkingRoad = road;
                                i = 0;
                                currentlyFacing = true;
                                break;
                            }
                            if(
                                (endPoint.posX - endPoint.posX < 0.001 && endPoint.posX - endPoint.posX > -0.001) ||
                                (endPoint.posZ - endPoint.posZ < 0.001 && endPoint.posZ - endPoint.posZ > -0.001)
                            ) {
                                checkingRoad = road;
                                i = road.takenSegments.length - 1;
                                currentlyFacing = false;
                                break;
                            }
                        }
                        break;
                    case roadPointTypes.interchangeTerminating: {
                        let carPos = this.currRoad.points[this.index];
                        let index = currentlyFacing? checkingRoad.points.length - 2 : 1;
                        let followingRoad = checkingRoad.points[index];
                        if(this.direction === null || this.direction === undefined)
                            this.direction = Math.round(Math.random());
                        let isOnPriorityPoint = !(equalFloatNumbers(endPoint.posX, checkingChunk.nonPriorityPoint[0])
                        && equalFloatNumbers(endPoint.posZ, checkingChunk.nonPriorityPoint[1]));
                        if(isOnPriorityPoint) {
                            let downWardVec = linearAlgebra.getVector2(0, 1);
                            let regVec = linearAlgebra.getVector2(endPoint.posX - checkingChunk.splineData.center.posX, endPoint.posZ - checkingChunk.splineData.center.posZ);
                            let degreeDiff = Math.atan2(downWardVec[1], downWardVec[0]) - Math.atan2(regVec[1], regVec[0]);
                            for(let roadGroup of checkingChunk.interchangeRoads) {
                                if(equalFloatNumbers(roadGroup[0].points[0].posX, endPoint.posX) && equalFloatNumbers(roadGroup[0].points[0].posZ, endPoint.posZ)) {
                                    let continuingPoint = roadGroup[this.direction].points[roadGroup[this.direction].points.length - 1];
                                    let priorityPoint;
                                    for(let road of roadGroup)
                                        if(!equalFloatNumbers(road.points[road.points.length - 1].posX, checkingChunk.nonPriorityPoint[0]) || !equalFloatNumbers(road.points[road.points.length - 1].posZ, checkingChunk.nonPriorityPoint[1])) {
                                            priorityPoint = road.points[road.points.length - 1];
                                            break;
                                        }
                                    if(equalFloatNumbers(continuingPoint.posX, priorityPoint.posX) && equalFloatNumbers(continuingPoint.posZ, priorityPoint.posZ))
                                        return minSafeDist;
                                    let contVec = linearAlgebra.getVector2(continuingPoint.posX - checkingChunk.splineData.center.posX, continuingPoint.posZ - checkingChunk.splineData.center.posZ);
                                    let appliedContAngle = Math.atan2(contVec[1], contVec[0]) + degreeDiff;
                                    let appliedContPoint = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(Math.cos(appliedContAngle), Math.sin(appliedContAngle)));
                                    let priorVec = linearAlgebra.getVector2(priorityPoint.posX - checkingChunk.splineData.center.posX, priorityPoint.posZ - checkingChunk.splineData.center.posZ);
                                    let appliedPriorAngle = Math.atan2(priorVec[1], priorVec[0]) + degreeDiff;
                                    let appliedPriorPoint = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(Math.cos(appliedPriorAngle), Math.sin(appliedPriorAngle)));
                                    if(appliedPriorPoint[0] < appliedContPoint[0])
                                        return minSafeDist;
                                    else
                                        break;
                                }
                                else
                                    continue;                 
                            }
                        }
                        let freeRoads = true;
                        for(let road of checkingChunk.roads) {
                            if((equalFloatNumbers(road.points[road.points.length - 1].posX, endPoint.posX) && equalFloatNumbers(road.points[road.points.length - 1].posZ, endPoint.posZ))
                                || (equalFloatNumbers(road.points[road.points.length - 1].posX, checkingChunk.nonPriorityPoint[0]) && equalFloatNumbers(road.points[road.points.length - 1].posZ, checkingChunk.nonPriorityPoint[1])))
                                continue;
                            for(let segment of road.takenSegments) {
                                if(segment["right"] !== null && segment["right"] !== undefined) {
                                    if(!segment["right"].isActive) {
                                        segment["right"] = null;
                                        continue;
                                    }
                                    freeRoads = false;
                                    break;
                                }
                            }
                        }
                        if(freeRoads)
                            return minSafeDist;
                        let length = 0;
                        while(!equalFloatNumbers(followingRoad.posX, carPos.posX) && !equalFloatNumbers(followingRoad.posZ, carPos.posZ)) {
                            if(currentlyFacing)
                                index--;
                            else
                                index++;
                            if(checkingRoad.pointSegments[index] === undefined) {
                                let data = this.getNext(checkingRoad, followingRoad, checkingChunk);
                                if(data.type !== roadPointTypes.nextChunkTerminating)
                                    return minSafeDist;
                                checkingRoad = data.nextRoad;
                                endPoint = data.nextPoint;
                                checkingChunk = data.nextChunk;
                                currentlyFacing = !data.facing;
                                index = currentlyFacing? checkingRoad.points.length - 1 : 0; 
                            }
                            if(checkingRoad.pointSegments === undefined)
                                console.log("WHY");
                            length += checkingRoad.pointSegments[index].length;
                            if(length >= minSafeDist)
                                return minSafeDist;
                            followingRoad = checkingRoad.points[index];
                        }
                        return length;
                    }
                    case roadPointTypes.sameChunkTerminating:
                        return minSafeDist;
                }
            }
            let potentialCar = checkingRoad.takenSegments[i][currentlyFacing? "right" : "left"];
            if(potentialCar !== null) {
                if(!potentialCar.isActive) {
                    checkingRoad.takenSegments[i][currentlyFacing? "right" : "left"] = null;
                }
                else {
                    if(distance >= minSafeDist)
                        return minSafeDist;
                    return distance;
                }
            }
            else {
                distance += checkingRoad.pointSegments[i].length;
            }
            if(distance >= minSafeDist)
                return minSafeDist;
            if(currentlyFacing)
                i++;
            else
                i--;
        }
    }

    getNext(road, endPoint, chunk) {
        switch(endPoint.type) {
            case roadPointTypes.nextChunkTerminating: {
                let chunkX = 0;
                let chunkZ = 0;
                if(equalFloatNumbers(endPoint.posX, maxX))
                    chunkX = 1;
                else if(equalFloatNumbers(endPoint.posX, minX))
                    chunkX = -1;
                if(equalFloatNumbers(endPoint.posZ, maxZ))
                    chunkZ = 1;
                else if(equalFloatNumbers(endPoint.posZ, minZ))
                    chunkZ = -1;
                let nextChunk = chunks[String(chunk.xCenter + chunkX) + " " + String(chunk.zCenter + chunkZ)];
                let continuingPoint;
                let continuingRoad;
                let facing;
                for(let road of nextChunk.roads) {
                    let edgePoints = [
                        road.points[0],
                        road.points[road.points.length - 1]
                    ];
                    for(let point of edgePoints) {
                        if(
                            ((   
                                (equalFloatNumbers(point.posX, maxX) && equalFloatNumbers(endPoint.posX, minX)) ||
                                (equalFloatNumbers(point.posX, minX) && equalFloatNumbers(endPoint.posX, maxX))
                            ) && equalFloatNumbers(point.posZ, endPoint.posZ)) ||
                            ((   
                                (equalFloatNumbers(point.posZ, maxZ) && equalFloatNumbers(endPoint.posZ, minZ)) ||
                                (equalFloatNumbers(point.posZ, minZ) && equalFloatNumbers(endPoint.posZ, maxZ))
                            ) && equalFloatNumbers(point.posX, endPoint.posX))
                        ) {
                            continuingPoint = point;
                            continuingRoad = road;
                            facing = point === road.points[0];
                            break;
                        }
                    }
                }
                return {
                    type: roadPointTypes.nextChunkTerminating,
                    nextChunk,
                    nextRoad: continuingRoad,
                    nextPoint: continuingPoint,
                    facing
                }
            }
        }
    }
}