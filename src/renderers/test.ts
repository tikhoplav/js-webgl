import { Renderer } from "./types";
import makeShader from "./makeShader";

/**
 * Test renderer can be used to test if canvas context is available for
 * the rendering. Draws a colorful triangle at the center of the canvas.
 */
export function test(gl: WebGL2RenderingContext): Renderer {
  const program = makeShader(gl, vertexShaderSource, fragmentShaderSource);

  gl.useProgram(program);

  const vbo = gl.createBuffer();
  if (!vbo) {
    throw new Error("Failed to create a vertex buffer object");
  }

  // Enable buffer to be used every frame.
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, 60, gl.DYNAMIC_DRAW);

  // Init vertex array object, which then will be used each render cycle to
  // provide vertices to the program.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Set positions data read rules and enable position attribute.
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0);
  gl.enableVertexAttribArray(0);

  // Set color data read rules and enable it.
  gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 12, 8);
  gl.enableVertexAttribArray(1);

  // Unbind vertex array, to prevent it from being modified.
  gl.bindVertexArray(null);

  // Reset buffer binding.
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  /**
   * Sets vertices data for the program to render at next draw call.
   */
   const setVertices = (data: ArrayBuffer | DataView) => {
    // Set dynamic vertex data and bind the vertex array object containing
    // instructions on how to read the provided data.
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  } 

  /**
   * Draws a colored triangle at the canvas.
   */
  function draw(): void {
    const buffer = new ArrayBuffer(60);
    const view = new DataView(buffer);

    view.setFloat32(0, 0, true);
    view.setFloat32(4, 173.20508075688772, true);
    view.setUint8(8, 0);
    view.setUint8(9, 255);
    view.setUint8(10, 0);
    view.setUint8(11, 255);

    view.setFloat32(12, 150, true); 
    view.setFloat32(16, -86.60254037844386, true);
    view.setUint8(20, 255);
    view.setUint8(21, 0);
    view.setUint8(22, 0);
    view.setUint8(23, 255);

    view.setFloat32(24, -150, true);
    view.setFloat32(28, -86.60254037844386, true);
    view.setUint8(32, 0);
    view.setUint8(33, 0);
    view.setUint8(34, 255);
    view.setUint8(35, 255);

    setVertices(view);


    // Enable vertex array object to be used for rendering.
    gl.bindVertexArray(vao); 

    // Clear the canvas.
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Execute GLSL program
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindVertexArray(null);
  };

  /**
   * Adjust viewport width and height to the canvas.
   */
  function resize(): void {
    // Resize the viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // set the resolution
    gl.uniform2f(
      gl.getUniformLocation(program, "uResolution"),
      gl.canvas.width,
      gl.canvas.height,
    );
  }

  return { draw, resize };
};

const vertexShaderSource = `#version 300 es
uniform vec2 uResolution;

layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec4 AColor;

out vec4 vColor;

void main() {
  vec2 clipSpace = aPosition * vec2(2.0, 2.0) / uResolution;

  gl_Position = vec4(clipSpace, 0, 1);
  vColor = AColor;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 diffuseColor;

void main() {
  diffuseColor = vColor;
}`;

export default test;