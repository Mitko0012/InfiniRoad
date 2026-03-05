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
const extendedTolerance = 0.8;
const laneEntranceTolerance = 2;
const warningLaneIssueTolearance = 3;
const directionTolerance = 0.2;
const regularTurnSpeed = 50;
const playerLength = 2;
const checkBack = 10;
const carData = {isActive: true};
const toLookForward = 5;
const checkForward = 0.6;
const speedRatio = 7 / 3.4;
const maxVisibleAngle = 0.7;
let speedDisplay;
let instructorOverlay;
let instructorTextElem;
let showingInstructorOverlay = false;
let totalLastRoad;
let roadHistory = [];
let playerCarMesh;
let playerCarTextureData;

let turnedOnLast = false;
let approachInterData = {approaching: false}
let lastApproachingInter;
let tookPriority = false;
let onInterchangeRoad = false;
let stoppingExam = true;

let playerCarX = 0;
let playerCarZ = 0;
let currSpeed = 0;
let currRotation = 0;
let turningAngle = 0;
let playerCarShaderProgram;
let playerCarTexture;
let leftBlinkerOn = false;
let rightBlinkerOn = false;
let leftArrowKeyDownAtLast = false;
let rightArrowKeyDownAtLast = false;


let toReloadInstructorOverlay = false
let toReloadInstructorTextElem = false;
let toReloadSpeedDisplay = false;

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
    if(instructorOverlay === undefined || toReloadInstructorOverlay) {
        instructorOverlay = document.getElementById("overlappingInstructorDiv");
        toReloadInstructorOverlay = false;
    }
    if(instructorTextElem === undefined || toReloadInstructorTextElem) {
        instructorTextElem = document.getElementById("instructorTextDiv");
        toReloadInstructorTextElem = false;
    }
    if(speedDisplay === undefined || toReloadSpeedDisplay) {
        speedDisplay = document.getElementById("speed-display");
        toReloadSpeedDisplay = false;
    }
    let forwardVec = linearAlgebra.getVector2(Math.cos(currRotation), Math.sin(currRotation));
    playerCarX += forwardVec[0] * currSpeed * deltaTime;
    playerCarZ += forwardVec[1] * currSpeed * deltaTime;
    let speedFactor = Math.min(1, wheelDistortSpeed / currSpeed);
    let slowSpeedFactor = currSpeed / wheelSlowSpeed;  
    let toTurn = turningAngle * regularTurnSpeed * speedFactor * deltaTime * Math.min(slowSpeedFactor, 1);
    currRotation += toTurn;
    turnedOnLast = false;
    verifyCorrectness();
    renderPlayerCar();
}

