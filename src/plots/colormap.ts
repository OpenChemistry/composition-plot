import { Vec2, Vec3 } from "../types";
import { linearScale, createColorMap, Scale } from '@colormap/core';
import { select } from 'd3-selection';

export class ColorMapLegend {
  range: Vec2;
  colors: Vec3[];
  direction: 'horizontal' | 'vertical';
  digits: number;
  image: HTMLImageElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
  nPoints: number;
  fontSize: number = 0.8;
  wrapper: HTMLDivElement;

  constructor(private container: HTMLDivElement) {
    this.range = [0, 1];
    this.colors = [[0, 0, 0], [1, 1, 1]];
    this.nPoints = 128;
    this.direction = 'vertical';
    this.digits = 1;
    this.wrapper = document.createElement('div');
    this.wrapper.style.width = '100%';
    this.wrapper.style.height = '100%';
    this.wrapper.style.position = 'relative';
    this.image = document.createElement('img');
    this.canvas = document.createElement('canvas');
    this.setDirection('vertical');
    this.context = this.canvas.getContext('2d')!;
    this.wrapper.appendChild(this.image);
    this.container.appendChild(this.wrapper);
    this.draw();
  }

  setRange(range: Vec2) {
    this.range = [range[0], range[1]];
  }

  setColors(colors: Vec3[]) {
    this.colors = [...colors];
  }

  setDirection(direction: 'horizontal' | 'vertical') {
    this.direction = direction;
    if (direction === 'horizontal') {
      this.canvas.width = this.nPoints;
      this.canvas.height = 1;
      this.image.style.position = 'absolute';
      this.image.style.width = '100%';
      this.image.style.height = '1rem';
      this.image.style.bottom = '0';
      this.container.style.paddingBottom = '0';
      this.container.style.paddingTop = '0';
      this.container.style.paddingLeft = `${0.5 * this.fontSize}rem`;
      this.container.style.paddingRight = `${0.5 * this.fontSize}rem`;
      this.imageData = new ImageData(this.nPoints, 1);
    } else {
      this.canvas.height = this.nPoints;
      this.canvas.width = 1;
      this.image.style.position = 'absolute';
      this.image.style.width = '1rem';
      this.image.style.height = '100%';
      this.container.style.paddingLeft = '0';
      this.container.style.paddingRight = '0';
      this.container.style.paddingTop = `${0.5 * this.fontSize}rem`;
      this.container.style.paddingBottom = `${0.5 * this.fontSize}rem`;
      this.imageData = new ImageData(1, this.nPoints);
    }
  }

  setDigits(digits: number) {
    this.digits = digits;
  }

  draw() {
    this.drawMap();
    this.drawTicks();
  }

  private drawMap() {
    let scale: Scale;
    if (this.direction === 'horizontal') {
      scale = linearScale([0, this.nPoints -1], [0, 1]);
    } else {
      scale = linearScale([0, this.nPoints -1], [1, 0]);
    }
    
    const colorMap = createColorMap(this.colors, scale);

    for (let i = 0; i < this.nPoints; ++i) {
      colorMap(i).concat(1)
        .map(v => v * 255)
        .forEach((c, j) => {
          this.imageData.data[i * 4 + j] = c;
        });
    }

    this.context.putImageData(this.imageData, 0, 0);
    this.image.src = this.canvas.toDataURL();
  }

  private drawTicks() {
    const nTicks = 5;
    const ticks : number[] = [];
    const scale = linearScale([0, nTicks - 1], this.range);
    for (let i = 0; i < nTicks; ++i) {
      ticks.push(scale(i));
    }

    const spans = select(this.wrapper).selectAll('span').data(ticks);

    const setupSpans = (selection: any) => {
      let bottom : any;
      let left: any;
      let transform: string;
      if (this.direction === 'horizontal') {
        left = (_d: number, i: number) => `${i / (nTicks - 1) * 100}%`;
        bottom = '1.5rem';
        transform = 'translateX(-50%)';
      } else {
        bottom = (_d: number, i: number) => `${i / (nTicks - 1) * 100}%`;
        left = '1.5rem';
        transform = 'translateY(50%)';
      }
      selection
        .text((d: number) => d.toFixed(this.digits))
        .style('position', 'absolute')
        .style('font-size', `${this.fontSize}rem`)
        .style('bottom', bottom)
        .style('transform', transform)
        .style('left', left);
    }

    // Enter
    setupSpans(spans.enter().append('span'));
    // Update
    setupSpans(spans);
    // Remove
    spans.exit().remove();
  }
}
