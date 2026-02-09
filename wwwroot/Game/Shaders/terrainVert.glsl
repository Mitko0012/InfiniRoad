uniform mat4 transformationMatrix;
uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;
uniform vec3 lightDirection;

attribute lowp vec4 position;
attribute highp vec3 normal;

varying lowp vec4 color;
varying highp vec3 vNormal;
varying highp vec3 vLightDirection;


void main() {
    gl_Position = projectionMatrix * cameraMatrix * transformationMatrix * position;
    color = vec4(0, 1, 0.2, 1);
    mat3 normalMatrix = mat3(transformationMatrix);
    vNormal = normalize(normalMatrix * normal);
    vLightDirection = lightDirection;
}