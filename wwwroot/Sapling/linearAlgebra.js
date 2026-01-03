let linearAlgebra = (() => {
    function getVector4(x, y, z, t) {
        return[x, y, z, t];
    }

    function getVector3(x, y, z) {
        return[x, y, z];
    }

    function getVector2(x, y) {
        return[x, y];
    }

    function addVectors(vector1, vector2) {
        let completedVector = [];
        for(let i = 0; i < vector1.length; i++) {
            completedVector[i] = vector1[i] + vector2[i];
        }

        return completedVector;
    }

    function scaleVector(vector, scaler) {
        if(vector.length === 4)
            return [vector[0] * scaler, vector[1] * scaler, vector[2] * scaler, vector[3]];
        else if(vector.length === 3)
            return [vector[0] * scaler, vector[1] * scaler, vector[2] * scaler];
        else if(vector.length === 2)
            return [vector[0] * scaler, vector[1] * scaler];
    }
    
    function getVectorMagnitudeVec4(vector) {
        return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2) + Math.pow(vector[2], 2) + Math.pow(vector[3], 2));
    }

    function getVectorMagnitudeVec3(vector) {
        return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2) + Math.pow(vector[2], 2));
    }

    function normalizeVec4(vector) {
        let magnitude = getVectorMagnitudeVec4(vector);
        if(magnitude == 0)
            return vector;
        return[vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude, vector[3] / magnitude];   
    }

    function normalizeVec3(vector) {
        let magnitude = getVectorMagnitudeVec3(vector);
        if(magnitude == 0)
            return vector;
        return[vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];   
    }

    function normalizeVec2(vector) {
        let magnitude = getVectorMagnitudeVec2(vector);
        if(magnitude == 0)
            return vector;
        return[vector[0] / magnitude, vector[1] / magnitude];   
    }

    function getBlankMatrix() {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    function getTranslationMatrix(tx, ty, tz) {
        return [
            [1, 0, 0, tx],
            [0, 1, 0, ty],
            [0, 0, 1, tz],
            [0, 0, 0, 1]
        ];
    }
    
    function getPerspectiveMatrix(fov, aspect, near, far) {
        return [
            [1 / (Math.tan(fov / 2) * aspect), 0, 0, 0],
            [0, 1 / Math.tan(fov / 2), 0, 0],
            [0, 0, -(far + near)/(far - near), -(2 * (far * near) / (far - near))],
            [0, 0, -1, 0]
        ];
    }

    function formatMatrix(matrix) {
        let returnArray = [];
        for(let i = 0; i < matrix.length; i++)
            for(let j = 0; j < matrix.length; j++)
                returnArray[j * 4 + i] = matrix[i][j];
        return new Float32Array(returnArray);
    }

    function rotateAroundX(angle) {
        return [
            [1, 0, 0, 0],
            [0, Math.cos(angle), -Math.sin(angle), 0],
            [0, Math.sin(angle), Math.cos(angle), 0],
            [0, 0, 0, 1]
        ];
    }

    function rotateAroundY(angle) {
        return [
            [Math.cos(angle), 0, Math.sin(angle), 0],
            [0, 1, 0, 0],
            [-Math.sin(angle), 0, Math.cos(angle), 0],
            [0, 0, 0, 1]
        ];
    }

    function rotateAroundZ(angle) {
        return [
            [Math.cos(angle), -Math.sin(angle), 0, 0],
            [Math.sin(angle), Math.cos(angle), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    function multiplyMatrixAndVector(mat, vec) {
        let returnVector = [0, 0, 0, 0];
        for(let i = 0; i < vec.length; i++) {
            returnVector[0] += mat[0][i] * vec[i];
            returnVector[1] += mat[1][i] * vec[i];
            returnVector[2] += mat[2][i] * vec[i];
            returnVector[3] += mat[3][i] * vec[i];
        }
        return returnVector;
    }

    function multiplyMatrices(mat2, mat1) {
        let returnMatrix = [[], [], [], []];
        for(let i = 0; i < mat1.length; i++) {
            let vector = getVector4(mat1[0][i], mat1[1][i], mat1[2][i], mat1[3][i]);
            vector = multiplyMatrixAndVector(mat2, vector);
            returnMatrix[0][i] = vector[0];
            returnMatrix[1][i] = vector[1];
            returnMatrix[2][i] = vector[2];
            returnMatrix[3][i] = vector[3];
        }
        return returnMatrix;
    }

    function lerpVec2(vec1, vec2, value) {
        let returnVec = [vec1[0], vec1[1]];
        returnVec[0] = vec1[0] + (vec2[0] - vec1[0]) * value;
        returnVec[1] = vec1[1] + (vec2[1] - vec1[1]) * value;
        return returnVec;
    }

    function getVectorMagnitudeVec2(vec1) {
        return Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2));
    }

    function crossVector3(vec1, vec2) {
        return [
            vec1[1] * vec2[2] - vec1[2] * vec2[1],
            vec1[2] * vec2[0] - vec1[0] * vec2[2],
            vec1[0] * vec2[1] - vec1[1] * vec2[0],
        ]
    }

    return {
        getVector2,
        getVector3,
        getVector4,
        addVectors,
        getPerspectiveMatrix,
        getBlankMatrix,
        getTranslationMatrix,
        formatMatrix,
        multiplyMatrixAndVector,
        multiplyMatrices,
        rotateAroundX,
        rotateAroundY,
        rotateAroundZ,
        getVectorMagnitudeVec4,
        getVectorMagnitudeVec3,
        normalizeVec4,
        normalizeVec3,
        normalizeVec2,
        scaleVector,
        lerpVec2,
        getVectorMagnitudeVec2,
        crossVector3
    };
})();