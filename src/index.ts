// import { test } from "./renderers/test";
import renderSprites from './renderers/sprite';
import renderScreen from './renderers/screen';

// Start with creating a canvas element, adding it to the document
// and initializing webgl2 drawing context.
const body = document.querySelector('body');
const canvas = document.createElement('canvas');
body.appendChild(canvas);

// For the demo purposes canvas would take up the whole window, so
// that all the unused margins should be removed.
body.style.margin = "0";
body.style.overflow = "hidden";
// In order to make canvas fit the entire window.
canvas.style.display = "block";
canvas.style.background = '#0a0a0a';

// Initialize the drawing context, this is what is going to be used
// by any renderer further. WebGl2 is used for the demo purposes.
const gl = canvas.getContext('webgl2', {antialias: false});
if (!gl) throw new Error("Failed to init rendering context");

const cursor = {
  x: -1,
  y: -1,
};

const cursorColorData = new Uint8Array(4);
const getTargetId = (): number => (cursorColorData[0]
  + cursorColorData[1] << 8
  + cursorColorData[2] << 16
  + cursorColorData[3] << 32) >>> 0

canvas.onmousemove = e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  cursor.x = x * canvas.width / canvas.clientWidth;
  cursor.y = canvas.height - y * canvas.height / canvas.clientHeight - 1;
}

canvas.onmouseleave = () => {
  cursor.x = -1;
  cursor.y = -1;
}

// -----
// Allocate memory for textures for multi-pass rendering
// -----

/**
 * Atlas is a input texture that contains all the animation
 * sprites combined. Should be loaded only once at the start.
 */
const atlas = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, atlas);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

gl.activeTexture(gl.TEXTURE1);

/**
 * Hit map is a texture that contains all the game entities
 * rendered in a solid color according to their ids. This can
 * be used to retrieve current target under the cursor e.t.c.
 */
const hitMap = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, hitMap);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

/**
 * Diffuse map contains all the game entities rendered on a plane
 * texture which can be forwarded to post processing steps or passed
 * directly on a screen. 
 */
const diffuseMap = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

/**
 * Depth buffer contains depth data of game entities after initial
 * rendering pass.
 */
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

/**
 * Frame buffer is used to store render result of the initial pass
 * in diffuse map and a hit map. Two texture buffers used according
 * to the sprite renderer, as two outputs of the fragment shader.
 */
const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hitMap, 0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, diffuseMap, 0);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

gl.bindFramebuffer(gl.FRAMEBUFFER, null);


const sprites = renderSprites(gl);
const screen = renderScreen(gl);

const image = new Image();
image.src = "/poring.png";

image.onload = () => {
  // prepare sprite atlas to be used to animate game entities
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

const resizeCanvas = () => {
  const { innerWidth: width, innerHeight: height} = window;
  gl.canvas.width = width;
  gl.canvas.height = height;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.bindTexture(gl.TEXTURE_2D, hitMap);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  sprites.resize();
};

window.onresize = resizeCanvas;

// Set instances data. Usually this should be done
// each time new entity is added to the scene.
const vertexData = new Float32Array([
  -32,  40,     0,     0,
  -32, -24,     0, .0625,
   32, -24,    .5, .0625,
   32,  40,    .5,     0,
]);
sprites.setInstances(vertexData);

const transforms = new ArrayBuffer(40);
const view = new DataView(transforms);

let frame = 0;
let last = 0;

const next = (now: number) => {
  if ( now - last > 100 ) {
    last = now;
    frame = frame < 15 ? frame + 1 : 0;
  }

  // transform
  view.setFloat32(0, 0, true);
  view.setFloat32(4, 0, true);

  // scale
  view.setFloat32(8, 3, true);
  view.setFloat32(12, 3, true);

  // texture transform
  view.setFloat32(16, 0, true);
  view.setFloat32(20, frame * 0.0625, true);

  // texture scale
  view.setFloat32(24, 1, true);
  view.setFloat32(28, 1, true);

  // Color
  view.setUint8(32, 1);
  view.setUint8(33, 1);
  view.setUint8(34, 1);
  view.setUint8(35, 1);

  // id
  view.setUint8(36, 0xff);
  view.setUint8(37, 0);
  view.setUint8(38, 0);
  view.setUint8(39, 0);

  sprites.setTransforms(transforms);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  sprites.draw(1);

  gl.readPixels(cursor.x, cursor.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, cursorColorData);
  console.log(`Cursor color: ${getTargetId()}`);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
  screen.draw();

  requestAnimationFrame(next);
};

resizeCanvas();
next(0);

// TODO:
// - A state machine for each instance that contains texture coordinates
//   for each frame and can switch between animations.
//
// - Tiled map.
// - Tiled map and multiple animated instance at one draw.
// - Particle effects (another shader?)

 