import * as d3 from 'd3';
import { initShaderProgram } from './shaders';
import { TessellatedGeometry } from './tessellator';

export class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private positionLocation: number = -1;
  private matrixLocation: WebGLUniformLocation | null = null;
  private colorLocation: WebGLUniformLocation | null = null;
  private width: number;
  private height: number;
  private projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);

  // Buffer cache
  private bufferCache = new Map<string, WebGLBuffer>();
  private borderBuffer: WebGLBuffer | null = null;
  private nationBuffer: WebGLBuffer | null = null;
  private borderVertexCount = 0;
  private nationVertexCount = 0;

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.init();
  }

  private init() {
    this.program = initShaderProgram(this.gl);
    if (!this.program) {
      console.error('Failed to initialize shader program');
      return;
    }

    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.colorLocation = this.gl.getUniformLocation(this.program, 'u_color');

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  private getOrCreateBuffer(id: string, vertices: Float32Array): WebGLBuffer | null {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }
    const buffer = this.gl.createBuffer();
    if (!buffer) return null;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    this.bufferCache.set(id, buffer);
    return buffer;
  }

  clearBufferCache() {
    this.bufferCache.forEach((buffer) => this.gl.deleteBuffer(buffer));
    this.bufferCache.clear();
    if (this.borderBuffer) {
      this.gl.deleteBuffer(this.borderBuffer);
      this.borderBuffer = null;
    }
    if (this.nationBuffer) {
      this.gl.deleteBuffer(this.nationBuffer);
      this.nationBuffer = null;
    }
  }

  setBorders(stateBorders: any, nationBorders: any) {
    // Cache state borders
    if (stateBorders) {
      const vertices = this.extractBorderVertices(stateBorders);
      if (vertices.length > 0) {
        if (this.borderBuffer) this.gl.deleteBuffer(this.borderBuffer);
        this.borderBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.borderVertexCount = vertices.length / 2;
      }
    }

    // Cache nation borders
    if (nationBorders) {
      const vertices = this.extractBorderVertices(nationBorders);
      if (vertices.length > 0) {
        if (this.nationBuffer) this.gl.deleteBuffer(this.nationBuffer);
        this.nationBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nationBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.nationVertexCount = vertices.length / 2;
      }
    }
  }

  render(
    geometries: Map<string, TessellatedGeometry>,
    transform: { x: number; y: number; scale: number },
    zipBorders?: number[] | null,
    hoveredZip?: string | null
  ) {
    if (!this.program) return;

    const gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    const matrix = this.createMatrix(transform);
    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

    // Render geometries using cached buffers
    geometries.forEach((geom, id) => {
      const buffer = this.getOrCreateBuffer(id, geom.vertices);
      if (!buffer) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

      const color = hoveredZip === id ? [0.96, 0.49, 0] : geom.color;
      gl.uniform3fv(this.colorLocation, color);

      gl.drawArrays(gl.TRIANGLES, 0, geom.vertices.length / 2);
    });

    // Draw cached state borders
    if (this.borderBuffer && this.borderVertexCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.borderBuffer);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(this.colorLocation, [0.4, 0.4, 0.4]);
      gl.drawArrays(gl.LINES, 0, this.borderVertexCount);
    }

    // Draw cached nation borders
    if (this.nationBuffer && this.nationVertexCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nationBuffer);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(this.colorLocation, [0.2, 0.2, 0.2]);
      gl.drawArrays(gl.LINES, 0, this.nationVertexCount);
    }

    // Draw zip borders (not cached - changes with zoom)
    if (zipBorders && zipBorders.length > 0) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(zipBorders), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(this.colorLocation, [0.7, 0.7, 0.7]);
      gl.drawArrays(gl.LINES, 0, zipBorders.length / 2);
      gl.deleteBuffer(buffer);
    }
  }

  private extractBorderVertices(geometry: any): number[] {
    const vertices: number[] = [];

    if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((line: [number, number][]) => {
        for (let i = 0; i < line.length - 1; i++) {
          const p1 = this.projection(line[i]);
          const p2 = this.projection(line[i + 1]);
          if (p1 && p2) {
            vertices.push(p1[0], p1[1], p2[0], p2[1]);
          }
        }
      });
    }

    return vertices;
  }

  private createMatrix(transform: { x: number; y: number; scale: number }): Float32Array {
    const scaleX = (2 / this.width) * transform.scale;
    const scaleY = (-2 / this.height) * transform.scale;
    const translateX = (transform.x / this.width) * 2 - 1;
    const translateY = -((transform.y / this.height) * 2 - 1);
    return new Float32Array([scaleX, 0, 0, 0, scaleY, 0, translateX, translateY, 1]);
  }
}
