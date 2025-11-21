let viewDistance = 2;
let chunks = {};
let activeChunks = {};
let lastCamChunkX;
let lastCamChunkZ;
let currentCamChunkX;
let currentCamChunkZ;
let chunkLength;
const chunkScale = 16;
const segmentSize = 0.25;
let chunksToCollapse = [];
let terrainShader;
roadChunks = chunks;

function registerChunk(xCenter, zCenter) {
    chunks[String(xCenter) + " " + String(zCenter)] = {geometry: {}, pointData: {}, splineData: {}, isActive: false, xCenter, zCenter, hasInit: false} 
    let currentChunk = chunks[String(xCenter) + " " + String(zCenter)];
    chunksToCollapse.push(chunks[String(xCenter) + " " + String(zCenter)]);
}

function updateChunk() {
    currentCamChunkX = getChunkPoint(camPosX);
    currentCamChunkZ = getChunkPoint(camPosZ);
    if(currentCamChunkX !== lastCamChunkX || currentCamChunkZ !== lastCamChunkZ) {
        for(let i = currentCamChunkX - viewDistance; i <= currentCamChunkX + viewDistance; i++)
            for(let j = currentCamChunkZ - viewDistance; j <= currentCamChunkZ + viewDistance; j++) {
                let currentChunk = chunks[String(i) + " " + String(j)];
                if(currentChunk === undefined) {
                    registerChunk(i, j);
                    currentChunk = chunks[String(i) + " " + String(j)];
                    currentChunk.isActive = true;
                    activeChunks[String(i) + " " + String(j)] = currentChunk;
                } else if(!currentChunk.isActive) {
                    currentChunk.isActive = true;
                    generateSplineData(currentChunk);
                    currentChunk.geometry = generateGeometry();
                    generateRoadGeometry(currentChunk);
                    activeChunks[String(i) + " " + String(j)] = currentChunk;
                }
            }
        collapseChunks(chunksToCollapse);
        chunksToCollapse.forEach(x => { generateSplineData(x); generateRoadGeometry(x); x.geometry = generateGeometry()});
        chunksToCollapse = [];
        let xDifference = Math.abs(currentCamChunkX - lastCamChunkX);
        let zDifference = Math.abs(currentCamChunkZ - lastCamChunkZ);
        let minX = lastCamChunkX - viewDistance;
        let maxX = lastCamChunkX + viewDistance;
        let minZ = lastCamChunkZ - viewDistance;
        let maxZ = lastCamChunkZ + viewDistance;
        let currentMinX = currentCamChunkX - viewDistance;
        let currentMaxX = currentCamChunkX + viewDistance;
        let currentMinZ = currentCamChunkZ - viewDistance;
        let currentMaxZ = currentCamChunkZ + viewDistance;
        
        let firstStartX;
        let firstEndX;

        if(currentMinX > minX) {
            firstStartX = minX;
            firstEndX = currentMinX;
        }
        else if(maxX > currentMaxX) {
            firstStartX = currentMaxX + 1;
            firstEndX = maxX + 1;
        }

        for(let i = firstStartX; i < firstEndX; i++)
            for(let j = minZ; j <= maxZ; j++) {
                let chunk = chunks[String(i) + " " + String(j)];
                if(chunk !== undefined) {
                    removeChunk(chunk, i, j);
                    chunk.isActive = false;
                }
            }

        let secondStartZ;
        let secondEndZ;

        if(currentMinZ > minZ) {
            secondStartZ = minZ;
            secondEndZ = currentMinZ;
        }
        else if(maxZ > currentMaxZ) {
            secondStartZ = currentMaxZ + 1;
            secondEndZ = maxZ + 1;
        }
        for(let i = minX; i <=  maxX; i++)
            for(let j = secondStartZ; j < secondEndZ; j++) {
                let chunk = chunks[String(i) + " " + String(j)];
                if(chunk !== undefined) {
                    removeChunk(chunk, i, j);
                    chunk.isActive = false;
                }
            }
    }
    lastCamChunkX = currentCamChunkX;
    lastCamChunkZ = currentCamChunkZ;
    for(let chunk of Object.values(activeChunks))
        drawChunk(chunk);
}

