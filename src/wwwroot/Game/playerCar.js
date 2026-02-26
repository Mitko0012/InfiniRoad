const playerMaxSpeed = 12;
const maxAngle = 0.3;
const speedingBreakSpeed = 2.3;
const regularSpeedUp = 2;
const breakSpeed = 10; 
const wheelTurnSpeed = 0.3;
const turnBackSpeed = 0.5;
const wheelDistortSpeed = 10;
const wheelSlowSpeed = 0.2;
const laneTolerance = 0.4;
const laneEntranceTolerance = 0.8;
const regularTurnSpeed = 50;
const playerLength = 2;
const checkBack = 10;
const carData = {isActive: true};
const toLookForward = 5;
const checkForward = 1.4;
let instructorOverlay;
let instructorTextElem;
let showingInstuctorOverlay = false;
let totalLastRoad;
let roadHistory = [];

let turnedOnLast = false;
let approachInterData = {approaching: false}
let lastApproachingInter;

let playerCarX = 0;
let playerCarZ = 0;
let currSpeed = 0;
let currRotation = 0;
let turningAngle = 0;


function accelerate() {
    let turnFactor = (-Math.abs(turningAngle) + maxAngle) / maxAngle;
    let speedingFactor = (-(currSpeed) + playerMaxSpeed) / playerMaxSpeed;
    currSpeed += regularSpeedUp * speedingFactor * turnFactor * deltaTime;
}

function slowDown() {
    currSpeed -= breakSpeed * deltaTime;
    if(currSpeed < 0)
        currSpeed = 0;
}

function turn(rightTurning) {
    let closeToCenterFactor = (Math.abs(turningAngle) + wheelTurnSpeed) / (maxAngle + wheelTurnSpeed);
    let toTurn = wheelTurnSpeed * deltaTime * (rightTurning ? 1 : -1) * closeToCenterFactor;
    if(turningAngle + toTurn > maxAngle)
        turningAngle = maxAngle;
    else if(turningAngle + toTurn < -maxAngle)
        turningAngle = -maxAngle;
    else
        turningAngle += toTurn;
    turnedOnLast = true;
}

function carUpdate() {
    if(!turnedOnLast) {
        if(turningAngle < 0) {
            let toTurn = turningAngle + turnBackSpeed * deltaTime;
            if(toTurn > 0)
                turningAngle = 0;
            else
                turningAngle = toTurn;
        }
        else if(turningAngle > 0) {
            let toTurn = turningAngle - turnBackSpeed * deltaTime;
            if(toTurn < 0)
                turningAngle = 0;
            else
                turningAngle = toTurn;
        }
    }
    if(instructorOverlay === undefined)
        instructorOverlay = document.getElementById("overlappingInstructorDiv");
    if(instructorTextElem === undefined)
        instructorTextElem = document.getElementById("instructorTextDiv");
    let forwardVec = linearAlgebra.getVector2(Math.cos(currRotation), Math.sin(currRotation));
    playerCarX += forwardVec[0] * currSpeed * deltaTime;
    playerCarZ += forwardVec[1] * currSpeed * deltaTime;
    let speedFactor = Math.min(1, wheelDistortSpeed / currSpeed);
    let slowSpeedFactor = currSpeed / wheelSlowSpeed;  
    let toTurn = turningAngle * regularTurnSpeed * speedFactor * deltaTime * Math.min(slowSpeedFactor, 1);
    currRotation += toTurn;
    turnedOnLast = false;
    verifyCorrectness()
}

