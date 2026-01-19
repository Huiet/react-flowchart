import * as d3 from 'd3';
import { initShaderProgram } from './shaders';
import { TessellatedGeometry, tessellateGeometry } from './tessellator';

export class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private positionLocation: number = -1;
  private matrixLocation: WebGLUniformLocation | null = null;
  private colorLocation: WebGLUniformLocation | null = null;
  private width: number;
  private height: number;
  private projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);

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

  render(
    geometries: Map<string, TessellatedGeometry>,
    transform: { x: number; y: number; scale: number },
    stateBorders?: any,
    nationBorders?: any,
    zipBorders?: number[] | null,
    hoveredZip?: string | null,
    stateGeometries?: Map<string, any> | null
  ) {
    if (!this.program) return;

    const gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Create transformation matrix
    const matrix = this.createMatrix(transform);
    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

    // Render state geometries if provided, otherwise render zip geometries
    if (stateGeometries) {
      // Tessellate and render states
      stateGeometries.forEach((stateData, fips) => {
        const tessellated = tessellateGeometry(stateData.geometry, stateData.color, fips);
        if (!tessellated) return;

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, tessellated.vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.colorLocation, tessellated.color);

        const vertexCount = tessellated.vertices.length / 2;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        gl.deleteBuffer(buffer);
      });
    } else {
      // Render each zip geometry
      geometries.forEach((geom, id) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, geom.vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Use orange color if this is the hovered zip, otherwise use original color
        const color = hoveredZip === id ? [0.96, 0.49, 0] : geom.color;
        gl.uniform3fv(this.colorLocation, color);

        const vertexCount = geom.vertices.length / 2;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        gl.deleteBuffer(buffer);
      });
    }

    // Draw state borders as lines
    if (stateBorders) {
      const borderVertices = this.extractBorderVertices(stateBorders);
      if (borderVertices.length > 0) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(borderVertices), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.colorLocation, [0.4, 0.4, 0.4]); // Gray color for state borders

        gl.drawArrays(gl.LINES, 0, borderVertices.length / 2);
        gl.deleteBuffer(buffer);
      }
    }

    // Draw nation borders as thicker lines
    if (nationBorders) {
      const borderVertices = this.extractBorderVertices(nationBorders);
      if (borderVertices.length > 0) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(borderVertices), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.colorLocation, [0.2, 0.2, 0.2]); // Darker color for nation borders
        gl.lineWidth(2);

        gl.drawArrays(gl.LINES, 0, borderVertices.length / 2);
        gl.deleteBuffer(buffer);
      }
    }

    // Draw zip code borders if provided
    if (zipBorders && zipBorders.length > 0) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(zipBorders), gl.STATIC_DRAW);

      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform3fv(this.colorLocation, [0.7, 0.7, 0.7]); // Light gray for zip borders

      gl.drawArrays(gl.LINES, 0, zipBorders.length / 2);
      gl.deleteBuffer(buffer);
    }
  }

  private extractBorderVertices(geometry: any): number[] {
    const vertices: number[] = [];
    const path = d3.geoPath(this.projection);

    if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((line: number[][]) => {
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
    // Convert from pixel coordinates to clip space (-1 to 1)
    const scaleX = (2 / this.width) * transform.scale;
    const scaleY = (-2 / this.height) * transform.scale;

    const translateX = (transform.x / this.width) * 2 - 1;
    const translateY = -((transform.y / this.height) * 2 - 1);

    return new Float32Array([scaleX, 0, 0, 0, scaleY, 0, translateX, translateY, 1]);
  }
}
