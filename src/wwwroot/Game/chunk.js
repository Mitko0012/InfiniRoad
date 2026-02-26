let viewDistance = 2;
let chunks = {};
let activeChunks = {};
let lastCamChunkX;
let lastCamChunkZ;
let currentCamChunkX;
let currentCamChunkZ;
let chunkLength;
const chunkScale = 16;
const segmentSize = 1;
let chunksToCollapse = [];
let terrainShader;
let roadShader;
let nonPriorityShaderProgram;
let priorityShaderProgram
let priorityMesh;
let nonPriorityMesh;
let priorityTexture;
let nonPriorityTexture;
const maxDist = 5;
roadChunks = chunks;
const roadSignOffset = 1.8;

function registerChunk(xCenter, zCenter) {
    chunks[String(xCenter) + " " + String(zCenter)] = {geometry: {}, pointData: {}, splineData: {}, isActive: false, xCenter, zCenter, hasInit: false} 
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
                    generateData(currentChunk);
                    currentChunk.geometry = generateGeometry(currentChunk);
                    generateRoadGeometry(currentChunk);
                    activeChunks[String(i) + " " + String(j)] = currentChunk;
                }
            }
        collapseChunks(chunksToCollapse);
        chunksToCollapse.forEach(x => { generateData(x); generateRoadGeometry(x); x.geometry = generateGeometry(x)});
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
    let processedSunDirection = linearAlgebra.normalizeVec3(sunDirection);
    processedSunDirection = linearAlgebra.getVector3(-sunDirection[0], -sunDirection[1], -sunDirection[2]);
    terrainShader.setUniform("lightDirection", processedSunDirection);
    chunk.geometry.bind();
    gl.drawElements(gl.TRIANGLES, chunkLength, gl.UNSIGNED_SHORT, 0);
    roadShader.bind();
    roadShader.setUniform("transformationMatrix", linearAlgebra.formatMatrix(transformMatrix));
    roadShader.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
    roadShader.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
    roadShader.setUniform("uSampler", roadTexture);
    chunk.roadGeometry.bind();
    gl.drawElements(gl.TRIANGLES, chunk.roadGeometryLength, gl.UNSIGNED_SHORT, 0);
    if(chunk.tileType === tileTypes.T_INTERSECTION.index) {
        roadShader.setUniform("uSampler", interchangeTexture);
        let interTrnasform = linearAlgebra.multiplyMatrices(linearAlgebra.getTranslationMatrix(chunk.xCenter * chunkScale + chunk.splineData.center.posX, 0, chunk.zCenter * chunkScale + chunk.splineData.center.posZ), linearAlgebra.rotateAroundY(chunk.interchange.angle + Math.PI / 2));
        roadShader.setUniform("transformationMatrix", linearAlgebra.formatMatrix(interTrnasform));
        chunk.interchangeGeometry.bind();
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        let foundNonPrior = false;
        for(let road of chunk.roads) {
            let endPoint = road.points[road.points.length - 1];
            if(equalFloatNumbers(endPoint.posX, chunk.nonPriorityPoint[0]) && equalFloatNumbers(endPoint.posZ, chunk.nonPriorityPoint[1])) {
                let normalizedVec = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-(chunk.splineData.center.posZ - endPoint.posZ), chunk.splineData.center.posX - endPoint.posX));
                let moveVec = linearAlgebra.scaleVector(linearAlgebra.getVector4(normalizedVec[0], 0, normalizedVec[1], 1), roadSignOffset);
                let translationMat = linearAlgebra.getTranslationMatrix(chunk.xCenter * 16 + endPoint.posX + moveVec[0], 0.1, chunk.zCenter * 16 + endPoint.posZ + moveVec[2]);
                let angle = Math.atan2(chunk.splineData.center.posZ - endPoint.posZ, chunk.splineData.center.posX - endPoint.posX);
                if(angle < 0)
                    angle = Math.PI + (angle * -1);
                let transformMat = linearAlgebra.multiplyMatrices(translationMat, linearAlgebra.multiplyMatrices(linearAlgebra.rotateAroundY(angle), linearAlgebra.getTranslationMatrix(0.0, 0.03, 0.03)));
                nonPriorityShaderProgram.bind();
                nonPriorityShaderProgram.setUniform("uSampler", nonPriorityTexture);
                nonPriorityMesh.bind();
                nonPriorityShaderProgram.setUniform("transformationMatrix", linearAlgebra.formatMatrix(transformMat));
                nonPriorityShaderProgram.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
                nonPriorityShaderProgram.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
                nonPriorityShaderProgram.setUniform("lightDirection", processedSunDirection);
                gl.drawElements(gl.TRIANGLES, nonPriorityMesh.getIndexCount(), gl.UNSIGNED_SHORT, 0);
                foundNonPrior = true;
            }
            else {
                let normalizedVec = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-(chunk.splineData.center.posZ - endPoint.posZ), chunk.splineData.center.posX - endPoint.posX));
                let moveVec = linearAlgebra.scaleVector(linearAlgebra.getVector4(normalizedVec[0], 0, normalizedVec[1], 1), roadSignOffset);
                let translationMat = linearAlgebra.getTranslationMatrix(chunk.xCenter * 16 + endPoint.posX + moveVec[0], 0.1, chunk.zCenter * 16 + endPoint.posZ + moveVec[2]);
                let angle = Math.atan2(chunk.splineData.center.posZ - endPoint.posZ, chunk.splineData.center.posX - endPoint.posX);
                if(angle < 0)
                    angle = Math.PI + (angle * -1);
                let transformMat = linearAlgebra.multiplyMatrices(translationMat, linearAlgebra.rotateAroundY(angle));
                priorityShaderProgram.bind();
                priorityShaderProgram.setUniform("uSampler", priorityTexture);
                priorityMesh.bind();
                priorityShaderProgram.setUniform("transformationMatrix", linearAlgebra.formatMatrix(transformMat));
                priorityShaderProgram.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
                priorityShaderProgram.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
                priorityShaderProgram.setUniform("lightDirection", processedSunDirection);
                gl.drawElements(gl.TRIANGLES, priorityMesh.getIndexCount(), gl.UNSIGNED_SHORT, 0);
                foundNonPrior = true;
            }
        }
        if(!foundNonPrior)
            console.log("6u6mar");
    }
}

