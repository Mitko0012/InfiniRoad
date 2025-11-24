    colorToClear.blue = 1;
    colorToClear.green = 0.5;
    const vel = 6;

    let camSpeed = 20;
    let roadTexture;
    resourcesToLoad["terrainVert"] = {type: "text", source: "Game/Shaders/terrainVert.glsl"};
    resourcesToLoad["terrainFrag"] = {type: "text", source: "Game/Shaders/terrainFrag.glsl"};
    resourcesToLoad["roadVert"] = {type: "text", source: "Game/Shaders/roadVert.glsl"};
    resourcesToLoad["roadFrag"] = {type: "text", source: "Game/Shaders/roadFrag.glsl"};
    resourcesToLoad["roadTexture"] = {type: "image", source: "Textures/road_texture.png"};
    onStart = () => {
        sunDirection[0] = 0.3; 
        camAngleX = 330;
        camAngleY = 0;
        camPosY = 10;
        terrainShader = drawingData.createShaderConfig(resourcesToLoad["terrainVert"].value, resourcesToLoad["terrainFrag"].value)
        roadShader = drawingData.createShaderConfig(resourcesToLoad["roadVert"].value, resourcesToLoad["roadFrag"].value);
        roadTexture = drawingData.textureFromImage(resourcesToLoad["roadTexture"].value);
    }
    onUpdate = () => {
        updateMatrices(); 
        updateChunk(); 
        camPosZ += vel * deltaTime; 
    }

    start("drawing-canvas");