function getRoadData() {
    let currChunk = chunks[String(Math.round(playerCarX / 16)) + " " + String(Math.round(playerCarZ / 16))];
    let relativeX = playerCarX - Math.round(playerCarX / 16) * 16;
    let relativeZ = playerCarZ - Math.round(playerCarZ / 16) * 16;
    let allRoads = [...currChunk.roads];
    let lastSegment;
    let lastRoad;
    let lastDistance;
    if(totalLastRoad !== undefined && totalLastRoad.points[0].type === roadPointTypes.sameChunkTerminating) {
        allRoads.push(totalLastRoad);
    } else if(currChunk.interchangeRoads !== undefined && approachInterData.approaching)
        for(let roadGroup of currChunk.interchangeRoads) {
            if(totalLastRoad !== undefined && equalFloatNumbers(roadGroup[0].points[0].posX, totalLastRoad.points[totalLastRoad.points.length - 1].posX) && equalFloatNumbers(roadGroup[0].points[0].posZ, totalLastRoad.points[totalLastRoad.points.length - 1].posZ)) {
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
    if(totalLastRoad !== lastRoad && lastRoad.points[0].type === roadPointTypes.sameChunkTerminating)
        onInterchangeRoad = true;
    else if(totalLastRoad !== lastRoad && lastRoad.points[lastRoad.points.length - 1].type === roadPointTypes.interchangeTerminating)
        onInterchangeRoad = false;
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
        if(
            totalLastRoad.points[0].type === roadPointTypes.sameChunkTerminating && 
            equalFloatNumbers(totalLastRoad.points[0].posX, roadData.currChunk.nonPriorityPoint[0]) &&
            equalFloatNumbers(totalLastRoad.points[0].posZ, roadData.currChunk.nonPriorityPoint[1])
        ) {
            let otherRoads = [];
            for(let road of roadData.currChunk.roads) {
                if(equalFloatNumbers(road.points[road.points.length - 1].posX, roadData.currChunk.nonPriorityPoint[0])
                && equalFloatNumbers(road.points[road.points.length - 1].posZ, roadData.currChunk.nonPriorityPoint[1]))
                    continue;
                otherRoads.push(road);    
            }
            let visibleSegments = otherRoads.map((r) => getStraightSegment(r));
            for(let segmentGroup of visibleSegments)
                for(segment of segmentGroup)
                    if(segment["right"] !== null)
                        tookPriority = true;
        } else if(totalLastRoad.points[totalLastRoad.points.length - 1].type === roadPointTypes.interchangeTerminating) 
            tookPriority = false;
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
        if(nextData === undefined)
            return;
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
    if(leftBlinkerOn)
        document.getElementById("left-blinker-img").src = "Textures/leftOnBlinker.png";
    else
        document.getElementById("left-blinker-img").src = "Textures/leftOffBlinker.png";
    if(rightBlinkerOn)
        document.getElementById("right-blinker-img").src = "Textures/rightOnBlinker.png";
    else
        document.getElementById("right-blinker-img").src = "Textures/rightOffBlinker.png";
    prevLanePoint.point[0] += prevChunk.xCenter * 16;
    prevLanePoint.point[1] += prevChunk.zCenter * 16;
    nextLanePoint.point[0] += nextChunk.xCenter * 16;
    nextLanePoint.point[1] += nextChunk.zCenter * 16;
    let roadVector = linearAlgebra.getVector2(nextLanePoint.point[0] - prevLanePoint.point[0], nextLanePoint.point[1] - prevLanePoint.point[1]);
    let roadDirection = normalizeAngle(Math.atan2(roadVector[1], roadVector[0]));
    let carAngle = normalizeAngle(currRotation);
    let inCorrectLane = false;
    let currTolerance;
    if(roadData.road.points[0].type === roadPointTypes.interchangeTerminating)
        currTolerance = extendedTolerance;
    else
        currTolerance = laneTolerance;
    if(checkEqualAnglesWithTolerance(roadDirection, carAngle, laneTolerance))
        facing = true;
    else if(checkEqualAnglesWithTolerance(roadDirection, normalizeAngle(carAngle + Math.PI), laneTolerance))
        facing = false;
    else
        facing = "incorrect rotation";
    let carPerpVec = linearAlgebra.getVector2(roadData.relativeX - carAppliedPoint.posX, roadData.relativeZ - carAppliedPoint.posZ);
    let carPerpAngle = normalizeAngle(Math.atan2(carPerpVec[1], carPerpVec[0]));
    let roadPerp = facing? normalizeAngle(roadDirection + Math.PI / 2) : normalizeAngle(roadDirection - Math.PI / 2);
    if(checkEqualAnglesWithTolerance(roadPerp, carPerpAngle, laneEntranceTolerance))
        inCorrectLane = true;
    else if(checkEqualAnglesWithTolerance(roadPerp, carPerpAngle, warningLaneIssueTolearance))
        inCorrectLane = "warn";
    let magnitude = linearAlgebra.getVectorMagnitudeVec2(carPerpVec);
    updatePlayerStatus(roadData.currChunk, roadData.road, roadData.segment.index, facing, inCorrectLane, magnitude);
    if(keysDown["ArrowLeft"] && !leftArrowKeyDownAtLast) {
        rightBlinkerOn = false;
        leftBlinkerOn = !leftBlinkerOn;
    }
    if(keysDown["ArrowRight"] && !rightArrowKeyDownAtLast) {
        leftBlinkerOn = false;
        rightBlinkerOn = !rightBlinkerOn;
    }
    leftArrowKeyDownAtLast = keysDown["ArrowLeft"];
    rightArrowKeyDownAtLast = keysDown["ArrowRight"];
}

function checkEqualAnglesWithTolerance(num1, num2, tolerance) {
    let diff = num1 - num2;
    diff = (diff + Math.PI) % (2 * Math.PI);
    if(diff < 0) diff += 2 * Math.PI;
    diff -= Math.PI;

    return Math.abs(diff) < tolerance;
}
function updatePlayerStatus(chunk, road, segmentIndex, facing, inCorrectLane, magnitude) {
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
        if(checkingRoad.takenSegments[checkingIndex + toIncrease] !== undefined)
            checkingRoad.takenSegments[checkingIndex + toIncrease][checkFacing? "right" : "left"] = carData;
    }
    checkApproaching(chunk, road, segmentIndex, toLookForward, facing);
    if(approachInterData.approaching === true && approachInterData.interchange !== lastApproachingInter) {
        lastApproachingInter = approachInterData.interchange;
        switch(lastApproachingInter.type) {
            case T_INTERSECTION:
                carData.direction = Math.round(Math.random());
                let nextRoad = getNext(road, road.points[road.points.length - 1], chunk, {carData}).nextRoad;
                let startVec = linearAlgebra.getVector2(nextRoad.points[0].posX - chunk.splineData.center.posX, nextRoad.points[0].posZ - chunk.splineData.center.posZ);
                let endVec = linearAlgebra.getVector2(nextRoad.points[nextRoad.points.length - 1].posX - chunk.splineData.center.posX, nextRoad.points[nextRoad.points.length - 1].posZ - chunk.splineData.center.posZ);
                let degreeDiff = Math.atan2(1, 0) - Math.atan2(startVec[1], startVec[0]);
                let appliedStartAngle = Math.atan2(startVec[1], startVec[0]) + degreeDiff;
                let appliedStartVec = linearAlgebra.getVector2(Math.cos(appliedStartAngle), Math.sin(appliedStartAngle));
                let appliedEndAngle = Math.atan2(endVec[1], endVec[0]) + degreeDiff;
                let appliedEndVec = linearAlgebra.getVector2(Math.cos(appliedEndAngle), Math.sin(appliedEndAngle));
                if(equalFloatNumbers(appliedStartVec[0], appliedEndVec[0]))
                    approachInterData.text = "forward";
                else if(appliedStartVec[0] < appliedEndVec[0])
                    approachInterData.text = "right";
                else
                    approachInterData.text = "left";

        }
        if(!showingInstructorOverlay) {
            showingInstructorOverlay = true;
            instructorOverlay.style.display = "block";
        }
    }
    else if(approachInterData.approaching === false)
        lastApproachingInter = null;
    if(inCorrectLane !== true) {
        showingInstructorOverlay = true;
        instructorOverlay.style.display = "block";
    }
    if(showingInstructorOverlay) {
        instructorTextElem.innerText = "";
        if(approachInterData.approaching)
            instructorTextElem.innerText += approachInterData.text === "forward" ? "Продължете направо! " : approachInterData.text === "right" ? "Завийте надясно! " : "Завийте наляво! ";
        if(inCorrectLane === "warn" && !onInterchangeRoad)
            instructorTextElem.innerText += "Стойте в лентата! ";
        else if(inCorrectLane === false && !onInterchangeRoad && magnitude > 0.4 && segmentIndex !== road.takenSegments.length - 1 && segmentIndex !== road.takenSegments.length - 2 && segmentIndex !== 0 && segmentIndex !== 1)
            endExam(["Излязохте от лентата"]);
    }
    speedDisplay.innerText = Math.round(currSpeed * speedRatio * (36 / 10)) + " km/h";
    if(tookPriority)
        endExam(["Отнехте предимство"]);
    if(onInterchangeRoad)
        if(approachInterData.text === "right" && !rightBlinkerOn)
            endExam(["Не пуснахте мигач правлино"]);
        else if(approachInterData.text === "left" && !leftBlinkerOn)
            endExam(["Не пуснахте мигач правилно"]);
        else if(approachInterData.text === "forward" && (rightBlinkerOn || leftBlinkerOn))
            endExam(["Не пуснахте мигач правилно"]);
        if(approachInterData.approaching || (inCorrectLane === "warn" && !onInterchangeRoad))
            return;
        if(showingInstructorOverlay) {
        showingInstructorOverlay = false;
        instructorOverlay.style.display = "none";
    }
}

function normalizeAngle(angle) {
    const tau = 2 * Math.PI;
    return ((angle + Math.PI) % tau + tau) % tau - Math.PI;
}

function checkApproaching(chunk, road, initSegmentIndex, distanceToLook, isFacing) {
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
    approachInterData.approaching = false;
}

function getStraightSegment(road) {
    let initialDirectionVec = linearAlgebra.getVector2(road.points[road.points.length - 2].posX - road.points[road.points.length - 1].posX, road.points[road.points.length - 2].posZ - road.points[road.points.length - 1].posZ);
    let initialDirectionAngle = Math.atan2(initialDirectionVec.posZ, initialDirectionVec.posX);
    let collectedSegments = [road.takenSegments[road.takenSegments.length - 1]];
    for(let i = road.points.length - 3; i >= 0; i--) {
        let directionVec = linearAlgebra.getVector2(road.points[i + 1].posX - road.points[i].posX, road.points[i + 1].posZ - road.points[i].posZ)
        let direction = Math.atan2(directionVec.posZ, directionVec.posX);
        if(checkEqualAnglesWithTolerance(direction, initialDirectionAngle, maxVisibleAngle))
            collectedSegments.push(road.takenSegments[i]);
        else {break;}
    }
    return collectedSegments;
}

function renderPlayerCar() {
    let movingMatrix = linearAlgebra.getTranslationMatrix(0, 0, -0.04);
    let translationMatrix = linearAlgebra.getTranslationMatrix(camPosX, 0.2, camPosZ);
    let rotationMatirx = linearAlgebra.rotateAroundY(-currRotation + Math.PI);
    if(drawingData.getBoundShaderProgram() !== playerCarShaderProgram) {
        playerCarShaderProgram.bind();
        playerCarShaderProgram.setUniform("uSampler", playerCarTexture);
    }
    playerCarMesh.bind(); 
    let processedSunDirection = linearAlgebra.normalizeVec3(sunDirection);
    processedSunDirection = linearAlgebra.getVector3(-sunDirection[0], -sunDirection[1], -sunDirection[2]);
    playerCarShaderProgram.setUniform("lightDirection", processedSunDirection);
    playerCarShaderProgram.setUniform("transformationMatrix", linearAlgebra.formatMatrix(linearAlgebra.multiplyMatrices(translationMatrix, 
    linearAlgebra.multiplyMatrices(rotationMatirx, movingMatrix))));
    playerCarShaderProgram.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
    playerCarShaderProgram.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
    gl.drawElements(gl.TRIANGLES, playerCarMesh.getIndexCount(), gl.UNSIGNED_SHORT, 0);
}

function endExam(reasons) {
    if(stoppingExam) {
        toReloadSpeedDisplay = true;
        gameStarted = false;
        showingInstructorOverlay = false;
        instructorOverlay.style.display = "none";
        setFullPageUI(resourcesToLoad["examEnd"].value);
        let reasonsDisplay = document.getElementById("reasons-div");
        reasonsDisplay.innerHTML = "";
        currSpeed = 0;
        loadedChunks = {};
        chunks = {};
        document.getElementById("try-again-button").onclick = () => {
            currentCars = [];
            setFullPageUI(resourcesToLoad["startPage"].value);
        }
        for(let reason of reasons)
            reasonsDisplay.innerHTML += `<p class="reason-text">- ${reason}</p>`;
        tookPriority = false;
        approachInterData.approaching = false;
        lastApproachingInter = null;
        approachInterData.text = "";
        leftBlinkerOn = false;
        rightBlinkerOn = false;
        chunks = {};
        activeChunks = {};
        toReloadInstructorOverlay = true;
        toReloadInstructorTextElem = true;
    }
}

function recomputeStopAllowances() {
    document.getElementById("stop-exam").checked = stoppingExam; 
}

function changeStopAllowances() {
    stoppingExam = document.getElementById("stop-exam").checked;
}