import { Selection, BaseType, select } from 'd3-selection';
import { line, curveLinearClosed } from 'd3-shape';
import {has} from 'lodash-es';
import { IDataSet } from '../types';
import { scalarToColor } from '../utils/colors';
import { ScaleLinear, scaleLinear } from 'd3-scale';

interface IPlotOptions {
  scalarIdx: number;
  componentsIdx: number[];
  constantComponentIdx: number;
  spacing: number[];
  range: number[][];
}

class TernaryPlot {

  name: string;
  svg: HTMLElement;
  upsideDown: boolean;
  vertices: [number, number][];
  rootGroup: Selection<BaseType, {}, null, undefined>;
  gridGroup: Selection<BaseType, {}, null, undefined>;
  dataGroup: Selection<BaseType, {}, null, undefined>;
  dataTooltip: Selection<BaseType, {}, null, undefined>;
  scales: ScaleLinear<number, number>[];
  edge: number;
  data: IDataSet;
  colorMap: [number, number, number][];
  colorMapRange: [number, number] = [0, 1];
  plotOptions: IPlotOptions;

  spacing: number[];
  range: number[][];

  onSelect: Function;
  onDeselect: Function;

  mouseDown: boolean = false;

  constructor(name: string, svg: HTMLElement, upsideDown: boolean = false) {
    this.name = name;
    this.svg = svg;
    this.upsideDown = upsideDown;
    this.vertices = [
      [0, 0],
      [0, 0],
      [0, 0]
    ];

    this.rootGroup = select(svg)
      .append('g')
      .classed(`${name}`, true);

    this.dataGroup = this.rootGroup
      .append('g')
      .classed('data', true);

    this.gridGroup = this.rootGroup
      .append('g')
      .classed('grid', true)
      .style('pointer-events', 'none');

    this.dataTooltip = select(this.svg.parentElement)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('background-color', 'lightsteelblue')
      .style('border-radius', '0.5rem')
      .style('pointer-events', 'none')
      .style('padding', '0.5rem')
      .style('font-family', 'sans-serif')
      .style('font-size', 'small');

    this.svg.addEventListener('mousedown', () => {this.mouseDown = true});
    this.svg.addEventListener('mouseup', () => {this.mouseDown = false});
    // dragging randomly gets in the way
    this.svg.addEventListener('dragstart', (e) => {e.preventDefault()});
  }

  setSize(left: number, right: number) {
    // In an svg there can be several ternary plots,
    // set the left/right boundaries of this plot
    const h = this.svg.parentElement.clientHeight;
    
    // Base and height of triangle
    const base = right - left;
    const height = base * Math.sin(2 * Math.PI / 6);

    this.edge = base;

    if (this.upsideDown) {
      this.vertices[0] = [left, (h - height) / 2];
      this.vertices[1] = [right, (h - height) / 2];
      this.vertices[2] = [left + base / 2, h - (h - height) / 2];
    } else {
      this.vertices[0] = [left, h - (h - height) / 2];
      this.vertices[1] = [right, h - (h - height) / 2];
      this.vertices[2] = [left + base / 2, (h - height) / 2];
    }
    this.drawGrid();
    this.drawData();
  }

