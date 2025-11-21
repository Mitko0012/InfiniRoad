let seed = (() => {
    let returnObject = {};
    let canvas;
    let ctx;
    let screenCtx;
    let drawingBuffer;
    let isRunning = false;
    let mouseX = 0;
    let mouseY = 0;
    let leftDown = false;
    let middleDown = false;
    let rightDown = false;
    let touches = [];
    let getTouches = () => touches
    let screenRect;
    let tileTextures = [new Image(1, 1)];
    let keys = {};
    
    let buttons = {
        left: false,
        middle: false,
        right: false
    }

    let buttonValues = {
        0: "left",
        1: "middle",
        2: "right"
    }

    let onMouseMove = (event) => {
        mouseX = event.offsetX;
        mouseY = event.offsetY;
    }

    let onMouseDown = (event) => {
        buttons[buttonValues[String(event.button)]] = true;
    }

    let onMouseUp = (event) => {
        buttons[buttonValues[String(event.button)]] = false;
    }
    
    returnObject.onUpdate = () => {};
    returnObject.deltaTime = 0;
    returnObject.unitsOnCanvas = 10;

    let scaleConverter = {
        neutralToGame (value, isPos, isX, isSticky) { 
            let unit = Math.min(canvas.width, canvas.height) / returnObject.unitsOnCanvas;
            let camOffsetX = camera.posX * unit * -1 + (canvas.width / 2);
            let camOffsetY = camera.posY * unit * -1 + (canvas.height / 2);
    
            if(isX) {
                return (value - (isPos? isSticky? canvas.width / 2: camOffsetX : 0)) / unit;
            }
            else {
                return (value - (isPos? isSticky? canvas.height / 2: camOffsetY : 0)) / unit;
            }
        },
        gameToNeutral (value, isPos, isX, isSticky) {
            let unit = Math.min(canvas.width, canvas.height) / returnObject.unitsOnCanvas;;
            let camOffsetX = camera.posX * unit * -1 + (canvas.width / 2);
            let camOffsetY = camera.posY * unit * -1 + (canvas.height / 2);
    
            if(isX) {
                return value * unit + (isPos? isSticky? canvas.width / 2: camOffsetX : 0);
            }
            else {
                return value * unit + (isPos? isSticky? canvas.height / 2: camOffsetY : 0);
            }
        }
    }

    function startEngine(canvasId) {
        canvas = document.getElementById(canvasId);
        if(canvas === null || canvas === undefined) 
            throw new Error(`Canvas with the id "${canvasId}" can't be found!`); 
        screenCtx = canvas.getContext("2d");
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("touchstart", touchHandle);
        canvas.addEventListener("touchmove", touchHandle);
        canvas.addEventListener("touchend", touchHandle);
        drawingBuffer = document.createElement("canvas");
        ctx = drawingBuffer.getContext("2d");
        isRunning = true;
        window.requestAnimationFrame(updateCycle);
    }

    let mouse = {
        getPosX: function() {return scaleConverter.neutralToGame(mouseX, true, true, false);},
        getPosY: function() {return scaleConverter.neutralToGame(mouseY, true, false, false);},
        getDown: function(button) {return buttons[button];}
    }

    let touchHandle = (event) => {
        touches = Array.from(event.touches).map((touch) => {
            let rect = canvas.getBoundingClientRect();
            return {
                posX: scaleConverter.neutralToGame(touch.clientX - rect.left, true, true, false),
                posY: scaleConverter.neutralToGame(touch.clientY - rect.top, true, true, false)
            }
        });
    }
    
    function getCanvasWidth() {
        return canvas.width;
    }

    function getCanvasHeight() {
        return canvas.height;   
    }

    let timeAtLast = -1;
    function updateCycle(timestamp) {
        if(canvas.width != canvas.offsetWidth) {
            canvas.width = canvas.offsetWidth;
            drawingBuffer.width = canvas.width;
        }
        if(canvas.height != canvas.offsetHeight) {
            canvas.height = canvas.offsetHeight;
            drawingBuffer.height = canvas.height;
        }
        screenRect = fullRectangle(scaleConverter.neutralToGame(0, true, true, false), scaleConverter.neutralToGame(0, true, false, false), scaleConverter.neutralToGame(getCanvasWidth(), false, false, false), scaleConverter.neutralToGame(getCanvasHeight(), false, false, false));
        if(timeAtLast !== -1)
            returnObject.deltaTime = (timestamp - timeAtLast) / 1000;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        returnObject.onUpdate();
        screenCtx.drawImage(drawingBuffer, 0, 0, canvas.width, canvas.height);
        timeAtLast = timestamp;
        window.requestAnimationFrame(updateCycle);
    }

    function fullRectangle(posX, posY, width, height, color) {
        return {
            posX,
            posY,
            width,
            height,
            color,
            rotationCenterX: width / 2,
            rotationCenterY: height / 2,
            isSticky: false,
            angle: 0,
            draw(section) {
                if(section === undefined) {
                    if(isColliding(this, screenRect)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, true, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        ctx.save();
                        ctx.fillStyle = this.color;
                        ctx.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        ctx.rotate(degreeToRadian(this.angle));
                        ctx.fillRect(-neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        ctx.restore();
                    }
                } else {
                    if(isColliding(this, screenRect) && isColliding(this, section)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, true, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        section.context.save();
                        section.context.fillStyle = this.color;
                        section.context.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        section.context.rotate(degreeToRadian(this.angle));
                        section.context.fillRect(-neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        section.context.restore();
                    }
                }
            }
        }
    }

    function emptyRectangle(posX, posY, width, height, strokeWidth, color) {
        return {
            posX,
            posY,
            width,
            height,
            color,
            strokeWidth,
            rotationCenterX: width / 2,
            rotationCenterY: height / 2,
            isSticky: false,
            angle: 0,
            draw(section) {
                if(section === undefined) {
                    if(isColliding(this, screenRect)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, true, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        let neutralStrokeWidth = scaleConverter.gameToNeutral(this.strokeWidth, false, false, this.isSticky);
                        ctx.save();
                        ctx.lineWidth = neutralStrokeWidth;
                        ctx.strokeStyle = this.color;
                        ctx.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        ctx.rotate(degreeToRadian(this.angle));
                        ctx.strokeRect(-neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        ctx.restore();
                    }
                }
                else {
                    if(isColliding(this, screenRect) && isColliding(this, section)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, true, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        let neutralStrokeWidth = scaleConverter.gameToNeutral(this.strokeWidth, false, false, this.isSticky);
                        section.context.save();
                        section.context.lineWidth = neutralStrokeWidth;
                        section.context.strokeStyle = this.color;
                        section.context.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        section.context.rotate(degreeToRadian(this.angle));
                        section.context.strokeRect(-neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        section.context.restore();
                    }
                }
            }
        }
    }

    function fullEllipse(posX, posY, width, height, color) {
        return {
            posX,
            posY,
            width,
            height,
            color,
            rotationCenterX: width / 2,
            rotationCenterY: height / 2,
            angle: 0,
            isSticky: false,
            draw(section) {
                if(section === undefined) {
                    if(isColliding(this, screenRect)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, false, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        ctx.save();
                        ctx.fillStyle = this.color;
                        ctx.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        ctx.rotate(degreeToRadian(this.angle));
                        ctx.beginPath();
                        ctx.ellipse(-neutralRotationCenterX + neutralWidth / 2, -neutralRotationCenterY + neutralHeight / 2, (neutralWidth / 2), (neutralHeight / 2), 0, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }
                } else {
                    if(isColliding(this, screenRect) && isColliding(this, section)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, false, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        section.context.save();
                        section.context.fillStyle = this.color;
                        section.context.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        section.context.rotate(degreeToRadian(this.angle));
                        section.context.beginPath();
                        section.context.ellipse(-neutralRotationCenterX + neutralWidth / 2, -neutralRotationCenterY + neutralHeight / 2, (neutralWidth / 2), (neutralHeight / 2), 0, 0, Math.PI * 2);
                        section.context.closePath();
                        section.context.fill();
                        section.context.restore();
                    }
                }
            }
        }
    }

    function emptyEllipse(posX, posY, width, height, strokeWidth, color) {
        return {
            posX,
            posY,
            width,
            height,
            color,
            strokeWidth,
            rotationCenterX: width / 2,
            rotationCenterY: height / 2,
            angle: 0,
            isSticky: false,
            draw() {
                if(section === undefined) {
                    if(isColliding(this, screenRect)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, false, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        let neutralStrokeWidth = scaleConverter.gameToNeutral(this.strokeWidth, false, false, this.isSticky);
                        ctx.save();
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = neutralStrokeWidth;
                        ctx.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        ctx.rotate(degreeToRadian(this.angle));
                        ctx.beginPath();
                        ctx.ellipse(-neutralRotationCenterX + neutralWidth / 2, -neutralRotationCenterY + neutralHeight / 2, (neutralWidth / 2), (neutralHeight / 2), 0, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.restore();
                    }
                }
                else {
                    if(isColliding(this, screenRect) && isColliding(this, section)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, false, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        let neutralStrokeWidth = scaleConverter.gameToNeutral(this.strokeWidth, false, false, this.isSticky);
                        section.context.save();
                        section.context.strokeStyle = this.color;
                        section.context.lineWidth = neutralStrokeWidth;
                        section.context.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        section.context.rotate(degreeToRadian(this.angle));
                        section.context.beginPath();
                        section.context.ellipse(-neutralRotationCenterX + neutralWidth / 2, -neutralRotationCenterY + neutralHeight / 2, (neutralWidth / 2), (neutralHeight / 2), 0, 0, Math.PI * 2);
                        section.context.closePath();
                        section.context.stroke();
                        section.context.restore();
                    }
                }
            }
        }
    }

    function line(posX, posY, endX, endY, strokeWidth, color) {
        return {
            posX,
            posY,
            endX,
            endY,
            strokeWidth,
            isSticky: false,
            color,
            draw: function(section) {
                let minX = Math.min(endX, posX);
                let maxX = Math.max(endX, posX);
                let minY = Math.min(endY, posY);
                let maxY = Math.max(endY, posY);
                let col = getElementCollider(this, minX - posX, minY - posY, maxX - minX, maxY - minY);
                if(section === undefined) {
                    if(isColliding(col, screenRect)) {
                        let neutralStartX  = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky); 
                        let neutralStartY  = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                        let neutralEndX  = scaleConverter.gameToNeutral(this.endX, true, true, this.isSticky);
                        let neutralEndY  = scaleConverter.gameToNeutral(this.endY, true, false, this.isSticky);
                        let neutralStrokeWidth = scaleConverter.gameToNeutral(this.strokeWidth, false, false, this.isSticky);
                        ctx.save();
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = neutralStrokeWidth;
                        ctx.beginPath();
                        ctx.moveTo(neutralStartX, neutralStartY);
                        ctx.lineTo(neutralEndX, neutralEndY);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.restore();
                    }
                } else {
                    if(isColliding(col, screenRect) && isColliding(col, section)) {
                        let neutralStartX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralStartY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralEndX  = scaleConverter.gameToNeutral(this.endX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralEndY  = scaleConverter.gameToNeutral(this.endY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralStrokeWidth = scaleConverter.gameToNeutral(this.strokeWidth, false, false, this.isSticky);
                        section.context.save();
                        section.context.strokeStyle = this.color;
                        section.context.lineWidth = neutralStrokeWidth;
                        section.context.beginPath();
                        section.context.moveTo(neutralStartX, neutralStartY);
                        section.context.lineTo(neutralEndX, neutralEndY);
                        section.context.closePath();
                        section.context.stroke();
                        section.context.restore();
                    }
                }
            }
        }
    }
    
    function sprite(posX, posY, width, height, texturePath)
    {
        let textureLoaded = false;
        let texture = new Image();
        texture.src = texturePath;
        return {
            posX,
            posY,
            width, 
            height,
            texture,
            useSection: false,
            sectionX: 0,
            sectionY: 0,
            sectionWidth: NaN,
            sectionHeight: NaN,
            rotationCenterX: width / 2,
            rotationCenterY: height / 2,
            angle: 0,
            isSticky: false,
            draw: function(section) {
                if(section === undefined) {
                    if(texture.complete && isColliding(this, screenRect)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, false, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        ctx.save();
                        ctx.fillStyle = this.color;
                        ctx.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        ctx.rotate(degreeToRadian(this.angle));
                        if(this.useSection)
                            ctx.drawImage(texture, this.sectionX, this.sectionY, this.sectionWidth, this.sectionHeight, -neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        else
                            ctx.drawImage(texture, -neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        ctx.restore();
                    }
                }
                else {
                    if(texture.complete && isColliding(this, screenRect) && isColliding(this, section)) {
                        let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                        let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                        let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, this.isSticky);
                        let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, this.isSticky);
                        let neutralRotationCenterX = scaleConverter.gameToNeutral(this.rotationCenterX, false, false, this.isSticky);
                        let neutralRotationCenterY = scaleConverter.gameToNeutral(this.rotationCenterY, false, false, this.isSticky);
                        section.context.save();
                        section.context.fillStyle = this.color;
                        section.context.translate(neutralX + neutralRotationCenterX, neutralY + neutralRotationCenterY);
                        section.context.rotate(degreeToRadian(this.angle));
                        if(this.useSection)
                            section.context.drawImage(texture, this.sectionX, this.sectionY, this.sectionWidth, this.sectionHeight, -neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        else
                            section.context.drawImage(texture, -neutralRotationCenterX, -neutralRotationCenterY, neutralWidth, neutralHeight);
                        section.context.restore();
                    }
                }    
            }
        }
    }

    function text(posX, posY, size, font, text) {
        return {
            posX,
            posY,
            size,
            font,
            text,
            color: "black",
            alignment: "left",
            baseline: "alphabetic",
            isSticky: false,
            draw: function(section) {
                if(section === undefined) {
                    let neutralSize = scaleConverter.gameToNeutral(this.size, false, false, this.isSticky);
                    let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                    let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                    ctx.fillStyle = this.color;
                    ctx.font = `${neutralSize}px ${this.font}`;
                    ctx.textAlign = this.alignment;
                    ctx.baseline = this.baseline;
                    ctx.fillText(text, neutralX, neutralY);
                }
                else {
                    let neutralSize = scaleConverter.gameToNeutral(this.size, false, false, this.isSticky);
                    let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky) - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky);
                    let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky) - scaleConverter.gameToNeutral(section.posY, true, false, section.isSticky);
                    section.context.fillStyle = this.color;
                    section.context.font = `${neutralSize}px ${this.font}`;
                    section.context.textAlign = this.alignment;
                    section.context.baseline = this.xbaseline;
                    section.context.fillText(text, neutralX, neutralY);
                }
            }
        }
    }

    function tileMap(posX, posY, map) {
        let scale = 1.05;
        return {
            posX,
            posY,
            map,
            draw(section) {
                let currX = this.posX;
                let currY = this.posY;
                for(row of map) {
                    for(index of row)
                    {
                        let texture = tileTextures[index];
                        if(texture.complete) {
                            let neutralX = scaleConverter.gameToNeutral(currX, true, true, this.isSticky);
                            let neutralY = scaleConverter.gameToNeutral(currY, true, false, this.isSticky);
                            let neutralWidth = scaleConverter.gameToNeutral(scale, false, false, this.isSticky);
                            let neutralHeight = scaleConverter.gameToNeutral(scale, false, false, this.isSticky);
                            let colRect = fullRectangle(currX, currY, scale, scale, "black");
                            if(section === undefined)
                                if(isColliding(colRect, screenRect))
                                    ctx.drawImage(texture, neutralX, neutralY, neutralWidth, neutralHeight);
                            else
                                if(isColliding(colRect, screenRect) && isColliding(colRect, section))
                                    section.context.drawImage(texture, neutralX - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky), neutralY - scaleConverter.gameToNeutral(section.posX, true, true, section.isSticky), neutralWidth, neutralHeight);    
                            currX++;
                        }
                    }
                    currX = this.posX;
                    currY++;
                }
            }
        }
    }

    function drawingSection(posX, posY, width, height) {
        let canvas = document.createElement("canvas");
        return {
            posX,
            posY,
            width,
            height,
            isSticky: false,
            context: canvas.getContext("2d"),
            draw: function() {
                let neutralX = scaleConverter.gameToNeutral(this.posX, true, true, this.isSticky);
                let neutralY = scaleConverter.gameToNeutral(this.posY, true, false, this.isSticky);
                let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, false);
                let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, false);
                if(isColliding(this, screenRect))
                    ctx.drawImage(canvas, neutralX, neutralY, neutralWidth, neutralHeight);
            },
            clear: function() {
                let neutralWidth = scaleConverter.gameToNeutral(this.width, false, false, false);
                let neutralHeight = scaleConverter.gameToNeutral(this.height, false, false, false);
                canvas.width = neutralWidth;
                canvas.height = neutralHeight;
                this.context.clearRect(0, 0, neutralWidth, neutralHeight);
            }
        }
    }
    
    function degreeToRadian(x) {
        return x * (Math.PI / 180);
    }
    
    let camera = {
        posX: 0,
        posY: 0
    }

    function getElementCollider(element, startX, startY, endX, endY) {
        return {
            element,
            startX,
            startY,
            endX,
            endY
        };
    }

    function isColliding(col1, col2) {
        let col1IsElem = col1.width !== undefined;
        let col2IsElem = col2.width !== undefined;
        let col1XStart = col1IsElem ? scaleConverter.gameToNeutral(col1.posX, true, true, col1.isSticky) :
            scaleConverter.gameToNeutral(col1.element.posX + col1.startX, true, true, col1.element.isSticky);
        let col1XEnd = col1IsElem ? scaleConverter.gameToNeutral(col1.posX + col1.width, true, true, col1.isSticky) :
            scaleConverter.gameToNeutral(col1.element.posX + col1.endX, true, true, col1.element.isSticky);
        let col1YStart = col1IsElem ? scaleConverter.gameToNeutral(col1.posY, true, false, col1.isSticky) :
            scaleConverter.gameToNeutral(col1.element.posY + col1.startY, true, false, col1.element.isSticky);
        let col1YEnd = col1IsElem ? scaleConverter.gameToNeutral(col1.posY + col1.height, true, false, col1.isSticky) :
            scaleConverter.gameToNeutral(col1.element.posY + col1.endY, true, false, col1.element.isSticky);

        let col2XStart = col2IsElem ? scaleConverter.gameToNeutral(col2.posX, true, true, col2.isSticky) :
            scaleConverter.gameToNeutral(col2.element.posX + col2.startX, true, true, col2.element.isSticky);
        let col2XEnd = col2IsElem ? scaleConverter.gameToNeutral(col2.posX + col2.width, true, true, col2.isSticky) :
            scaleConverter.gameToNeutral(col2.element.posX + col2.endX, true, true, col2.element.isSticky);
        let col2YStart = col2IsElem ? scaleConverter.gameToNeutral(col2.posY, true, false, col2.isSticky) :
            scaleConverter.gameToNeutral(col2.element.posY + col2.startY, true, false, col2.element.isSticky);
        let col2YEnd = col2IsElem ? scaleConverter.gameToNeutral(col2.posY + col2.height, true, false, col2.isSticky) :
            scaleConverter.gameToNeutral(col2.element.posY + col2.endY, true, false, col2.element.isSticky);
        
        return (col2XStart < col1XEnd && col2XEnd > col1XStart && col2YStart < col1YEnd && col2YEnd > col1YStart);
    }

    function isPointInside(col, posX, posY) {
        let isColElem = col.width !== undefined;
        let colXStart = isColElem ? scaleConverter.gameToNeutral(col.posX, true, true, col.isSticky) :
            scaleConverter.gameToNeutral(col.element.posX + col.startX, true, true, col.element.isSticky);
        let colXEnd = isColElem ? scaleConverter.gameToNeutral(col.posX + col.width, true, true, col.isSticky) :
            scaleConverter.gameToNeutral(col.element.posX + col.endX, true, true, col.element.isSticky);
        let colYStart = isColElem ? scaleConverter.gameToNeutral(col.posY, true, false, col.isSticky) :
            scaleConverter.gameToNeutral(col.element.posY + col.startY, true, false, col.element.isSticky);
        let colYEnd = isColElem ? scaleConverter.gameToNeutral(col.posY + col.height, true, false, col.isSticky) :
            scaleConverter.gameToNeutral(col.element.posY + col.endY, true, false, col.element.isSticky);
        let neutralPointX = scaleConverter.gameToNeutral(posX, true, true, false);
        let neutralPointY = scaleConverter.gameToNeutral(posY, true, false, false);
        
        return colXStart < neutralPointX && neutralPointX < colXEnd && colYStart < neutralPointY && neutralPointY < colYEnd; 
    }

    function getMouseX() {
        return scaleConverter.neutralToGame(mouseX, true, true, false);
    }

    function getMouseY() {
        return scaleConverter.neutralToGame(mouseY, true, false, false);
    }

    window.addEventListener("keydown", e => {
        keys[e.key] = true;
    });
    window.addEventListener("keyup", e => {
        keys[e.key] = false;
    });
    

    returnObject.getCanvasWidth = getCanvasWidth;
    returnObject.getCanvasHeight = getCanvasHeight;
    returnObject.startEngine = startEngine;
    returnObject.fullRectangle = fullRectangle;
    returnObject.emptyRectangle = emptyRectangle;
    returnObject.fullEllipse = fullEllipse;
    returnObject.emptyEllipse = emptyEllipse;
    returnObject.sprite = sprite;
    returnObject.text = text;
    returnObject.tileMap = tileMap;
    returnObject.tileTextures = tileTextures;
    returnObject.scaleConverter = scaleConverter;
    returnObject.drawingSection = drawingSection;
    returnObject.camera = camera;
    returnObject.line = line;
    returnObject.mouse = mouse;
    returnObject.getTouches = getTouches;
    returnObject.getElementCollider = getElementCollider;
    returnObject.isColliding = isColliding;
    returnObject.isPointInside = isPointInside;
    returnObject.getMouseX = getMouseX;
    returnObject.getMouseY = getMouseY;
    returnObject.keys = keys;
    return returnObject;
})();