function drawChunk(chunk) {
    let rect = seed.emptyRectangle(chunk.xCenter * chunkScale - chunkScale / 2, chunk.zCenter * chunkScale - chunkScale / 2, chunkScale, chunkScale, 0.2, "green");
    //rect.draw();
    let pos = seed.text(chunk.xCenter * chunkScale - chunkScale / 2, chunk.zCenter * chunkScale - chunkScale / 2, 4, "arial", String(chunk.xCenter) + " " + String(chunk.zCenter));
    //pos.draw();

    let xOffset = chunk.xCenter * chunkScale;
    let zOffset = chunk.zCenter * chunkScale;
    const transformMatrix = linearAlgebra.getTranslationMatrix(chunk.xCenter + xOffset, 0, chunk.zCenter + zOffset);
    
    terrainShader.bind();
    terrainShader.setUniform("transformationMatrix", linearAlgebra.formatMatrix(transformMatrix));
    terrainShader.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
    terrainShader.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
    chunk.roadGeometry.bind();
    gl.drawElements(gl.TRIANGLES, chunk.roadGeometryLength / 3, gl.UNSIGNED_SHORT, 0);
    
    for(let i = 2; i < chunk.roadGeometry.length; i += 3) { 
        //seed.line(chunk.roadGeometry[i - 2][0] + xOffset, chunk.roadGeometry[i - 2][1] + zOffset, chunk.roadGeometry[i - 1][0] + xOffset, chunk.roadGeometry[i - 1][1] + zOffset, 0.01, "black").draw();
        //seed.line(chunk.roadGeometry[i - 2][0] + xOffset, chunk.roadGeometry[i - 2][1] + zOffset, chunk.roadGeometry[i][0] + xOffset, chunk.roadGeometry[i][1] + zOffset, 0.01, "black").draw();
        //seed.line(chunk.roadGeometry[i - 1][0] + xOffset, chunk.roadGeometry[i - 1][1] + zOffset, chunk.roadGeometry[i][0] + xOffset, chunk.roadGeometry[i][1] + zOffset, 0.01, "black").draw();
    }
    
}

function getChunkPoint(value) {
    return Math.trunc((value + 8) / 16); 
}

function generateSplineData(chunk) {
    switch(chunk.tileType) {
        case(0):
            tileTypes.STRAIGHT.generateSplineData(chunk);
        case(2):
            tileTypes.T_INTERSECTION.generateSplineData(chunk);
    }
}

function generateGeometry() {
    let vertexData = [];
    let elemData = [];
    let vertIndex = 0;
    for(let x = -8; x < 8; x += segmentSize) {
        for(let z = -8; z < 8; z += segmentSize) {
            vertexData.push(x, 0, z);
            vertexData.push(x + segmentSize, 0, z);
            vertexData.push(x, 0, z + segmentSize);
            vertexData.push(x + segmentSize, 0, z + segmentSize);
            elemData.push(vertIndex, vertIndex + 2, vertIndex + 3);
            elemData.push(vertIndex, vertIndex + 1, vertIndex + 3);
            vertIndex += 4;
        }
    }
    chunkLength = elemData.length;
    return drawingData.createMesh([3], vertexData, elemData);
}

