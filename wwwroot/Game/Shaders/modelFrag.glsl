uniform sampler2D uSampler;
varying lowp vec2 vTexturePos;
varying lowp vec3 vNormal;
varying highp vec3 vLightDirection;

void main() {
    gl_FragColor = texture2D(uSampler, vTexturePos);
    highp float light = dot(vNormal, vLightDirection);
    gl_FragColor.rgb *= light;
}