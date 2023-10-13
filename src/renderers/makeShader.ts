/**
 * Creates a GLSL shader program using provided source codes
 * for vertex and fragment shaders. Throws exception in case
 * if shader can't be compiled.
 * 
 * @param ctx 
 * @param vsSource vertex shader source code.
 * @param fsSource fragment shader source code.
 * @returns GLSL program
 */
export function makeShader(ctx: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vs = ctx.createShader(ctx.VERTEX_SHADER);
  if (!vs) {
    throw new Error("Failed to create a vertex shader");
  }

  const fs = ctx.createShader(ctx.FRAGMENT_SHADER);
  if (!fs) {
    throw new Error("Failed to create a fragment shader");
  }

  const prog = ctx.createProgram();
  if (!prog) {
    throw new Error("Failed to create a program");
  }

  ctx.shaderSource(vs, vsSource);
  ctx.shaderSource(fs, fsSource);

  ctx.compileShader(vs);
  ctx.compileShader(fs);

  ctx.attachShader(prog, vs);
  ctx.attachShader(prog, fs);

  ctx.linkProgram(prog);

  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
    console.error(`Link failed: ${ctx.getProgramInfoLog(prog)}`);
    console.error(`vs info-log: ${ctx.getShaderInfoLog(vs)}`);
    console.error(`fs info-log: ${ctx.getShaderInfoLog(fs)}`);
    throw new Error("Failed to make a shader");
  }

  return prog;
};

export default makeShader;