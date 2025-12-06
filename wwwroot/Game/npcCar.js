const maxSpeed = 8;
const minSpeed = 2;
const backDist = 2;
const minSafeDist = 5;

class NpcCar {
    constructor(chunk, road, posOnRoad, facing) {
        this.roadHistory = [];
        this.currRoad = road;
        this.currChunk = chunk;
        this.roadHistory.push(road);
        this.facing = facing;
        this.currPoint = walkOnRoad(road, posOnRoad, facing);
        this.pointIndex = posOnRoad;
        this.isActive = true;
        let pv = this.getPerpDirVec();
        this.perpVec = pv.perp;
        this.dirVec = pv.dir;
        this.speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        this.mesh = drawingData.parseObj(resourcesToLoad["carModel"].value, true, true, false);
        this.texture = drawingData.textureFromImage(resourcesToLoad["carTexture"].value);
    }

    getPerpDirVec() {
        let start;
        let end;
        if(this.pointIndex - 1.3 < 0) {
            start = 0;
            end = 2.6;
        }
        else if(this.pointIndex + 1.3 > this.currRoad.totalLength - 0.01) {
            start = this.currRoad.totalLength - 2.61;
            end = this.currRoad.totalLength - 0.01;
        }
        else {
            start = this.pointIndex - 1.3;
            end = this.pointIndex + 1.3;
        }
        let startPoint = walkOnRoad(this.currRoad, start, this.facing);
        let endPoint = walkOnRoad(this.currRoad, end, this.facing);
        return {
            perp: linearAlgebra.scaleVector(linearAlgebra.normalizeVec2(linearAlgebra.getVector2(-(endPoint.point[1] - startPoint.point[1]), endPoint.point[0] - startPoint.point[0])), 0.6),
            dir: linearAlgebra.normalizeVec2(linearAlgebra.getVector2((endPoint.point[0] - startPoint.point[0]), (endPoint.point[1] - startPoint.point[1])))
        }; 
    }

    update() {
        let freeDist = this.index === undefined? minSafeDist : this.checkFree(this.index);
        let vel = maxSpeed * (freeDist / minSafeDist);
        vel = Math.min(vel, this.speed);
        this.pointIndex += (vel * deltaTime);
        let point = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
        if(point.lengthTaken !== undefined) {
            let edgePoint = this.currRoad.points[this.facing ? this.currRoad.points.length - 1 : 0];
            let nextChunk = chunks[String(edgePoint.nextChunkData[0]) + " " + String(edgePoint.nextChunkData[1])];
            if(nextChunk !== undefined && nextChunk.geometry !== null) {
                for(let segment of this.currRoad.takenSegments) {
                    // Temporary code
                    for(let direction of Object.values(segment)) {
                        if(segment.left === this) 
                            segment.left = null;
                        if(segment.right === this) 
                            segment.right = null;
                    }
                }
                this.currChunk = nextChunk;
                this.currRoad = nextChunk.roads[0];
                this.pointIndex = point.lengthTaken;
                let startPoint = this.currRoad.points[0];
                let endPoint = this.currRoad.points[this.currRoad.points.length - 1];
                if(
                    (
                        (endPoint.posX - edgePoint.posX < 0.001 && endPoint.posX - edgePoint.posX > -0.001) &&
                        (!(endPoint.posX - minX < 0.001 && endPoint.posX - minX > -0.001) && !(endPoint.posX - maxX < 0.001 && endPoint.posX - maxX > -0.001))
                    ) ||
                    (
                        (endPoint.posZ - edgePoint.posZ < 0.001 && endPoint.posZ - edgePoint.posZ > -0.001) &&
                        (!(endPoint.posZ - minZ < 0.001 && endPoint.posZ - minZ > -0.001) && !(endPoint.posZ - maxZ < 0.001 && endPoint.posZ - maxZ > -0.001))
                    )
                )
                    this.facing = false;
                else
                    this.facing = true;
            }
            else {
                this.isActive = false;
                return;
            }
        }
        point = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
        this.index = point.segment.index;
        let pv = this.getPerpDirVec();
        this.perpVec = pv.perp;
        this.dirVec = pv.dir;
        let walked = walkOnRoad(this.currRoad, this.pointIndex, this.facing);
        let index;
        this.currPoint = linearAlgebra.getVector2(walked.point[0] + this.perpVec[0], walked.point[1] + this.perpVec[1]);
        this.currRoad.takenSegments[point.segment.index][this.facing ? "right" : "left"] = this;    
        if(this.facing) {
            for(let i = 1; i <= backDist; i++) {
                index = point.segment.index - i;
                if(index < 0)
                    break;
                this.currRoad.takenSegments[index][this.facing ? "right" : "left"] = this;
            }
            index--;
            while(index >= 0) {
                if(this.currRoad.takenSegments[index][this.facing ? "right" : "left"] == this)
                    this.currRoad.takenSegments[index][this.facing ? "right" : "left"] = null;
                index--;
            }
        }
        else {
            for(let i = 1; i <= backDist; i++) {
                index = point.segment.index + i;
                if(index >= this.currRoad.takenSegments.length)
                    break;
                this.currRoad.takenSegments[index][this.facing ? "right" : "left"] = this;
            }
            index++;
            while(index < this.currRoad.takenSegments.length) {
                if(this.currRoad.takenSegments[index][this.facing ? "right" : "left"] == this)
                    this.currRoad.takenSegments[index][this.facing ? "right" : "left"] = null;
                index++;
            }
        }
    }