function getChunkPoint(value) {
    return Math.trunc((value + 8) / 16); 
}

function generateData(chunk) {
    if(chunk.xCenter === 0 && chunk.zCenter === 0)
        console.log(" ");
    tileTypesList[chunk.tileType].generateSplineData(chunk);
    tileTypesList[chunk.tileType].generateRoad(chunk);
}

function generateGeometry(chunk) {
    let vertexData = [];
    let vertices = {};
    let elemData = [];
    let neighbours = [
        chunks[String(chunk.xCenter - 1) + " " + String(chunk.zCenter)],
        chunks[String(chunk.xCenter + 1) + " " + String(chunk.zCenter)],
        chunks[String(chunk.xCenter) + " " + String(chunk.zCenter - 1)],
        chunks[String(chunk.xCenter - 1) + " " + String(chunk.zCenter + 1)]
    ];
    let definedNeighbours = [false, false, false, false];
    let index = 0;
    for(let neighbour of neighbours) {
        if(neighbour !== undefined && neighbour.geometry === null)
            definedNeighbours[index] = true;
        index++;
    }
    const maxHeightNearRoad = 4;
    let vertIndex = 0;
    chunk.leftZHeightData = [];
    chunk.rightZHeightData = [];
    chunk.topXHeightData = [];
    chunk.bottomXHeightData = [];
    for(let x = -8; x < 8; x += segmentSize) {
        let rowData = [];
        vertexData.push(rowData);
        for(let z = -8; z < 8; z += segmentSize) {
            let xValues = [x, x + segmentSize, x, x + segmentSize];
            let zValues = [z, z, z + segmentSize, z + segmentSize];
            for(let i = 0; i < xValues.length; i++) {
                let x = xValues[i];
                let z = zValues[i];
                let roadDistance = Number.MAX_SAFE_INTEGER;
                for(let path of chunk.splineData.paths) {
                    for(let i = 0; i < path.divisions.length; i++) {
                        let vector = linearAlgebra.getVector2(path.divisions[i][0] - x, path.divisions[i][1] - z);
                        let distance = linearAlgebra.getVectorMagnitudeVec2(vector);
                        roadDistance = distance < roadDistance ? distance : roadDistance;
                    }
                }
                let maxHeight = Number.MAX_SAFE_INTEGER;
                if(roadDistance <= 2)
                    maxHeight = -0.1;
                else if (roadDistance < 6)
                    maxHeight = maxHeightNearRoad * (roadDistance - 3) / 3;
                let positionX = (chunk.xCenter * chunkScale + x) / 8;
                let positionY = (chunk.zCenter * chunkScale + z) / 8;
                let heightData = perlin(positionX, positionY, 0);
                heightData = 4 * heightData + 2;
                heightData = Math.min(maxHeight, heightData);
                if(z === minZ && definedNeighbours[2]) {
                    heightData = neighbours[2].rightZHeightData[x + 8];
                }
                if(z === maxZ && definedNeighbours[3]) {
                    heightData = neighbours[3].leftZHeightData[x + 8];
                }
                if(x === minX && definedNeighbours[0]) {
                    heightData = neighbours[0].bottomXHeightData[z + 8];
                }
                if(x === maxX && definedNeighbours[1]) {
                    heightData = neighbours[1].topXHeightData[z + 8];
                }
                if(rowData.length - 2 >= 0)
                    prevHeight = rowData[rowData.length - 2];
                rowData.push([x, heightData, z]);
                if(vertices[x + " " + z] === undefined)
                    vertices[x + " " + z] = [x, heightData, z];
                if(z === minZ)
                    chunk.leftZHeightData.push(heightData);
                if(z === maxZ)
                    chunk.rightZHeightData.push(heightData);
                if(x === minX)
                    chunk.topXHeightData.push(heightData);
                if(x === maxX)
                    chunk.bottomXHeightData.push(heightData);
            }
            elemData.push(vertIndex, vertIndex + 2, vertIndex + 3);
            elemData.push(vertIndex, vertIndex + 1, vertIndex + 3);
            vertIndex += 4;
        }
    }
    let drawData = [];
    let normals = {};
    for(let i = -8; i <= 8; i += segmentSize) {
        let rowData = [];
        for(let j = -8; j <= 8; j += segmentSize) {
            let currentVertex = vertices[i + " " + j];
            let prevNeighbourX = vertices[currentVertex[0] - segmentSize + " " + currentVertex[2]];
            let nextNeighbourX = vertices[currentVertex[0] + segmentSize + " " + currentVertex[2]];
            let prevNeighbourZ = vertices[currentVertex[0] + " " + currentVertex[2] - segmentSize];
            let nextNeighbourZ = vertices[currentVertex[0] + " " + (currentVertex[2] + segmentSize)];
            if(prevNeighbourX === undefined)
                prevNeighbourX = currentVertex;
            if(prevNeighbourZ === undefined)
                prevNeighbourZ = currentVertex;
            if(nextNeighbourX === undefined)
                nextNeighbourX = currentVertex;
            if(nextNeighbourZ === undefined)
                nextNeighbourZ = currentVertex;
            let dhdx = prevNeighbourX[1] - nextNeighbourX[1];
            let dhdz = prevNeighbourZ[1] - nextNeighbourZ[1];
            let dx = linearAlgebra.getVector3(2*segmentSize, dhdx, 0);
            let dz = linearAlgebra.getVector3(0, dhdz, 2*segmentSize);
            let normal = linearAlgebra.normalizeVec3(linearAlgebra.crossVector3(dx, dz));
            normals[i + " " + j] = normal;
        }
    }
    for(let i = 0; i < vertexData.length; i++) {
        for(let j = 0; j < vertexData[i].length; j++) {
            drawData.push(vertexData[i][j][0]);
            drawData.push(vertexData[i][j][1]);
            drawData.push(vertexData[i][j][2]);
            drawData.push(normals[vertexData[i][j][0] + " " + vertexData[i][j][2]][0]);
            drawData.push(normals[vertexData[i][j][0] + " " + vertexData[i][j][2]][1]);
            drawData.push(normals[vertexData[i][j][0] + " " + vertexData[i][j][2]][2]);
        }
    }
    chunkLength = elemData.length;
    return drawingData.createMesh([3, 3], drawData, elemData);
}

