let canvas;
let gl;
let drawingData = (() => {
    let boundArrayBuffer = null;
    let boundElemBuffer = null;
    let boundShaderProgram = null;
    let boundTextureShaderProgram = null;
    let floatSize = 4;
    
    function parseObj(source, takeColor, takeTexture, takeNormal) {
        let lines = source.split("\n");
        let vertices = [];
        let textureCoords = [];
        let normals = [];
        let elemData = [];
        let vertexData = [];
        let vertexIndex = 0;
        for(let line of lines) {
            let data = line.trim().split(" ");
            switch(data[0]) {
                case "v":
                    if(takeColor)
                        vertices.push([Number(data[1]), Number(data[2]), Number(data[3]), Number(data[4]), Number(data[5]), Number(data[6])]);
                    else
                        vertices.push([Number(data[1]), Number(data[2]), Number(data[3])]);
                    break;
                case "vt":
                    textureCoords.push([Number(data[1]), Number(data[2])]);
                    break;
                case "vn":
                    normals.push([Number(data[1]), Number(data[2]), Number(data[3])]);
                    break;
                case "f":
                    let dataToLoop = data.slice(1);
                    let currentVertices = 0;
                    for(let data of dataToLoop) {
                        let splitNumbers = data.split("/");
                        let values = [Number(splitNumbers[0]) - 1, Number(splitNumbers[1]) - 1, Number(splitNumbers[2]) - 1];
                        vertexData.push(vertices[values[0]][0]);
                        vertexData.push(vertices[values[0]][1]);
                        vertexData.push(vertices[values[0]][2]);
                        if(takeColor) {
                            vertexData.push(vertices[values[0]][3] !== undefined? vertices[values[0]][3] : 0);
                            vertexData.push(vertices[values[0]][4] !== undefined? vertices[values[0]][4] : 0);
                            vertexData.push(vertices[values[0]][5] !== undefined? vertices[values[0]][5] : 0);
                        }
                        if(takeTexture) {
                            vertexData.push(values[1] !== -1 ? textureCoords[values[1]][0] : 0);
                            vertexData.push(values[1] !== -1 ? textureCoords[values[1]][1] : 0);
                        }
                        if(takeNormal) {
                           vertexData.push(values[2] !== -1? normals[values[2]][0] : 0);
                            vertexData.push(values[2] !== -1? normals[values[2]][1] : 0);
                            vertexData.push(values[2] !== -1? normals[values[2]][2] : 0);
                        }
                        currentVertices++;
                    }
                    elemData.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                    if(currentVertices > 3)
                        for(let i = 2; i < currentVertices - 1; i++) {
                            elemData.push(vertexIndex, vertexIndex + i, vertexIndex + i + 1)
                        }
                    vertexIndex += currentVertices;
                default:
                    continue;
            }
        }
        let layout = [3];
        if(takeColor)
            layout.push(3)
        if(takeTexture)
            layout.push(2)
        if(takeNormal)
            layout.push(3)
        return createMesh(layout, vertexData, elemData);
    }

    function createMesh(layout, vertData, elemData) {
        let vertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertData), gl.STATIC_DRAW);
        let elemBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elemData), gl.STATIC_DRAW);
        return {
            vertBuffer,
            elemBuffer,
            bind() {
                if(boundArrayBuffer !== this.vertBuffer) {
                    boundArrayBuffer = this.vertBuffer;
                    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
                    let offset = 0;
                    let stride = layout.reduce((acc, next) => acc + next * 4, 0);
                    for(let i = 0; i < layout.length; i++) {
                        let size = layout[i];
                        gl.vertexAttribPointer(
                            i, size, gl.FLOAT, false, stride, offset
                        );
                        gl.enableVertexAttribArray(i);
                        offset += layout[i] * 4;
                    }
                }
                if(boundElemBuffer !== this.elemBuffer) {
                    boundElemBuffer = this.elemBuffer;
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
                }
            },
            dispose () {
                if(this.arrayBuffer !== null) {
                    gl.deleteBuffer(this.arrayBuffer);
                    gl.arrayBuffer = null;
                }
                if(this.elemBuffer !== null) {
                    gl.deleteBuffer(this.elemBuffer);
                    gl.elemBuffer = null;
                }
            },
            getIndexCount() {
                return elemData.length;
            }
        }
    }

    function textureFromImage(image) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const level = 0;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
            gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
        return texture;
    }

    function emptyTextureFromSize(gl, width, height) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const level = 0;
        gl.texImage2D(
            gl.TEXTURE_2D, level, internalFormat, 
            width, height, 0, srcFormat, 
            srcType, null
        );
    }

    function deleteTexture(gl, texture) {
        if(texture !== null) {
            gl.deleteTexture(texture);
            texture = null;
        }
    }

    function createShaderConfig(vsSource, fsSource) {
        let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        let uniforms = {};
        let textures = [];

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog(shaderProgram));
        }
        return {
            shaderProgram,
            bind() {
                if(boundShaderProgram !== this) {
                    gl.useProgram(shaderProgram);
                    boundShaderProgram = this;
                }
            },
            setUniform(name, value) {
                let location = uniforms[name];
                if(location === undefined) {
                    location = gl.getUniformLocation(this.shaderProgram, name);
                    uniforms[name] = location;
                }
                if(value.length === 16) 
                    gl.uniformMatrix4fv(location, false, value);
                else if(value.length === 4)
                    gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                else if(value.length === 3)
                    gl.uniform3f(location, value[0], value[1], value[2]);
                else if(value.length === 2)
                    gl.uniform3f(location, value[0], value[1]);
                else {
                    let index;
                    for(let i = 0; i < 8; i++) {
                        if(textures[i] === value) {
                            index = i;
                            break;
                        }
                    }
                    if(index === undefined) {
                        if(textures.length < 8) {
                            textures.push(value);
                            index = textures.length - 1;
                        }
                        else
                            throw new Error("Each shader configurations must contain a maximum of 8 textures");
                    }
                    gl.activeTexture(gl.TEXTURE0 + index);
                    gl.bindTexture(gl.TEXTURE_2D, value);
                    gl.uniform1i(location, index);
                }
            },
            bindTextures() {
                if(boundTextureShaderProgram !== this) {
                    boundTexturesShaderProgram = this;
                    for(let i = 0; i < textures.length; i++) {
                        gl.activeTexture(gl.TEXTURE0 + i);
                        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
                    }
                }
            },
            dispose() {
                if(this.program !== null) {
                    gl.deleteProgram(this.program);
                    gl.program = null;
                }
            }
        }
    }

    function createFrameBuffer() {

    }

    function loadShader(gl, type, source) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
    
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Cound not load shader: ${gl.getShaderInfoLog(shader)}`);
        }
        return shader;
    }

    let getBoundArrayBuffer = () => boundArrayBuffer;
    let getBoundElemBuffer = () => boundElemBuffer;
    let getBoundShaderProgram = () => boundShaderProgram;
    let getBoundTextureShaderProgram = () => boundTextureShaderProgram;

    return {
        parseObj,
        createMesh,
        textureFromImage,
        emptyTextureFromSize,
        deleteTexture,
        createShaderConfig,
        getBoundArrayBuffer,
        getBoundElemBuffer,
        getBoundShaderProgram,
        getBoundTextureShaderProgram
    };
})();