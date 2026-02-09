const playerMaxSpeed = 30;
const maxAngle = Math.PI / 4;
const maxAngleAtTopSpeed = 50;
const speedingBreakSpeed = 2.3;
const regularSpeedUp = 2;
const regularTurn = Math.PI / 8;
const wheelTurnSpeed = 2;
const stopTurningSpeed = 20;

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

}

function turn(rightTurning) {
    let toTurn = wheelTurnSpeed * regularTurn * deltaTime * (rightTurning ? -1 : 1);
    if(turningAngle + toTurn > maxAngle)
        turningAngle = maxAngle;
    else if(turningAngle + toTurn < -maxAngle)
        turningAngle = -maxAngle;
    else
        turningAngle += toTurn;
}

function carUpdate() {
    let forwardVec = linearAlgebra.getVector2(Math.cos(currRotation), Math.sin(currRotation));
    playerCarX += forwardVec[0] * currSpeed * deltaTime;
    playerCarZ += forwardVec[1] * currSpeed * deltaTime;
    let speedFactor = (-(currSpeed) + stopTurningSpeed) / stopTurningSpeed;
    let toTurn = turningAngle * stopTurningSpeed * speedFactor * deltaTime
    currRotation += toTurn; 
}