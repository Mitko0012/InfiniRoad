uniform mat4 transformationMatrix;
uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;
uniform vec3 lightDirection;

attribute vec3 position;
attribute vec2 aTexturePos;
attribute vec3 aNormal;

varying highp vec2 vTexturePos;
varying highp vec3 vLightDirection;
varying lowp vec3 vNormal;

void main() {
    vec4 convertedPos = vec4(position[0], position[1], position[2], 1);
    gl_Position = projectionMatrix * cameraMatrix * transformationMatrix * convertedPos;
    vTexturePos = aTexturePos;
    vec4 convertedNormal = vec4(vNormal.x, vNormal.y, vNormal.z, 1);
    vec4 appliedNormal = transformationMatrix * convertedNormal;
    vNormal = vec3(appliedNormal.x, appliedNormal.y, appliedNormal.z);
    vLightDirection = lightDirection;
}