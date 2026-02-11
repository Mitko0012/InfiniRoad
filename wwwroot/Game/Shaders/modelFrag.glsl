uniform sampler2D uSampler;
varying lowp vec2 vTexturePos;
varying lowp vec3 vNormal;
varying highp vec3 vLightDirection;
const lowp float minLight = 0.2;

void main() {
    gl_FragColor = texture2D(uSampler, vTexturePos);
    highp float light = max(dot(normalize(vNormal), normalize(vLightDirection)), 0.0);
    gl_FragColor.rgb *= minLight + light / 255.0 * (255.0 - minLight);
}