  drawGrid() {
    let circles = this.gridGroup
      .selectAll('circle')
      .data(this.vertices);

    // Update
    circles
      .attr('cx', (d) => {return d[0]})
      .attr('cy', (d) => {return d[1]})
      .attr('r', 3)
        

    // Enter
    circles
      .enter()
      .append('circle')
      .attr('cx', (d) => {return d[0]})
      .attr('cy', (d) => {return d[1]})
      .attr('r', 3)

    if (!this.data) {
      return;
    }

    let labels = this.gridGroup
      .selectAll('text')
      .data(this.vertices);

    labels
      .enter()
      .append('text')
      .attr('x', (d) => d[0])
      .attr('y', (d, i) => {
        if (
          (this.upsideDown && (i !== 2)) ||
          (!this.upsideDown && i === 2)
        ) {
          return d[1] - 24;
        } else {
          return d[1] + 48;
        }
      })
      .attr('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '1.5rem')
      .text((d, i) => {d; return this.data.elements[this.plotOptions.componentsIdx[i]]})

    this.gridGroup.selectAll('path').remove();

    let outlineFn = line()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveLinearClosed)
    
    this.gridGroup
      .append('path')
        .datum(this.vertices)
        .attr('d', outlineFn)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0, 0, 0, 0.7')
        .attr('stroke-width', 1.5);


    let gridlineFn = line()
      .x((d) => d[0])
      .y((d) => d[1]);

    // Add major grid lines
    for (let i = 0; i < 3; ++ i) {
      const delta = this.plotOptions.range[i][1] - this.plotOptions.range[i][0];
      const n = Math.round(delta / this.plotOptions.spacing[i]);

      for (let j = 1; j < n; ++j) {
        let points: [number, number, number][] = [
          [this.plotOptions.range[0][0], this.plotOptions.range[1][0], this.plotOptions.range[2][0]],
          [this.plotOptions.range[0][0], this.plotOptions.range[1][0], this.plotOptions.range[2][0]],
        ];
        let frac = j * this.plotOptions.spacing[i];
        for (let k = 0; k < 2; ++k) {
          points[k][i] = this.plotOptions.range[i][1] - frac;
          let l = (i + k + 1) % 3;
          let ratio = (this.plotOptions.range[i][1] - this.plotOptions.range[i][0]) / (this.plotOptions.range[l][1] - this.plotOptions.range[l][0]);
          points[k][l] = this.plotOptions.range[l][0] + frac / ratio;
        }
        let points2d = points.map(val => this.cartToxy(val));
        this.gridGroup
          .append('path')
          .datum(points2d)
          .attr('d', gridlineFn)
          .attr('stroke', 'rgba(0, 0, 0, 0.2)');
      }
    }
    
    // Add minor grid lines
  }

  drawData() {
    if (!this.data) {
      return;
    }

    let points3d = this.data.samples.map((val: any): [number, number, number] => {
      return [
        val.components[this.plotOptions.componentsIdx[0]],
        val.components[this.plotOptions.componentsIdx[1]],
        val.components[this.plotOptions.componentsIdx[2]],
      ]
    })

    const selectedHexagons = {};

    let hexFn = line()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveLinearClosed);

