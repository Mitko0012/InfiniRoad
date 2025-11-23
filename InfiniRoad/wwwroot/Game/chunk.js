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
    let roadShader;
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
                        currentChunk.geometry = generateGeometry(currentChunk);
                        generateRoadGeometry(currentChunk);
                        activeChunks[String(i) + " " + String(j)] = currentChunk;
                    }
                }
            collapseChunks(chunksToCollapse);
            chunksToCollapse.forEach(x => { generateSplineData(x); generateRoadGeometry(x); x.geometry = generateGeometry(x)});
            chunksToCollapse = [];
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
            for(let i = minX; i <= maxX; i++)
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
        let xOffset = chunk.xCenter * chunkScale;
        let zOffset = chunk.zCenter * chunkScale;
        const transformMatrix = linearAlgebra.getTranslationMatrix(xOffset, 0, zOffset);
        
        gl.enable(gl.DEPTH_TEST);
        terrainShader.bind();
        terrainShader.setUniform("transformationMatrix", linearAlgebra.formatMatrix(transformMatrix));
        terrainShader.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
        terrainShader.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
        chunk.geometry.bind();
        gl.drawElements(gl.TRIANGLES, chunkLength, gl.UNSIGNED_SHORT, 0);
        roadShader.bind();
        roadShader.setUniform("transformationMatrix", linearAlgebra.formatMatrix(transformMatrix));
        roadShader.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
        roadShader.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
        roadShader.setUniform("uSampler", roadTexture);
        chunk.roadGeometry.bind();
        gl.drawElements(gl.TRIANGLES, chunk.roadGeometryLength, gl.UNSIGNED_SHORT, 0);
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

    function generateGeometry(chunk) {
        let vertexData = [];
        let elemData = [];
        const maxHeight = 4;
        const maxHeightNearRoad = 0.8;
        let vertIndex = 0;
        for(let x = -8; x < 8; x += segmentSize) {
            for(let z = -8; z < 8; z += segmentSize) {
                let roadDistance = Number.MAX_SAFE_INTEGER;
                for(let path of chunk.splineData.paths) {
                    for(let i = 0; i < path.divisions.length; i++) {
                        let vector = linearAlgebra.getVector2(path.divisions[i][0] - x, path.divisions[i][1] - z);
                        let distance = linearAlgebra.getVectorMagnitudeVec2(vector);
                        roadDistance = distance < roadDistance ? distance : roadDistance;
                    }
                }
                let maxHeight = Number.MAX_SAFE_INTEGER;
                if(roadDistance <= 2.4) {
                    maxHeight = -0.5;
                } else if (roadDistance < 6) {
                    maxHeight = maxHeightNearRoad * (roadDistance - 3) / 3;
                }
                let positionX = chunk.xCenter + x / 16;
                let positionY = chunk.xCenter + z / 16;
                let heightData = perlin(positionX, positionY);
                heightData = 2*(heightData + 1);
                heightData = Math.min(maxHeight, heightData);
                let prevHeight = heightData;
                if(vertexData.length - 2 >= 0)
                    prevHeight = vertexData[vertexData.length - 2];
                vertexData.push(x, prevHeight, z);
                vertexData.push(x + segmentSize, prevHeight, z);
                vertexData.push(x, heightData, z + segmentSize);
                vertexData.push(x + segmentSize, heightData, z + segmentSize);
                elemData.push(vertIndex, vertIndex + 2, vertIndex + 3);
                elemData.push(vertIndex, vertIndex + 1, vertIndex + 3);
                vertIndex += 4;
            }
        }
        chunkLength = elemData.length;
        return drawingData.createMesh([3], vertexData, elemData);
    }

    function clampVert(v, point) {
        const distance = 1.7;
        if(v[0][0] <= minX) {
            v[0][0] = point[0];
            v[0][2] = point[1] - distance;
        }
        if(v[1][0] <= minX) {
            v[1][0] = point[0];
            v[1][2] = point[1] + distance;
        }
        if(v[0][0] >= maxX) {
            v[0][0] = point[0];
            v[0][2] = point[1] - distance;
        }
        if(v[1][0] >= maxX) {
            v[1][0] = point[0];
            v[1][2] = point[1] + distance;
        }
        if(v[0][2] <= minZ) {
            v[0][0] = point[0] + distance;
            v[0][2] = point[1];
        } 
        if(v[1][2] <= minZ) {
            v[1][0] = point[0] - distance;
            v[1][2] = point[1];
        }
        if(v[0][2] >= maxZ) {
            v[0][0] = point[0] + distance;
            v[0][2] = point[1];
        }
        if(v[1][2] >= maxZ) {
            v[1][0] = point[0] + distance;
            v[1][2] = point[1];
        }
        return v;
    }

    function clampRegVert(v, point) {
        const distance = 1.7;
        if(v[0][0] <= minX) {
            v[0][0] = point[0];
            v[0][2] = point[1] - distance;
        }
        if(v[1][0] <= minX) {
            v[1][0] = point[0];
            v[1][2] = point[1] + distance;
        }
        if(v[0][0] >= maxX) {
            v[0][0] = point[0];
            v[0][2] = point[1] + distance;
        }
        if(v[1][0] >= maxX) {
            v[1][0] = point[0];
            v[1][2] = point[1] - distance;
        }
        if(v[0][2] <= minZ) {
            v[0][0] = point[0] - distance;
            v[0][2] = point[1];
        } 
        if(v[1][2] <= minZ) {
            v[1][0] = point[0] + distance;
            v[1][2] = point[1];
        }
        if(v[0][2] >= maxZ) {
            v[0][0] = point[0] + distance;
            v[0][2] = point[1];
        }
        if(v[1][2] >= maxZ) {
            v[1][0] = point[0] - distance;
            v[1][2] = point[1];
        }
        return v;
    }

    function clampEndVert(v, point) {
        const distance = 1.7;
        if(point[0] - minX < 0.0001) {
            v[0][0] = point[0];
            v[0][2] = point[1] - distance;
            v[1][0] = point[0];
            v[1][2] = point[1] +     distance;
        }
        if(maxX - point[0] < 0.0001) {
            v[0][0] = point[0];
            v[0][2] = point[1] - distance;
            v[1][0] = point[0];
            v[1][2] = point[1] + distance;
        }
        if(point[1] - minZ < 0.0001) {
            v[0][0] = point[0] - distance;
            v[0][2] = point[1];
            v[1][0] = point[0] + distance;
            v[1][2] = point[1];
        } 
        if(maxZ - point[1] < 0.0001) {
            v[0][0] = point[0] + distance;
            v[0][2] = point[1];
            v[1][0] = point[0] - distance;
            v[1][2] = point[1];
        }
        return v;
    }

    function generateRoadGeometry(chunk) {
        const distance = 1.7;
        const temporaryY = 0.1;
        let elements = [];
        let vertices = [];  
        for(let path of chunk.splineData.paths) {
            let prevPoint = path.divisions[0];
            let prevPrevPoint = path.divisions[0];
            let prevPointVertices = [
                [prevPoint[0], temporaryY, prevPoint[1]],
                [prevPoint[0], temporaryY, prevPoint[1]]
            ];
            prevPointVertices[0][1] = temporaryY;
            prevPointVertices[1][1] = temporaryY;
            prevPointVertices = clampVert(prevPointVertices, prevPoint);
            let texturePos = 1;
            for(let i = 1; i < path.divisions.length; i++) {
                let point = path.divisions[i];
                let nextPoint;
                if (i + 1 < path.divisions.length) {
                    nextPoint = path.divisions[i + 1];
                } else {
                    nextPoint = linearAlgebra.getVector2(
                        point[0] * 2 - prevPoint[0],
                        point[1] * 2 - prevPoint[1]
                    );
                }
                let dirPrev = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(prevPoint[0] - prevPrevPoint[0], prevPoint[1] - prevPrevPoint[1]));
                let dirNext = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(nextPoint[0] - point[0], nextPoint[1] - point[1]));
                let avgDir = linearAlgebra.normalizeVec2(linearAlgebra.addVectors(dirPrev, dirNext));
                let scalingVector = linearAlgebra.scaleVector(linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-avgDir[1], avgDir[0])), distance);
                let pointVertices = [[], [], []];
                pointVertices[0][1] = temporaryY;
                pointVertices[1][1] = temporaryY;
                pointVertices[0][0] = point[0] - scalingVector[0]; 
                pointVertices[0][2] = point[1] - scalingVector[1];
                pointVertices[1][0] = point[0] + scalingVector[0]; 
                pointVertices[1][2] = point[1] + scalingVector[1];
                if(i === path.divisions.length - 2)
                    console.log("");
                if(i === path.divisions.length - 1)
                    pointVertices = clampEndVert(pointVertices, point);
                else
                    pointVertices = clampRegVert(pointVertices, point);
                let base = vertices.length / 5;
                vertices.push(prevPointVertices[0][0]);
                vertices.push(prevPointVertices[0][1]);
                vertices.push(prevPointVertices[0][2]);
                vertices.push(0);
                vertices.push(texturePos);
                vertices.push(prevPointVertices[1][0]);
                vertices.push(prevPointVertices[1][1]);
                vertices.push(prevPointVertices[1][2]);
                vertices.push(1);
                vertices.push(texturePos);
                texturePos -= path.lengths[i] / 3.4;
                if(texturePos < 0)
                    texturePos = 1;             
                vertices.push(pointVertices[0][0]);
                vertices.push(pointVertices[0][1]);
                vertices.push(pointVertices[0][2]);
                vertices.push(0);
                vertices.push(texturePos);
                vertices.push(pointVertices[1][0]);
                vertices.push(pointVertices[1][1]);
                vertices.push(pointVertices[1][2]);
                vertices.push(1);
                vertices.push(texturePos);
                elements.push(base);
                elements.push(base + 1);
                elements.push(base + 2);
                elements.push(base + 1);
                elements.push(base + 2);
                elements.push(base + 3);
                prevPointVertices = pointVertices;
                prevPrevPoint = [...prevPoint];
                prevPoint = [...point];
            }
        }
        chunk.roadGeometryLength = elements.length;
        chunk.roadGeometry = drawingData.createMesh([3, 2], vertices, elements);
    }

    function configureRoadShader() {

    }

    function removeChunk(chunk, posX, posZ) {
        chunk.geometry = null;
        chunk.roadGeometry = null;
        chunk.splineData.paths = [];
        delete activeChunks[String(posX) + " " + String(posZ)];
    }