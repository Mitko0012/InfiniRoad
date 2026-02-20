function startRender() {
    const canvas = document.getElementById("road-canvas");
    const ctx = canvas.getContext("2d");
    console.log("patkan");
    const strokeSize = 0.5;
    const visiblePoints = 16 * 4;
    const selectionScale = 20;
    const spawnButton = document.getElementById("spawn-button");
    let isClicking = false;

    canvas.onclick =  () => isClicking = true;
    
    let selectionData = {chunk: undefined, road: undefined, point: undefined};

    spawnButton.onclick = () => {
        clearUI();
        gameStarted = true;
        playerCarX = selectionData.chunk.xCenter * 16 + selectionData.point.posX;
        playerCarZ = selectionData.chunk.zCenter * 16 + selectionData.point.posZ;
    };
    
    const renderFunc = () => {
        if(canvas.width !== canvas.clientWidth)
            canvas.width = canvas.clientWidth;
        if(canvas.height !== canvas.clientHeight)
            canvas.height = canvas.clientHeight;
        const unitSize = Math.max(canvas.width, canvas.height) / visiblePoints;
        let checkingX = 0;
        let accumulatedXValue = 0;
        let chunksToDraw = [];
        let toChangeX = 16;
        if(isClicking) {
            let canvasRect = canvas.getBoundingClientRect();
            let relativeMousePos = {posX: (mouseData.posX - canvasRect.x - canvasRect.width / 2) / unitSize, posY: (mouseData.posY - canvasRect.y - canvasRect.height / 2) / unitSize};
            let chunkData = {posX: Math.round(relativeMousePos.posX / 16), posZ: Math.round(relativeMousePos.posY / 16)};
            let chunk = chunks[String(chunkData.posX) + " " + String(chunkData.posZ)];
            let convertedX = relativeMousePos.posX - chunkData.posX * 16;
            let convertedZ = relativeMousePos.posY - chunkData.posZ * 16;
            let lastClosestPoint;
            let lastRoad;
            let mouseVec = linearAlgebra.getVector2(convertedX, convertedZ);
            if(chunk !== undefined && chunk.roads !== undefined)
                for(let road of chunk.roads)
                    for(let point of road.points) {
                        if(lastClosestPoint === undefined ||
                        linearAlgebra.vector2Distance(mouseVec, linearAlgebra.getVector2(point.posX, point.posZ)) <
                        linearAlgebra.vector2Distance(mouseVec, linearAlgebra.getVector2(lastClosestPoint.posX, lastClosestPoint.posZ))) {
                            lastClosestPoint = point;
                            if(lastRoad !== road)
                                lastRoad = road;
                        }
                    }
            if(lastRoad !== undefined) {
                selectionData.chunk = chunk;
                selectionData.road = lastRoad;
                selectionData.point = lastClosestPoint;
            }
        }
        while(true) {
            let checkingZ = 0;
            let toChangeZ = 16;
            let accumulatedZValue = 0;
            while(true) {
                let checkingChunk = chunks[String(checkingX) + " " + String(checkingZ)];
                if(checkingChunk === undefined) {
                    chunks[String(checkingX) + " " + String(checkingZ)] = {geometry: {}, pointData: {}, splineData: {}, isActive: false, xCenter: checkingX, zCenter: checkingZ, hasInit: false} 
                    generateData(checkingChunk);
                    checkingChunk.geometry = generateGeometry(checkingChunk); 
                    generateRoadGeometry(checkingChunk);
                    collapseChunks([checkingChunk]);
                    checkingChunk = chunks[String(checkingX) + " " + String(checkingZ)];
                }
                if(!checkingChunk.isActive) {
                    checkingChunk.isActive = true;
                    generateData(checkingChunk);
                    checkingChunk.geometry = generateGeometry(checkingChunk); 
                    generateRoadGeometry(checkingChunk);
                }
                chunksToDraw.push(checkingChunk);
                accumulatedZValue += toChangeZ;
                checkingZ += toChangeZ / 16;
                if(accumulatedZValue >= visiblePoints / 2) {
                    checkingZ = -1;
                    toChangeZ *= -1;
                    accumulatedZValue = -16;
                }
                if(accumulatedZValue <= - (visiblePoints / 2))
                    break;
            }
            checkingX += toChangeX / 16;
            accumulatedXValue += toChangeX;
            if(accumulatedXValue >= visiblePoints / 2) {
                checkingX = -1;
                toChangeX *= -1;
                accumulatedXValue = -16;    
            }
            if(accumulatedXValue <= - (visiblePoints / 2))
                break;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for(let chunk of chunksToDraw) {
            ctx.lineWidth = strokeSize * unitSize; 
            ctx.strokeStyle = "white";
            if(chunk.roads === undefined)
                continue;
            for(let road of Object.values(chunk.roads)) {
                let prevPoint = road.points[0]; 
                ctx.beginPath();
                for(let i = 1; i < road.points.length - 1; i++) {
                    let point = road.points[i];
                    ctx.moveTo(canvas.width / 2 + (chunk.xCenter * 16 + prevPoint.posX) * unitSize, canvas.height / 2 + (chunk.zCenter * 16 + prevPoint.posZ) * unitSize);
                    ctx.lineTo(canvas.width / 2 + (chunk.xCenter * 16 + point.posX) * unitSize, canvas.height / 2 + (chunk.zCenter * 16 + point.posZ) * unitSize)
                    prevPoint = point;
                }
                ctx.stroke();
            }
        }
        if(selectionData.chunk !== undefined) {
            ctx.strokeStyle = "green";
            ctx.beginPath();
            ctx.ellipse(
                (selectionData.chunk.xCenter * 16 + selectionData.point.posX) * unitSize + canvas.width / 2,
                (selectionData.chunk.zCenter * 16 + selectionData.point.posZ) * unitSize + canvas.height / 2,
                selectionScale / 2,
                selectionScale / 2, 0, 0, 2 * Math.PI
            );
            ctx.stroke();
            spawnButton.style.display = "block";
        }
        isClicking = false;
        window.requestAnimationFrame(renderFunc);
    };
    window.requestAnimationFrame(renderFunc);
}