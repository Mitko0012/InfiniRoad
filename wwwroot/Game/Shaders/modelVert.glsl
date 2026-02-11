uniform mat4 transformationMatrix;
uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;
uniform vec3 lightDirection;

attribute vec3 position;
attribute vec2 aTexturePos;
attribute vec3 aNormal;

varying highp vec2 vTexturePos;
varying highp vec3 vLightDirection;
varying highp vec3 vNormal;

void main() {
    vec4 convertedPos = vec4(position[0], position[1], position[2], 1);
    gl_Position = projectionMatrix * cameraMatrix * transformationMatrix * convertedPos;
    vTexturePos = aTexturePos;
    vec3 appliedNormal = normalize(mat3(transformationMatrix) * aNormal);
    vNormal = appliedNormal;
    vLightDirection = normalize(mat3(transformationMatrix) * lightDirection);
}