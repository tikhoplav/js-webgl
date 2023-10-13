import makeShader from "./makeShader";

export const screen = (gl: WebGL2RenderingContext) => {
  const program = makeShader(gl, vertexShader, fragmentShader)
  gl.useProgram(program)

  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  0, 0,
     1,-1,  1, 0,
     1, 1,  1, 1,
    -1, 1,  0, 1,
  ]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const draw = () => {
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }
  
  return { draw };
}

const vertexShader = `#version 300 es
in vec2 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0, 1);
  vTexCoord = aTexCoord;
}`

const fragmentShader = `#version 300 es
precision highp float;
uniform sampler2D tex;

in vec2 vTexCoord;

out vec4 color;

void main() {
  color = texture(tex, vTexCoord);
}`

export default screen