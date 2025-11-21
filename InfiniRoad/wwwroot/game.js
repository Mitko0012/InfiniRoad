let object;
let shader;

let vertexShader = `
    attribute vec4 posVector;

    uniform mat4 objectMatrix;
    uniform mat4 perspectiveMatrix;
    uniform mat4 cameraMatrix;

    void main() {
        gl_Position = perspectiveMatrix * cameraMatrix * objectMatrix * posVector;
    }
`;

let fragmentShader = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(1, 1, 1, 1);
    }
`;


onStart = () => {
    shader = drawingData.createShaderConfig(vertexShader, fragmentShader);
    shader.bind();
    shader.setUniform("objectMatrix", linearAlgebra.formatMatrix(linearAlgebra.getBlankMatrix()));
    camPosY = 1;
    camPosX = 8;
    camAngleX = 10; 
};

onUpdate = () => {
    camPosZ -= 0.1;
    updateCamMatrix();
    updateProjMatrix();
    shader.setUniform("cameraMatrix", linearAlgebra.formatMatrix(camMatrix));
    shader.setUniform("perspectiveMatrix", linearAlgebra.formatMatrix(projMatrix));
    updateChunk();
}

start("drawing-canvas");