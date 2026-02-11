const playerMaxSpeed = 12;
const maxAngle = 0.3;
const speedingBreakSpeed = 2.3;
const regularSpeedUp = 2;
const breakSpeed = 10; 
const wheelTurnSpeed = 0.3;
const stopTurningSpeed = 20;
const minTurnSpeed = 0.5;
const turnBackSpeed = 0.5;
const wheelSlowSpeed = 10.5;
let turnedOnLast = false;

let playerCarX = 0;
let playerCarZ = 0;
let currSpeed = 0;
let currRotation = 0;
let turningAngle = 0;


function accelerate() {
    let turnFactor = (-Math.abs(turningAngle) + maxAngle) / maxAngle;
    let speedingFactor = (-(currSpeed) + playerMaxSpeed) / playerMaxSpeed;
    let finalFactor = turnFactor * speedingFactor;
    currSpeed += regularSpeedUp * speedingFactor * turnFactor * deltaTime;
}

function slowDown() {
    currSpeed -= breakSpeed * deltaTime;
    if(currSpeed < 0)
        currSpeed = 0;
}

function turn(rightTurning) {
    let closeToCenterFactor = (Math.abs(turningAngle) + minSpeed) / (maxAngle + minSpeed);
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
    let forwardVec = linearAlgebra.getVector2(Math.cos(currRotation), Math.sin(currRotation));
    playerCarX += forwardVec[0] * currSpeed * deltaTime;
    playerCarZ += forwardVec[1] * currSpeed * deltaTime;
    let speedFactor = Math.min(wheelSlowSpeed, wheelSlowSpeed / currSpeed);
    let slowSpeedFactor = currSpeed / minTurnSpeed;  
    let toTurn = turningAngle * stopTurningSpeed * speedFactor * deltaTime * Math.min(slowSpeedFactor, 1);
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
    if(currChunk.interchangeRoads !== undefined)
        for(let roadGroup of currChunk.interchangeRoads)
            for(let road of roadGroup)
                allRoads.push(road);
    for(let road of allRoads) {
        if(road.pointSegments === undefined)
            console.log("6u6mar");
        for(let segment of Object.values(road.pointSegments))
            if(lastSegment === undefined || 
                linearAlgebra.vector2Distance(linearAlgebra.getVector2(road.points[segment.index].posX, road.points[segment.index].posZ), 
                linearAlgebra.getVector2(lastRoad.points[lastSegment.index].posX, lastRoad.points[lastSegment.index].posZ)) < lastDistance) {
                    lastSegment = segment;
                    lastDistance = linearAlgebra.vector2Distance(linearAlgebra.getVector2(road.points[segment.index].posX, road.points[segment.index].posZ), 
                                    linearAlgebra.getVector2(relativeX, relativeZ));
                lastRoad = road;
            }
    }
    return {
        segment: lastSegment,
        road: lastRoad,
        relativeX,
        relativeZ
    };
}

function verifyCorrectness() {
    let roadData = getRoadData();
    let point = roadData.road.points[roadData.segment.index];
    let otherPoint = roadData.road.points[roadData.segment.index + 1] === undefined? roadData.road.points[roadData.segment.index - 1] : roadData.road.points[roadData.segment.index + 1];
    let triangleArea = 0.5 * Math.abs(point.posX * (otherPoint.posZ - roadData.relativeZ) + otherPoint.posX * (roadData.relativeZ - point.posZ) + roadData.relativeX * (point.posZ - otherPoint.posZ));
    let height = (2 * triangleArea) / (linearAlgebra.vector2Distance(linearAlgebra.getVector2(point.posX, point.posZ), linearAlgebra.getVector2(otherPoint.posX, otherPoint.posZ))); 
    console.log(height);
}