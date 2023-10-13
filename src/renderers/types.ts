export interface Renderer {
  /**
   * Execute WebGL shader and render an image to the canvas.
   */
  draw(n: number): void;

  /**
   * Adjust rendering viewport to the current width and height
   * of the canvas.
   */
  resize(): void;
}