uniform mat4 transformationMatrix;
uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;

attribute lowp vec4 position;
attribute highp vec2 aTextureCoord;

varying highp vec2 vTextureCoord;

void main() {
    gl_Position = projectionMatrix * cameraMatrix * transformationMatrix * position;
    vTextureCoord = aTextureCoord;
}