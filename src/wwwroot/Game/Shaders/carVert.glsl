uniform mat4 transformationMatrix;
uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;

attribute lowp vec3 position;
attribute highp vec2 aTexturePos;

varying highp vec2 vTexturePos;

void main() {
    vec4 convertedPos = vec4(position[0], position[1], position[2], 1);
    gl_Position = projectionMatrix * cameraMatrix * transformationMatrix * convertedPos;
    vTexturePos = aTexturePos;
}