function getRoadData() {
    let currChunk = chunks[String(Math.round(playerCarX / 16)) + " " + String(Math.round(playerCarZ / 16))];
    let relativeX = playerCarX - Math.round(playerCarX / 16) * 16;
    let relativeZ = playerCarZ - Math.round(playerCarZ / 16) * 16;
    let allRoads = [...currChunk.roads];
    let lastSegment;
    let lastRoad;
    let lastDistance;
    if(totalLastRoad !== undefined && totalLastRoad.pointSegments[0].type === roadPointTypes.sameChunkTerminating) {
        allRoads.push(totalLastRoad);
    } else if(currChunk.interchangeRoads !== undefined && approachInterData.approaching)
        for(let roadGroup of currChunk.interchangeRoads) {
            if(totalLastRoad !== undefined && equalFloatNumbers(roadGroup[0].points[0].posX, totalLastRoad.points[totalLastRoad.points.length - 1].posX) && equalFloatNumbers(roadGroup[0].points[0].posX, totalLastRoad.points[totalLastRoad.points.length - 1].posX)) {
                allRoads.push(roadGroup[carData.direction]);
                break;
            }    
        }
    for(let road of allRoads) {
        for(let segment of Object.values(road.pointSegments))
            if(lastSegment === undefined || 
            linearAlgebra.vector2Distance(linearAlgebra.getVector2(road.points[segment.index].posX, road.points[segment.index].posZ), 
            linearAlgebra.getVector2(relativeX, relativeZ)) < lastDistance) {
                lastSegment = segment;
                lastDistance = linearAlgebra.vector2Distance(linearAlgebra.getVector2(road.points[segment.index].posX, road.points[segment.index].posZ), 
                    linearAlgebra.getVector2(relativeX, relativeZ));
                lastRoad = road;
            }
    }
    return {
        segment: lastSegment,
        currChunk,
        road: lastRoad,
        relativeX,
        relativeZ
    };
}