    render() {
        let shaderProgram = drawingData.createShaderConfig(resourcesToLoad["carVert"].value, resourcesToLoad["carFrag"].value);
        let angle = Math.atan2(this.dirVec[1], this.dirVec[0]); 
        let rotationMatirx = linearAlgebra.rotateAroundY(Math.PI/2 - angle);
        let translationMatrix = linearAlgebra.getTranslationMatrix(this.currChunk.xCenter * 16 + this.currPoint[0], 0.3, this.currChunk.zCenter * 16 + this.currPoint[1]);
        shaderProgram.bind();
        shaderProgram.setUniform("transformationMatrix", linearAlgebra.formatMatrix(linearAlgebra.multiplyMatrices(translationMatrix, rotationMatirx)));
        shaderProgram.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
        shaderProgram.setUniform("projectionMatrix", linearAlgebra.formatMatrix(projMatrix));
        shaderProgram.setUniform("uSampler", this.texture);
        this.mesh.bind();
        gl.drawElements(gl.TRIANGLES, this.mesh.getVertexCount(), gl.UNSIGNED_SHORT, 0);
    }

    checkFree(index) {
        let distance = 0;
        let currentlyFacing = this.facing;
        let road = this.currRoad;
        let checkingChunk = this.currChunk;
        let i = currentlyFacing? index + 1 : index - 1;
        while(true) {
            if((currentlyFacing && i >= road.takenSegments.length) || (!currentlyFacing && i <= 0)) {
                let x = checkingChunk.xCenter;
                let z = checkingChunk.zCenter;
                let endPoint = currentlyFacing? road.points[road.points.length - 1] : road.points[0]; 
                if(road.points[road.points.length - 1].posX - maxX < 0.001 && this.currRoad.points[road.points.length - 1].posX - maxX > -0.001)
                    x++;
                else if(road.points[road.points.length - 1].posX - minX < 0.001 && this.currRoad.points[road.points.length - 1].posX - minX > -0.001)
                    x--;
                else if(road.points[road.points.length - 1].posZ - maxZ < 0.001 && this.currRoad.points[road.points.length - 1].posZ - maxZ > -0.001)
                    z++;
                else if(road.points[road.points.length - 1].posZ - minZ < 0.001 && this.currRoad.points[road.points.length - 1].posZ - minZ > -0.001)
                    z--;
                let chunk = chunks[String(x) + " " + String(z)];
                if(chunk === undefined || chunk.geometry === null)
                    return minSafeDist;
                checkingChunk = chunk;
                road = checkingChunk.roads[0];
                if((road.points[0].posX - endPoint.posX < 0.001 && road.points[0].posX - endPoint.posX > -0.001) ||
                    (road.points[0].posZ - endPoint.posZ < 0.001 && road.points[0].posZ - endPoint.posZ > -0.001)) {
                    currentlyFacing = true;
                    i = 0;
                }
                else {
                    currentlyFacing = false;
                    i = road.takenSegments.length - 1;
                }
            }
            if(road.takenSegments[i] === undefined)
                console.log('debug');
            let potentialCar = road.takenSegments[i][currentlyFacing? "right" : "left"];
            if(potentialCar !== null) {
                let addedDistance = 0;
                if(currentlyFacing) {
                    for(let j = 0; j < i; j++) {
                        addedDistance += road.pointSegments[i].length;
                    }
                } else {
                    for(let j = road.pointSegments.length; j > i; j--) {
                        addedDistance += road.pointSegments[i].length;
                    }
                }
                distance += potentialCar.pointIndex - addedDistance;
                if(distance >= minSafeDist)
                    return minSafeDist;
                return distance;
            }
            else
                distance += road.pointSegments[i].length;
            if(distance >= minSafeDist)
                return minSafeDist;
            if(currentlyFacing)
                i++;
            else
                i--;
        }
    }
}