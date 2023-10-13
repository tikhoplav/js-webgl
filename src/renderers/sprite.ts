import makeShader from "./makeShader";
import { Renderer } from "./types"

export function sprite(gl: WebGL2RenderingContext) {
  const program = makeShader(gl, vertexShaderSource, fragmentShaderSource);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, 16 * 4 * 512, gl.DYNAMIC_DRAW);

  // Position is coordinates of a sprite's corners relative to zero.
  // Example: if sprite is 64x64 pixels it's position data would be:
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(0);

  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.enableVertexAttribArray(1);



  const tbo = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
  gl.bufferData(gl.ARRAY_BUFFER, 40 * 512, gl.DYNAMIC_DRAW);

  // Transform is a coordinates of a unit origin.
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 40, 0);
  gl.vertexAttribDivisor(2, 2);
  gl.enableVertexAttribArray(2);

  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 40, 8);
  gl.vertexAttribDivisor(3, 2);
  gl.enableVertexAttribArray(3);

  gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 40, 16);
  gl.vertexAttribDivisor(4, 2);
  gl.enableVertexAttribArray(4);

  gl.vertexAttribPointer(5, 2, gl.FLOAT, false, 40, 24);
  gl.vertexAttribDivisor(5, 2);
  gl.enableVertexAttribArray(5);

  gl.vertexAttribPointer(6, 4, gl.UNSIGNED_BYTE, false, 40, 32);
  gl.vertexAttribDivisor(6, 2);
  gl.enableVertexAttribArray(6);

  gl.vertexAttribPointer(7, 4, gl.UNSIGNED_BYTE, true, 40, 36);
  gl.vertexAttribDivisor(7, 2);
  gl.enableVertexAttribArray(7);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  /**
   * Set vertices data  6 per instance to render at the next draw call.
   */
   const setInstances = (data: ArrayBuffer | DataView | Float32Array ) => {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  };

  /**
   * Set transform per instance to render at the next draw call.
   */
  const setTransforms = (data: ArrayBuffer | DataView | Float32Array) => {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  };

  /**
   * This is a draw function, that executes GLSL program on the call.
   * It can further be modified to provide data as attributes.
   */
   const draw = (n: number) => {
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, n * 4, n)
    gl.bindVertexArray(null);
  };

  /**
   * Adjust the viewport properties to the canvas width and height.
   */
   const resize = () => {
    const { width, height } = gl.canvas;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.uniform2f(gl.getUniformLocation(program, "uResolution"), width, height);
  };

  return { draw, resize, setInstances, setTransforms };
};

const vertexShaderSource = `#version 300 es
uniform vec2 uResolution;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

layout(location = 2) in vec2 aTransform;
layout(location = 3) in vec2 aScale;
layout(location = 4) in vec2 aTexTrans;
layout(location = 5) in vec2 aTexScale;
layout(location = 6) in vec4 aColor;
layout(location = 7) in vec4 id;

out vec2 vTexCoord;
out vec4 vColor;
out vec4 vObjColor;

uint maxByte = uint(0xFF);

void main() {
  vec2 clipSpace = aPosition * vec2(2.0, 2.0) / uResolution;
  gl_Position = vec4(clipSpace * aScale + aTransform, 0, 1);

  vTexCoord = aTexCoord * aTexScale + aTexTrans;
  vColor = aColor;
  vObjColor = id;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform sampler2D image;

in vec2 vTexCoord;
in vec4 vColor;
in vec4 vObjColor;

layout(location = 0) out vec4 objColor;
layout(location = 1) out vec4 diffuseColor;

void main() {
  vec4 texColor = texture(image, vTexCoord);
  objColor = vObjColor * texColor.a;
  diffuseColor =  texColor * vColor;
}`;

export default sprite;