function verifyCorrectness() {
    let roadData = getRoadData();
    if(totalLastRoad !== roadData.road) {
        totalLastRoad = roadData.road;
        roadHistory.push(totalLastRoad);
    }
    let point = roadData.road.points[roadData.segment.index];
    let prevPoint = roadData.road.points[roadData.segment.index - 1] === undefined? point : roadData.road.points[roadData.segment.index - 1];
    let nextPoint = roadData.road.points[roadData.segment.index + 1] === undefined? point : roadData.road.points[roadData.segment.index + 1];
    let initialT = ((point.posX - prevPoint.posX)*(nextPoint.posX - prevPoint.posX) + (point.posZ - prevPoint.posZ)*(nextPoint.posZ - prevPoint.posZ)) / (Math.pow(nextPoint.posX - prevPoint.posX, 2) + Math.pow(nextPoint.posZ - prevPoint.posZ, 2));
    let appliedPoint = {posX: prevPoint.posX + initialT*(nextPoint.posX - prevPoint.posX), posZ: prevPoint.posZ + initialT*(nextPoint.posZ - prevPoint.posZ)};  
    let appliedPrevPoint = {posX: point.posX + (prevPoint.posX - appliedPoint.posX), posZ: point.posZ + (prevPoint.posZ - appliedPoint.posZ)};
    let appliedNextPoint = {posX: point.posX + (nextPoint.posX - appliedPoint.posX), posZ: point.posZ + (nextPoint.posZ - appliedPoint.posZ)};
    let nextT = ((roadData.relativeX - appliedPrevPoint.posX)*(appliedNextPoint.posX - appliedPrevPoint.posX) + (roadData.relativeZ - appliedPrevPoint.posZ)*(appliedNextPoint.posZ - appliedPrevPoint.posZ)) / (Math.pow(appliedNextPoint.posX - appliedPrevPoint.posX, 2) + Math.pow(appliedNextPoint.posZ - appliedPrevPoint.posZ, 2));
    let carAppliedPoint = {posX: appliedPrevPoint.posX + nextT*(appliedNextPoint.posX - appliedPrevPoint.posX), posZ: appliedPrevPoint.posZ + nextT*(appliedNextPoint.posZ - appliedPrevPoint.posZ)};
    let facing;
    let totalSegmentLength;
    let totalRoadLength = 0;
    for(let segment of Object.values(roadData.road.pointSegments)) {
        totalRoadLength += segment.length;
        if(segment === roadData.segment)
            totalSegmentLength = totalRoadLength;
    }
    let nextLanePoint;
    let prevLanePoint;
    let prevChunk = roadData.currChunk;
    let nextChunk = roadData.currChunk;
    let moveBack = false;
    let moveForward = false;
    if (totalSegmentLength - checkForward <= 0)
        moveBack = true;
    if(totalSegmentLength + checkForward >= totalRoadLength || equalFloatNumbers(totalSegmentLength + checkForward, totalRoadLength))
        moveForward = true;
    if(moveBack || moveForward) {
        let endPoint = moveBack? roadData.road.points[0] : roadData.road.points[roadData.road.points.length - 1];
        let nextData = getNext(roadData.road, endPoint, roadData.currChunk, carData);
        if(moveBack) {
            prevLanePoint = walkOnRoad(nextData.nextRoad, checkForward - totalSegmentLength, nextData.facing);
            nextLanePoint = walkOnRoad(roadData.road, totalSegmentLength + checkForward, true);
            prevRoad = nextData.nextRoad;
            prevChunk = nextData.nextChunk;
        }
        else {
            prevLanePoint = walkOnRoad(roadData.road, totalSegmentLength - checkForward, true);
            nextLanePoint = walkOnRoad(nextData.nextRoad, checkForward - (totalRoadLength - totalSegmentLength), nextData.facing);
            nextRoad = nextData.nextRoad;
            nextChunk = nextData.nextChunk;
        }
    } else {
        prevLanePoint = walkOnRoad(roadData.road, totalSegmentLength - checkForward, true);
        nextLanePoint = walkOnRoad(roadData.road, totalSegmentLength + checkForward, true);
    }
    prevLanePoint.point[0] += prevChunk.xCenter * 16;
    prevLanePoint.point[1] += prevChunk.zCenter * 16;
    nextLanePoint.point[0] += nextChunk.xCenter * 16;
    nextLanePoint.point[1] += nextChunk.zCenter * 16;
    let roadVector = linearAlgebra.getVector2(nextLanePoint.point[0] - prevLanePoint.point[0], nextLanePoint.point[1] - prevLanePoint.point[1]);
    let roadDirection = normalizeAngle(Math.atan2(roadVector[1], roadVector[0]));
    let carAngle = normalizeAngle(currRotation);
    let inCorrectLane = false;
    if(checkEqualsWithTolerance(roadDirection, carAngle, laneTolerance))
        facing = true;
    else if(checkEqualsWithTolerance(roadDirection, normalizeAngle(carAngle + Math.PI), laneTolerance))
        facing = false;
    else
        facing = "incorrect rotation";
    let carPerpVec = linearAlgebra.getVector2(roadData.relativeX - carAppliedPoint.posX, roadData.relativeZ - carAppliedPoint.posZ);
    let carPerpAngle = normalizeAngle(Math.atan2(carPerpVec[1], carPerpVec[0]));
    let roadPerp = facing? normalizeAngle(roadDirection + Math.PI / 2) : normalizeAngle(roadDirection - Math.PI / 2);
    if(checkEqualsWithTolerance(roadPerp, carPerpAngle, laneEntranceTolerance))
        inCorrectLane = true;
    let approachText = "";
    if(approachInterData != undefined && approachInterData.approaching)
        approachText = approachInterData.text;
    document.getElementById("displayDist").innerText = linearAlgebra.vector2Distance(linearAlgebra.getVector2(carAppliedPoint.posX, carAppliedPoint.posZ), linearAlgebra.getVector2(roadData.relativeX, roadData.relativeZ)) + ` ${facing} ${inCorrectLane}` + approachText;
    updatePlayerStatus(roadData.currChunk, roadData.road, roadData.segment.index, facing, inCorrectLane);
}

function checkEqualsWithTolerance(num1, num2, tolerance) {
    let min = Math.min(num1, num2);
    let max = Math.max(num1, num2)
    if(max - min > Math.PI)
        min = max + (min - Math.PI * 2);
    return min - max > -tolerance && min - max < tolerance;
}