function clampStartVert(v, point) {
    const distance = 1.7;
    if(point[0] - minX < 0.0001) {
        v[0][0] = point[0];
        v[1][0] = point[0];
        v[0][2] = point[1] - distance;
        v[1][2] = point[1] + distance;
    }
    else if(maxX - point[0] < 0.0001) {
        v[0][0] = point[0];
        v[1][0] = point[0];
        v[0][2] = point[1] + distance;
        v[1][2] = point[1] - distance;
    }
    else if(point[1] - minZ < 0.0001) {
        if(v[0][0] < v[1][0]) {
            v[0][0] = point[0] - distance;
            v[1][0] = point[0] + distance;
        }
        else {
            v[0][0] = point[0] + distance;
            v[1][0] = point[0] - distance;
        }
        v[0][2] = point[1];
        v[1][2] = point[1];
    } 
    else if(maxZ - point[1] < 0.0001) {
        if(v[0][0] < v[1][0]) {
            v[0][0] = point[0] + distance;
            v[1][0] = point[0] - distance;
        }
        else {
            v[0][0] = point[0] - distance;
            v[1][0] = point[0] + distance;
        }
        v[0][2] = point[1];
        v[1][2] = point[1]
    }
    else
        console.log("ee");
    return v;
}

function clampEndTIntesection(interchange, point, center) {
    let edgeVecs = [
        [0, -1.7],
        [1.7, 0],
        [0, 1.7],
        [-1.7, 0]
    ];
    let rotateMat = linearAlgebra.rotateAroundY(interchange.angle);
    for(let i = 0; i < edgeVecs.length; i++) {
        let vec = edgeVecs[i];
        let rotatedVec = linearAlgebra.multiplyMatrixAndVector(rotateMat, linearAlgebra.getVector4(vec[0], 0, vec[1], 0));
        edgeVecs[i] = linearAlgebra.getVector2(rotatedVec[0], rotatedVec[2]);
    } 
    for(let vec of edgeVecs) {
        let resultVec = linearAlgebra.getVector2(center.posX + vec[0], center.posZ + vec[1]);
        if(equalFloatNumbers(point[0], resultVec[0]) &&
            equalFloatNumbers(point[1], resultVec[1])) {
            let perpVec = linearAlgebra.getVector2(-vec[1], vec[0]);
            let resultArray = [[0, 0, 0], [0, 0, 0]];
            resultArray[0][0] = point[0] + perpVec[0];
            resultArray[0][2] = point[1] + perpVec[1];
            resultArray[1][0] = point[0] - perpVec[0];
            resultArray[1][2] = point[1] - perpVec[1];
            return resultArray;
        }
    }
}

