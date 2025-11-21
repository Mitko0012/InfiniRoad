seed.unitsOnCanvas = 20;
colorToClear.blue = 1;
colorToClear.green = 0.5;

let camSpeed = 20;
resourcesToLoad["terrainVert"] = {type: "text", source: "Game/Shaders/terrainVert.glsl"};
resourcesToLoad["terrainFrag"] = {type: "text", source: "Game/Shaders/terrainFrag.glsl"}
onStart = () => {
    camPosY = 2;
    terrainShader = drawingData.createShaderConfig(resourcesToLoad["terrainVert"].value, resourcesToLoad["terrainFrag"].value)
}
onUpdate = () => {updateMatrices(); updateChunk(); camPosZ -= 0.2;};


start("drawing-canvas");