function updatePlayerStatus(chunk, road, segmentIndex, facing, inCorrectLane) {
    if(inCorrectLane) {
        for(let checkRoad of roadHistory)
            for(let segment of checkRoad.takenSegments) {
                if(segment["right"] === carData)
                    segment["right"] = null;
                if(segment["left"] === carData)
                    segment["left"] = null;
            } 
        road.takenSegments[segmentIndex][facing? "right" : "left"] = carData;
        let checkFacing = facing;
        let checkingRoad = road;
        let checkingIndex = segmentIndex;
        let checkingChunk = chunk;
        let prevIncrease;
        let increasing = 0;
        for(let i = 1; i <= playerLength; i++) {
            increasing++;
            let toIncrease = increasing * (checkFacing? -1 : 1);
            if(checkingIndex + toIncrease < 0 || checkingIndex + toIncrease >= road.takenSegments.length) {
                let endPoint = checkingIndex + toIncrease < 0? road.points[0] : road.points[road.points.length - 1];
                let next = getNext(checkingRoad, endPoint, checkingChunk, carData);
                checkingRoad = next.nextRoad;
                checkFacing = !next.facing;
                checkingChunk = next.nextChunk;
                checkingIndex = checkFacing? next.nextRoad.takenSegments.length - 1 : 0;
                toIncrease = 0;
                increasing = 0;
            }
            prevIncrease = checkingIndex + toIncrease;
            checkingRoad.takenSegments[checkingIndex + toIncrease][checkFacing? "right" : "left"] = carData;
        }
        viewForward(chunk, road, segmentIndex, toLookForward, facing);
        if(approachInterData.approaching === true && approachInterData.interchange !== lastApproachingInter) {
            lastApproachingInter = approachInterData.interchange;
            switch(lastApproachingInter.type) {
                case T_INTERSECTION:
                    carData.direction = Math.round(Math.random());
                    let nextRoad = getNext(road, road.points[road.points.length - 1], chunk, {carData}).nextRoad;
                    let startVec = linearAlgebra.getVector3(road.points[road.points.length - 1].posX - chunk.splineData.center.posX, 0, road.points[road.points.length - 1].posZ - chunk.splineData.center.posZ);
                    let endVec = linearAlgebra.getVector3(nextRoad.points[nextRoad.points.length - 1].posX - chunk.splineData.center.posX, 0, nextRoad.points[nextRoad.points.length - 1].posZ - chunk.splineData.center.posZ);
                    let rotatedMat = linearAlgebra.rotateAroundY(-approachInterData.interchange.angle);
                    let appliedStartVec = linearAlgebra.multiplyMatrixAndVector(rotatedMat, startVec);
                    let appliedEndVec = linearAlgebra.multiplyMatrixAndVector(rotatedMat, endVec);
                    if(equalFloatNumbers(appliedStartVec[0], appliedEndVec[0]))
                        approachInterData.text = "forward";
                    else if(appliedStartVec[0] < appliedEndVec[0])
                        approachInterData.text = "right";
                    else
                        approachInterData.text = "left";

            }
            if(!showingInstuctorOverlay) {
                showingInstuctorOverlay = true;
                instructorOverlay.style.display = "block";
                instructorTextElem.innerText = approachInterData.text === "forward" ? "Continue forward" : `Turn ${approachInterData.text}`;
            }
        }
        else if(approachInterData.approaching === false)
            lastApproachingInter = null;
    }
}

function normalizeAngle(angle) {
    const tau = 2 * Math.PI;
    return ((angle + Math.PI) % tau + tau) % tau - Math.PI;
}

function viewForward(chunk, road, initSegmentIndex, distanceToLook, isFacing) {
    let currPointIndex = initSegmentIndex;
    let currFacing = isFacing;
    let currRoad = road;
    let currChunk = chunk;
    for(let i = 0; i < distanceToLook; i++) {
        currPointIndex += currFacing? 1 : -1;
        if(currPointIndex >= currRoad.points.length || currPointIndex < 0) {
            let endPoint = currPointIndex < 0? currRoad.points[0] : currRoad.points[currRoad.points.length - 1];
            let nextData = getNext(currRoad, endPoint, currChunk, carData);
            currFacing = nextData.facing;
            currRoad = nextData.nextRoad;
            currChunk = nextData.nextChunk;
            currPointIndex = currFacing ? 0 : currRoad.points.length - 1;
        }
        let nextSegment = currRoad.points[currPointIndex];
        if(nextSegment.type === roadPointTypes.interchangeTerminating) {
            approachInterData.approaching = true;
            approachInterData.endPoint = nextSegment;
            approachInterData.interchange = currChunk.interchange;
            return;
        }
    }
    if(showingInstuctorOverlay) {
        showingInstuctorOverlay = false;
        instructorOverlay.style.display = "none";
    }
    approachInterData.approaching = false;
}