function generateRoadGeometry(chunk) {
    const distance = 1.7;
    const temporaryY = 0.1;
    let elements = [];
    let vertices = [];
    for(let path of chunk.splineData.paths) {
        let prevPoint = path.divisions[0];
        let prevPrevPoint = [path.divisions[0][0], path.divisions[0][1]];
        if(equalFloatNumbers(prevPrevPoint[0], minX))
            prevPrevPoint[0]--;
        else if(equalFloatNumbers(prevPrevPoint[0], maxX))
            prevPrevPoint[0]++;
        else if(equalFloatNumbers(prevPrevPoint[1], minZ))
            prevPrevPoint[1]--;
        else if(equalFloatNumbers(prevPrevPoint[1], maxZ))
            prevPrevPoint[1]++;
        let prevPointVertices = [
            [prevPoint[0], temporaryY, prevPoint[1]],
            [prevPoint[0], temporaryY, prevPoint[1]]
        ];
        prevPointVertices = clampStartVert(prevPointVertices, prevPoint);
        let texturePos = 1;
        let posIncreasing = false;
        let prevNormal = null;
        for(let i = 1; i < path.divisions.length; i++) {
            let point = path.divisions[i];
            let dirPrev = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(prevPoint[0] - prevPrevPoint[0], prevPoint[1] - prevPrevPoint[1]));
            let nextPoint;
            if (i + 1 < path.divisions.length) {
                nextPoint = path.divisions[i + 1];
            } else {
                nextPoint = [
                    point[0] + dirPrev[0],
                    point[1] + dirPrev[1]
                ];
            }
            let dirNext = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(nextPoint[0] - point[0], nextPoint[1] - point[1]));
            let avg = linearAlgebra.addVectors(dirPrev, dirNext);
            let len = linearAlgebra.getVectorMagnitudeVec2(avg);
            if (len < 0.001)
                avg = dirPrev;
            let avgDir = linearAlgebra.normalizeVec2(avg);
            let perp = linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-avgDir[1], avgDir[0]));
            let endPoint;
            if(i < path.divisions.length / 2)
                endPoint = path.divisions[0];
            else
                endPoint = path.divisions[path.divisions.length - 1];
            let distanceToEdge = Math.sqrt(Math.pow(endPoint[0] - point[0], 2) + Math.pow(endPoint[1] - point[1], 2));
            if(distanceToEdge <= maxDist) {
                let minAngle;
                if(chunk.tileType === tileTypes.T_INTERSECTION.index && endPoint === path.divisions[path.divisions.length - 1])
                    minAngle = Math.atan2(endPoint[0] - chunk.splineData.center.posX, endPoint[1] - chunk.splineData.center.posZ)
                else if(equalFloatNumbers(endPoint[0], minX))
                    minAngle = Math.PI / 2;
                else if(equalFloatNumbers(endPoint[0], maxX))
                    minAngle = Math.PI + Math.PI / 2;
                else if(equalFloatNumbers(endPoint[1], minZ))
                    minAngle = Math.PI;
                else
                    minAngle = 0;
                let edgeNormal = linearAlgebra.getVector2(Math.cos(minAngle), Math.sin(minAngle));
                if (prevNormal !== null) {
                    let dot = prevNormal[0] * edgeNormal[0] + prevNormal[1] * edgeNormal[1];
                    if (dot < 0) {
                        edgeNormal[0] *= -1;
                        edgeNormal[1] *= -1;
                    }
                }
                let t = distanceToEdge / maxDist;
                perp = linearAlgebra.normalizeVec2(linearAlgebra.getVector2((perp[0] - edgeNormal[0]) * t + edgeNormal[0], (perp[1] - edgeNormal[1]) * t + edgeNormal[1]));
            }
            if (prevNormal !== null) {
                let dot = prevNormal[0] * perp[0] + prevNormal[1] * perp[1];
                if (dot < 0) {
                    perp[0] *= -1;
                    perp[1] *= -1;
                }
            }
            prevNormal = [...perp];
            let scalingVector = linearAlgebra.scaleVector(perp, distance);
            let pointVertices = [[], [], []];
            pointVertices[0][1] = temporaryY;
            pointVertices[1][1] = temporaryY;
            pointVertices[0][0] = point[0] - scalingVector[0]; 
            pointVertices[0][2] = point[1] - scalingVector[1];
            pointVertices[1][0] = point[0] + scalingVector[0]; 
            pointVertices[1][2] = point[1] + scalingVector[1];
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
            if(posIncreasing)
                texturePos += path.lengths[i] / 3.4;
            else
                texturePos -= path.lengths[i] / 3.4;
            if(texturePos < 0) {
                texturePos = 1 / 2; 
                posIncreasing = true;
            } else if(texturePos > 1) {
                texturePos = 2 / 3;
                posIncreasing = false;
            }
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
    if(chunk.tileType === tileTypes.T_INTERSECTION.index) {
        let interVertices = [-1.7, 0.1, -1.7, 0, 0, -1.7, 0.1, 1.7, 1, 0, 1.7, 0.1, -1.7, 0, 1, 1.7, 0.1, 1.7, 1, 1];
        let interElemts = [0, 1, 2, 1, 2, 3];
        chunk.interchangeGeometry = drawingData.createMesh([3, 2], interVertices, interElemts);
    }
    chunk.roadGeometryLength = elements.length;
    chunk.roadGeometry = drawingData.createMesh([3, 2], vertices, elements);
}

