let camPosX = 0;
let camPosY = 0;
let camPosZ = 0;
let camAngleX = 0;
let camAngleY = 0;
let camAngleZ = 0;
let camMatrix;
let projMatrix;
let fov = 45;
let nearPlane = 0.001;
let farPlane = 1000;
let sunDirection = linearAlgebra.getVector3(0, 1, 0);

function updateMatrices() {
    camMatrix = linearAlgebra.multiplyMatrices(linearAlgebra.rotateAroundY(-camAngleY * Math.PI / 180), linearAlgebra.getTranslationMatrix(-camPosX, -camPosY, -camPosZ))
    camMatrix = linearAlgebra.multiplyMatrices(linearAlgebra.rotateAroundZ(-camAngleZ * Math.PI / 180), camMatrix);
    camMatrix = linearAlgebra.multiplyMatrices(linearAlgebra.rotateAroundX(-camAngleX * Math.PI / 180), camMatrix);
    projMatrix = linearAlgebra.getPerspectiveMatrix(fov * Math.PI / 180, canvas.width / canvas.height, nearPlane, farPlane);
}