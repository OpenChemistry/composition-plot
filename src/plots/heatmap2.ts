import { Selection, BaseType, select } from 'd3-selection';
import { axisBottom, axisLeft } from 'd3-axis';
// import { line, curveLinearClosed } from 'd3-shape';

import { scaleLinear, ScaleLinear } from 'd3-scale';

import { uniqueId } from 'lodash-es';
import { RGBColor, ColorMap, OpacityMap } from '@colormap/core';

interface IMargins {
  left: number;
  bottom: number;
  top: number;
  right: number;
}

class HeatMap2 {

  name: string;
  id: string;
  container: HTMLDivElement;
  imgContainer: HTMLDivElement;
  svgContainer: HTMLDivElement;
  img: HTMLImageElement;
  svg: SVGSVGElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  colorFn: ColorMap = (x) => [x, x, x];
  opacityFn: OpacityMap = () => 1;
  data: number[][] = [];
  dataGroup: Selection<BaseType, {}, null, undefined>;
  axesGroup: Selection<BaseType, {}, null, undefined>;
  margins: IMargins;
  textColor: RGBColor = [0, 0 ,0];

  constructor(container: HTMLDivElement) {
    this.id = uniqueId();
    this.margins = {
      left: 60,
      bottom: 50,
      top: 10,
      right: 10
    }

    this.container = container;

    this.imgContainer = document.createElement('div');
    this.imgContainer.style.position = 'absolute';
    this.imgContainer.style.width = '100%';
    this.imgContainer.style.height = '100%';
    this.imgContainer.style.boxSizing = 'border-box';
    this.imgContainer.style.paddingLeft = `${this.margins.left}px`;
    this.imgContainer.style.paddingRight = `${this.margins.right}px`;
    this.imgContainer.style.paddingTop = `${this.margins.top}px`;
    this.imgContainer.style.paddingBottom = `${this.margins.bottom}px`;

    this.svgContainer = document.createElement('div');
    this.svgContainer.style.position = 'absolute';
    this.svgContainer.style.width = '100%';
    this.svgContainer.style.height = '100%';

    this.container.appendChild(this.imgContainer);
    this.container.appendChild(this.svgContainer);

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.img = document.createElement('img');
    this.img.style.setProperty('image-rendering', '-webkit-crisp-edges');
    this.img.style.setProperty('image-rendering', '-moz-crisp-edges');
    this.img.style.setProperty('image-rendering', 'pixelated');
    this.img.style.width = '100%';
    this.img.style.height = '100%';

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.imageData = new ImageData(1, 1);

    this.imgContainer.appendChild(this.img);
    this.svgContainer.appendChild(this.svg);

    this.dataGroup = select(this.svg)
      .append('g')
      .classed('data', true);

    this.axesGroup = select(this.svg)
      .append('g')
      .classed('axes', true);
  }

  setData(data: number[][]) {
    this.data = data;
    this.render();
  }

  setColorFn(colorFn: ColorMap) {
    this.colorFn = colorFn;
    this.drawMap();
  }

  setOpacityFn(opacityFn: OpacityMap) {
    this.opacityFn = opacityFn;
    this.drawMap();
  }

  setScales() {
    let xSize = 0;
    let ySize = this.data.length;
    this.data.forEach(arr => {
      xSize = Math.max(xSize, arr.length);
    });

    const w = this.svg.parentElement.clientWidth;
    const h = this.svg.parentElement.clientHeight;

    if (xSize === 0) {
      xSize = 1;
    }

    if (ySize === 0) {
      ySize = 1;
    }

    this.imageData = new ImageData(xSize, ySize);
    this.canvas.width = xSize;
    this.canvas.height = ySize;

    this.xScale = scaleLinear().domain([0, xSize]).range([this.margins.left, w - this.margins.right]);
    this.yScale = scaleLinear().domain([0, ySize]).range([h - this.margins.bottom, this.margins.top]);
  }

  drawAxes() {
    this.axesGroup.selectAll('g').remove();

    const xAxis = axisBottom(this.xScale);
    const yAxis = axisLeft(this.yScale);

    this.axesGroup.append('g')
      .classed('x-axis', true)
      .attr('transform', `translate(0, ${this.yScale(this.yScale.domain()[0])})`)
      .call(xAxis);

    this.axesGroup.append('g')
      .classed('y-axis', true)
      .attr('transform', `translate(${this.xScale(this.xScale.domain()[0])}, 0)`)
      .call(yAxis);

    // Add axis labels

    let xLow = this.xScale(this.xScale.domain()[0]);
    let xMid = this.xScale(this.xScale.domain()[0] + (this.xScale.domain()[1] - this.xScale.domain()[0]) /2 );
    let yLow = this.yScale(this.yScale.domain()[0]);
    let yMid = this.yScale(this.yScale.domain()[0] + (this.yScale.domain()[1] - this.yScale.domain()[0]) /2 );

    let xLabel: string = 'iteration';
    let yLabel: string = 'user';

    this.axesGroup
      .append('g')
      .attr("transform", `translate(${xMid}, ${yLow + 40})`)
      .append("text")
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('fill', `rgb(${this.textColor[0] * 255}, ${this.textColor[1] * 255}, ${this.textColor[2] * 255})`)
        .text(xLabel);

    this.axesGroup
      .append('g')
      .attr("transform", `translate(${xLow - 40}, ${yMid})`)
      .append("text")
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('font-family', 'sans-serif')
        .attr('fill', `rgb(${this.textColor[0] * 255}, ${this.textColor[1] * 255}, ${this.textColor[2] * 255})`)
        .text(yLabel);

  }

  drawMap() {
    const { width, height } = this.imageData;
    this.data.forEach((row, i) => {
      row.forEach((value, j) => {

        const rgba = [...this.colorFn(value), this.opacityFn(value)].map(c => c * 255);
        rgba.forEach((c, k) => {
          const idx = ((height - i - 1) * width + j) * 4 + k;
          this.imageData.data[idx] = c;
        })
      })
    });

    this.context.putImageData(this.imageData, 0, 0);
    this.img.src = this.canvas.toDataURL();
  }

  render() {
    this.setScales();
    this.drawAxes();
    this.drawMap();
  }
}

export { HeatMap2 };