function walkOnRoad(road, point, goingForward) {
    if(road === undefined)
        console.log("");
    let roadPoint;
    let currLength = 0;
    let currPointIndex;
    if(goingForward) {
        roadPoint = road.points[0];
        currPointIndex = 0;
    }
    else {
        roadPoint = road.points[road.points.length - 1];
        currPointIndex = road.points.length - 1;
    }
    while(true) {
        let segment = road.pointSegments[goingForward ? roadPoint.nextIndex : roadPoint.prevIndex];
        if(segment === undefined || point > road.totalLength)
            return {lengthTaken: point - road.totalLength}
        let prevLength = currLength;
        currLength += segment.length;
        if(currLength > point) {
            let distIntoSegment = point - prevLength;
            let nextIndex = goingForward ? currPointIndex + 1 : currPointIndex - 1;
            if(nextIndex >= road.points.length)
                nextIndex = road.points.length - 1;
            if(nextIndex <= -1)
                nextIndex = 0;
            let p0 = linearAlgebra.getVector2(roadPoint.posX, roadPoint.posZ);
            let p1 = linearAlgebra.getVector2(road.points[nextIndex].posX, road.points[nextIndex].posZ);
            let t = distIntoSegment / segment.length;
            return {
                point: linearAlgebra.lerpVec2(p0, p1, t),
                pointData: roadPoint,
                index: currPointIndex,
                segment
            };
        }
        if(goingForward)
            currPointIndex++;
        else
            currPointIndex--;
        roadPoint = road.points[currPointIndex];
    } 
}

function removeChunk(chunk, posX, posZ) {
    chunk.geometry = null;
    chunk.roadGeometry = null;
    chunk.splineData.paths = [];
    delete activeChunks[String(posX) + " " + String(posZ)];
}