    const fillFn = (d, i) => {
      if (! this.colorMap) {
        return 'rgba(0, 0, 0, 0.2';
      }
      // console.log(d);
      d;
      let color = scalarToColor(this.data.samples[i].values[this.plotOptions.scalarIdx], this.colorMap, this.colorMapRange);
      return `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
    }

    const onMouseOver = (d, i, targets) => {
      if (this.mouseDown) {
        if (has(selectedHexagons, i)) {
          delete selectedHexagons[i];
          select(targets[i])
            .attr('stroke-width', 0);
          if (this.onDeselect) {
            this.onDeselect(this.data.samples[i]);
          }
        } else {
          selectedHexagons[i] = true;
          select(targets[i])
            .attr('stroke', 'red')
            .attr('stroke-width', 2);
          if (this.onSelect) {
            this.onSelect(this.data.samples[i]);
          }
        }
      }
      // d is the datum, i is the index in the data
      this.dataTooltip.html(`
        ${this.data.elements[this.plotOptions.componentsIdx[0]]}: ${points3d[i][0].toFixed(2)}<br>
        ${this.data.elements[this.plotOptions.componentsIdx[1]]}: ${points3d[i][1].toFixed(2)}<br>
        ${this.data.elements[this.plotOptions.componentsIdx[2]]}: ${points3d[i][2].toFixed(2)}<br>
        ${this.plotOptions.constantComponentIdx
          ? `${this.data.elements[this.plotOptions.constantComponentIdx]}: ${this.data.samples[i].components[this.plotOptions.constantComponentIdx].toFixed(2)}<br>`
          : ``}
        ${this.data.scalars[this.plotOptions.scalarIdx]}: ${this.data.samples[i].values[this.plotOptions.scalarIdx].toFixed(2)}<br>
      `)
      this.dataTooltip
        .style('opacity', 0.9)
        .style('left', `${d[0][0] + this.svg.clientLeft}px`)
        .style('top', `${d[0][1] + this.svg.clientTop}px`)
        .style('transform', `translateY(-100%)`);
    }

    const onMouseOut = () => {
      this.dataTooltip
        .style('opacity', 0);
    }

    const onMouseDown = (d, i, targets) => {
      d;
      if (has(selectedHexagons, i)) {
        delete selectedHexagons[i];
        select(targets[i])
          .attr('stroke-width', 0);
        if (this.onDeselect) {
          this.onDeselect(this.data.samples[i]);
        }
      } else {
        selectedHexagons[i] = true;
        select(targets[i])
          .attr('stroke', 'red')
          .attr('stroke-width', 2);
        if (this.onSelect) {
          this.onSelect(this.data.samples[i]);
        }
      }
    }

    const hexagons = this.dataGroup
      .selectAll('path')
      .data(points3d);

    // Enter
    hexagons
      .enter()
        .append('path')
        .datum((d) => this._makeHexagon(d))
        .attr('d', hexFn)
        .attr('fill', fillFn)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut)
        .on('mousedown', onMouseDown);

    // Update
    hexagons
      .datum((d) => this._makeHexagon(d))
      .attr('d', hexFn)
      .attr('fill', fillFn)
      .on('mouseover', onMouseOver)
      .on('mouseout', onMouseOut)
      .on('mousedown', onMouseDown);

    //Remove
  }

  setColorMap(map: [number, number, number][], range: [number, number]) {
    this.colorMap = map;
    this.colorMapRange = range;
    this.drawData();
  }

  _makeHexagon(cart: [number, number, number]) : [number, number][] {
    let radius = 1 / Math.sqrt(3) * this.edge * this.plotOptions.spacing[0] / (this.plotOptions.range[0][1] - this.plotOptions.range[0][0]);
    radius *= 0.99;
    let center = this.cartToxy(cart);
    let points: [number, number][] = [];
    for (let i = 0; i < 6; ++i) {
      let xy: [number, number] = [
        radius * Math.cos(Math.PI * (2 * i + 1) / 6) + center[0],
        radius * Math.sin(Math.PI * (2 * i + 1) / 6) + center[1],
      ]
      points.push(xy);
    }
    return points;
  }

  setData(data: IDataSet, components: string[] = null, constantComponent: string = null) {
    this.data = data;

    this.scales = [];
    let spacing: number[];
    if (!data.spacing) {
      spacing = [0.1, 0.1, 0.1];
    } else {
      if (Array.isArray(data.spacing)) {
        spacing = data.spacing;
      } else {
        spacing = [data.spacing, data.spacing, data.spacing];
      }
    }

    let range: number[][];
    if (!data.range) {
      range = [[0, 1], [0, 1], [0, 1]];
    } else {
      if (Array.isArray(data.range) && (data.range as any[]).every(el => Array.isArray(el))) {
        range = data.range as number[][];
      // } else if (Array.isArray(data.range)) {
      //   let r = data.range as number[];
      //   range = [r, r, r];
      } else {
        range = [[0, 1], [0, 1], [0, 1]];
      }
    }

    for (let i = 0; i < 3; ++i) {
      this.scales.push(scaleLinear().domain(range[i]).range([0, 1]));
    }

    this.plotOptions = {
      scalarIdx: 0,
      componentsIdx: components ? components.map(c => data.elements.findIndex(el => el === c)) : [0, 1, 2],
      constantComponentIdx: constantComponent ? data.elements.findIndex((val) => val === constantComponent) : null,
      spacing: spacing,
      range: range
    }

    this.drawGrid();
    this.drawData();
  }

  selectScalar(scalar: string) {
    this.plotOptions = {
      ...this.plotOptions,
      scalarIdx: scalar ? this.data.scalars.findIndex((val) => val === scalar) : 0
    }

    // this.drawGrid();
    this.drawData();
  }

  cartToxy(cart: [number, number, number]) : [number, number] {
    let xy: [number, number] = [0, 0];

    let frac = [0, 0, 0];
    for (let i = 0; i < 3; ++i) {
      frac[i] = this.scales[i](cart[i]);
    }

    xy[0] = 0.5 * ((2 * frac[1] + frac[2]) / (frac[0] + frac[1] + frac[2]));
    xy[1] = 0.5 * Math.sqrt(3) * frac[2] / (frac[0] + frac[1] + frac[2]);

    xy[0] *= this.edge;
    xy[1] *= this.edge;

    xy[0] += this.vertices[0][0];

    if (this.upsideDown) {
      xy[1] += this.vertices[0][1];
    } else {
      xy[1] = -xy[1] + this.vertices[0][1];
    }
    return xy;
  }
}

export { TernaryPlot };
