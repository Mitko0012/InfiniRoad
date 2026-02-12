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
const laneTolerance = 0.4;

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
                linearAlgebra.getVector2(relativeX, relativeZ)) < lastDistance) {
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
    let prevPoint = roadData.road.points[roadData.segment.index - 1] === undefined? point : roadData.road.points[roadData.segment.index - 1];
    let nextPoint = roadData.road.points[roadData.segment.index + 1] === undefined? point : roadData.road.points[roadData.segment.index + 1];
    let initialT = ((point.posX - prevPoint.posX)*(nextPoint.posX - prevPoint.posX) + (point.posZ - prevPoint.posZ)*(nextPoint.posZ - prevPoint.posZ)) / (Math.pow(nextPoint.posX - prevPoint.posX, 2) + Math.pow(nextPoint.posZ - prevPoint.posZ, 2));
    let appliedPoint = {posX: prevPoint.posX + initialT*(nextPoint.posX - prevPoint.posX), posZ: prevPoint.posZ + initialT*(nextPoint.posZ - prevPoint.posZ)};  
    let appliedPrevPoint = {posX: point.posX + (prevPoint.posX - appliedPoint.posX), posZ: point.posZ + (prevPoint.posZ - appliedPoint.posZ)};
    let appliedNextPoint = {posX: point.posX + (nextPoint.posX - appliedPoint.posX), posZ: point.posZ + (nextPoint.posZ - appliedPoint.posZ)};
    let nextT = ((roadData.relativeX - appliedPrevPoint.posX)*(appliedNextPoint.posX - appliedPrevPoint.posX) + (roadData.relativeZ - appliedPrevPoint.posZ)*(appliedNextPoint.posZ - appliedPrevPoint.posZ)) / (Math.pow(appliedNextPoint.posX - appliedPrevPoint.posX, 2) + Math.pow(appliedNextPoint.posZ - appliedPrevPoint.posZ, 2));
    let carAppliedPoint = {posX: appliedPrevPoint.posX + nextT*(appliedNextPoint.posX - appliedPrevPoint.posX), posZ: appliedPrevPoint.posZ + nextT*(appliedNextPoint.posZ - appliedPrevPoint.posZ)};
    let roadVector = nextPoint === point? linearAlgebra.getVector2(point.posX - prevPoint.posX, point.posZ - prevPoint.posZ) : linearAlgebra.getVector2(nextPoint.posX - point.posX, nextPoint.posZ - point.posZ);
    let totalLenght = 0;
    let roadDirection = normalizeAngle(Math.atan2(roadVector[1], roadVector[0]));
    let carAngle = normalizeAngle(currRotation);
    let facing;
    if(checkEqualsWithTolerance(roadDirection, carAngle, laneTolerance))
        facing = true;
    else if(checkEqualsWithTolerance(roadDirection, normalizeAngle(carAngle + Math.PI), laneTolerance))
        facing = false;
    else
        facing = "incorrect rotation";
    let inCorrectLane = false;
    if((facing && checkEqualsWithTolerance(roadDirection, normalizeAngle(carAngle - Math.PI / 2), laneTolerance)) || (!facing && checkEqualsWithTolerance(roadDirection, normalizeAngle(carAngle + Math.PI / 2), laneTolerance)))
        inCorrectLane = true;
    document.getElementById("displayDist").innerText = linearAlgebra.vector2Distance(linearAlgebra.getVector2(carAppliedPoint.posX, carAppliedPoint.posZ), linearAlgebra.getVector2(roadData.relativeX, roadData.relativeZ)) + ` ${facing} ${inCorrectLane}`;
}

function checkEqualsWithTolerance(num1, num2, tolerance) {
    return num1 - num2 > -tolerance && num2 - num1 < tolerance;
}

function normalizeAngle(angle) {
    const tau = 2 * Math.PI;
    return ((angle % tau) + tau) % tau;
}