function generateRoadGeometry(chunk) {
    const distance = 1.7;
    const temporaryY = 0.7;
    for(let path of chunk.splineData.paths) {
        let prevPoint = path.divisions[0];
        let prevPointVertices = [[], []];
        let vertices = [];
        if(prevPoint[0] === minX) {
            prevPointVertices[0][0] = prevPoint[0];
            prevPointVertices[1][0] = prevPoint[0];
            prevPointVertices[0][2] = prevPoint[1] + distance; 
            prevPointVertices[1][2] = prevPoint[1] - distance;
        } else if(prevPoint[0] === maxX) {
            prevPointVertices[0][0] = prevPoint[0];
            prevPointVertices[1][0] = prevPoint[0];
            prevPointVertices[0][2] = prevPoint[1] - distance; 
            prevPointVertices[1][2] = prevPoint[1] + distance;
        } else if(prevPoint[1] === minZ) {
            prevPointVertices[0][0] = prevPoint[0] + distance;
            prevPointVertices[1][0] = prevPoint[0] - distance;
            prevPointVertices[0][2] = prevPoint[1]; 
            prevPointVertices[1][2] = prevPoint[1];
        } else if(prevPoint[1] === maxZ) {
            prevPointVertices[0][0] = prevPoint[0] - distance;
            prevPointVertices[1][0] = prevPoint[0] + distance;
            prevPointVertices[0][2] = prevPoint[1]; 
            prevPointVertices[1][2] = prevPoint[1];
        }
        for(let i = 1; i < path.divisions.length; i++) {
            let point = path.divisions[i];
            console.log(i);
            let scalingVector = linearAlgebra.scaleVector(linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-(point[1] - prevPoint[1]), point[0] - prevPoint[0])), distance);
            let pointVertices = [[], [], []];
            pointVertices[0][1] = temporaryY;
            pointVertices[1][1] = temporaryY;
            pointVertices[0][0] = point[0] - scalingVector[0]; 
            pointVertices[0][2] = point[1] - scalingVector[1];
            pointVertices[1][0] = point[0] + scalingVector[0]; 
            pointVertices[1][2] = point[1] + scalingVector[1];
            if(i === path.divisions.length - 1) {
                if(Math.round(point[0]) === minX) {
                    pointVertices[0][0] = point[0];
                    pointVertices[1][0] = point[0];
                    pointVertices[0][2] = point[1] + distance; 
                    pointVertices[1][2] = point[1] - distance;
                } else if(Math.round(point[0]) === maxX) {
                    pointVertices[0][0] = point[0];
                    pointVertices[1][0] = point[0];
                    pointVertices[0][2] = point[1] - distance; 
                    pointVertices[1][2] = point[1] + distance;
                } else if(Math.round(point[1]) === minZ) {
                    pointVertices[0][0] = point[0] - distance;
                    pointVertices[1][0] = point[0] + distance;
                    pointVertices[0][2] = point[1]; 
                    pointVertices[1][2] = point[1];
                } else if(Math.round(point[1]) === maxZ) {
                    pointVertices[0][0] = point[0] + distance;
                    pointVertices[1][0] = point[0] - distance;
                    pointVertices[0][2] = point[1]; 
                    pointVertices[1][2] = point[1];
                }
            }
            for(let i = 0; i < pointVertices.length; i++) {
                let vertex = pointVertices[i];
                if(vertex[0] > maxX)
                    vertex[0] = maxX;
                else if(vertex[0] < minX) 
                    vertex[0] = minX;
                if(vertex[2] > maxZ) 
                    vertex[2] = maxZ;
                else if(vertex[2] < minZ)
                    vertex[2] = minX
            }
            vertices.push(prevPointVertices[0][0]);
            vertices.push(prevPointVertices[0][1]);
            vertices.push(prevPointVertices[0][2]);
            vertices.push(pointVertices[0][0]);
            vertices.push(pointVertices[0][1]);
            vertices.push(pointVertices[0][2]);
            vertices.push(pointVertices[1][0]);
            vertices.push(pointVertices[1][1]);
            vertices.push(pointVertices[1][2]);
            vertices.push(prevPointVertices[0][0]);
            vertices.push(prevPointVertices[0][1]);
            vertices.push(prevPointVertices[0][2]);
            vertices.push(prevPointVertices[1][0]);
            vertices.push(prevPointVertices[1][1]);
            vertices.push(prevPointVertices[1][2]);
            vertices.push(pointVertices[1][0]);
            vertices.push(pointVertices[1][1]);
            vertices.push(pointVertices[1][2]);
            prevPointVertices = pointVertices;
            prevPoint = point;
        }
        let elements = [];
        for(let i = 0; i < vertices.length; i++)
            elements.push(i);
        chunk.roadGeometryLength = vertices.length;
        chunk.roadGeometry = drawingData.createMesh([3], vertices, elements);
    }
}

function configureRoadShader() {

}

function removeChunk(chunk, posX, posZ) {
    chunk.geometry = null;
    chunk.roadGeometry = null;
    chunk.splineData.paths = [];
    delete activeChunks[String(posX) + " " + String(posZ)];
}