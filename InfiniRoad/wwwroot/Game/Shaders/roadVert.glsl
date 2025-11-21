uniform mat4 transformationMatrix;
uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;

attribute lowp vec4 position;

varying lowp vec4 color;

void main() {
    gl_Position = projectionMatrix * cameraMatrix * transformationMatrix * position;
    color = vec4(0.5, 0.5, 0.5, 1);
}