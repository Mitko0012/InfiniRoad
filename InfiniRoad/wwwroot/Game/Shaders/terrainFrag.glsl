varying lowp vec4 color;
varying highp vec3 vNormal;
varying highp vec3 vLightDirection;

void main() {
    gl_FragColor = color;
    highp float light = dot(vNormal, vLightDirection);
    gl_FragColor.rgb *= light;
}