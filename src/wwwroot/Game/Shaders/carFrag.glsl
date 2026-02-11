uniform sampler2D uSampler;
varying highp vec2 vTexturePos;

void main() {
    gl_FragColor = texture2D(uSampler, vTexturePos);
}