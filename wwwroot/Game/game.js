colorToClear.blue = 1;
colorToClear.green = 0.5;
const camVel = 6;
const lookRatio = 0.5;
let inputX = 0;
let inputZ = 0;
let currentCars = [];

let rDownOnLast = false;
let tDownOnLast = false;

let camSpeed = 20;
let facingVector = linearAlgebra;
let roadTexture;

const carsPerLevel = 20;
let totalCars = 0;

resourcesToLoad["terrainVert"] = {type: "text", source: "Game/Shaders/terrainVert.glsl"};
resourcesToLoad["terrainFrag"] = {type: "text", source: "Game/Shaders/terrainFrag.glsl"};
resourcesToLoad["roadVert"] = {type: "text", source: "Game/Shaders/roadVert.glsl"};
resourcesToLoad["roadFrag"] = {type: "text", source: "Game/Shaders/roadFrag.glsl"};
resourcesToLoad["carVert"] = {type: "text", source: "Game/Shaders/carVert.glsl"};
resourcesToLoad["carFrag"] = {type: "text", source: "Game/Shaders/carFrag.glsl"};
resourcesToLoad["roadTexture"] = {type: "image", source: "Textures/road_texture.png"};
resourcesToLoad["carModel"] = {type: "text", source: "Models/car.obj"};
resourcesToLoad["carTexture"] = {type: "image", source: "Textures/car_texture.png"};

let carsInitialized = false; // flag to spawn first two cars automatically

onStart = () => {
    const canvas = document.getElementById("drawing-canvas");

    window.addEventListener("mousemove", (event) => {
        const deltaX = (event.movementX / canvas.width) * 180;
        const deltaY = (event.movementY / canvas.height) * 180;

        camAngleY -= deltaX;
        camAngleX -= deltaY;

        camAngleX = Math.max(-89, Math.min(89, camAngleX));
    });

    sunDirection[0] = 0.3; 
    camAngleY = 0;
    camPosY = 5;

    terrainShader = drawingData.createShaderConfig(resourcesToLoad["terrainVert"].value, resourcesToLoad["terrainFrag"].value);
    roadShader = drawingData.createShaderConfig(resourcesToLoad["roadVert"].value, resourcesToLoad["roadFrag"].value);
    roadTexture = drawingData.textureFromImage(resourcesToLoad["roadTexture"].value);
}

onUpdate = () => {

    // Camera input
    if(keysDown["w"]) inputZ = -1;
    else if(keysDown["s"]) inputZ = 1;
    else inputZ = 0;

    if(keysDown["a"]) inputX = -1;
    else if(keysDown["d"]) inputX = 1;
    else inputX = 0;

    let forward = linearAlgebra.normalizeVec3(linearAlgebra.getVector3(
        Math.sin(camAngleY * Math.PI / 180) * Math.cos(camAngleX * Math.PI / 180),
        Math.sin(camAngleX * Math.PI / 180),
        Math.cos(camAngleY * Math.PI / 180) * Math.cos(camAngleX * Math.PI / 180)
    ));

    let right = linearAlgebra.normalizeVec3(
        linearAlgebra.crossVector3(linearAlgebra.getVector3(0, 1, 0), forward)
    );

    let movementVec = linearAlgebra.scaleVector(
        linearAlgebra.normalizeVec3(
            linearAlgebra.addVectors(
                linearAlgebra.scaleVector(forward, inputZ),
                linearAlgebra.scaleVector(right, inputX)
            )
        ), camVel * deltaTime
    );

    camPosX += movementVec[0];
    camPosZ += movementVec[2];

    updateMatrices();
    updateChunk();

    // Update and render all cars
    let indicesToRemove = [];
    for (let i = 0; i < currentCars.length; i++) {
        let car = currentCars[i];
        car.update();
        if (car.isActive) car.render();
        else indicesToRemove.push(i);
    }
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
        currentCars.splice(indicesToRemove[i], 1);
    }

    while (currentCars.length < carsPerLevel) {
        let activeChunksAsList = Object.values(activeChunks);
        while (true) {
            let chunk = activeChunksAsList[Math.round(Math.random() * (activeChunksAsList.length - 1))];
            if (chunk.roads === undefined)
                continue;
            let road = chunk.roads[Math.round(Math.random() * (chunk.roads.length - 1))];
            if (road === undefined)
                console.log("debug");
            let segmentPos = Math.round(Math.random() * road.totalLength);
            let facing = (Math.random() < 0.5);
            let segment = walkOnRoad(road, segmentPos, facing);
            let occupation = road.takenSegments[segment.index][facing ? "left" : "right"];
            if (occupation === null || occupation === undefined) {
                currentCars.push(new NpcCar(chunk, road, segmentPos, facing, 2));
                break;
            }
        }
    }
}

start("drawing-canvas");
