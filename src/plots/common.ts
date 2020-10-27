import { Selection, BaseType, select, event as currentEvent } from 'd3-selection';
import { line, curveLinearClosed } from 'd3-shape';

import { RGBColor, Scale } from '@colormap/core';

import { ISample, Vec2, IAxis } from '../types';
import { DataProvider } from '../data-provider';
import { rgbToString } from '../utils/colors';

export enum PlotTypes {
  Unary,
  BinaryHorizontal,
  BinaryVertical,
  TernaryUp,
  TernaryDown
}

export enum SampleShape {
  Hexagon,
  Square,
  Circle
}

export interface IVertex {
  position: Vec2;
  labelPosition?: Vec2;
}

export type VerticesFn = () => IVertex[];

export type SamplePositionFn = (sample: ISample) => Vec2

export function verticesFnFactory(plotType: PlotTypes, origin: Vec2, size: number, fontSize: number) : VerticesFn {
  switch (plotType) {
    case PlotTypes.Unary : {
      return () => [
        {
          position: [origin[0], origin[1]],
          labelPosition: [origin[0] - 1.25 * fontSize, origin[1] + fontSize * 0.4]
        }
      ]
    }

    case PlotTypes.BinaryHorizontal : {
      return () => [
        {
          position: [origin[0], origin[1]],
          labelPosition: [origin[0] - fontSize, origin[1] + fontSize * 0.4]
        },
        {
          position: [origin[0] + size, origin[1]],
          labelPosition: [origin[0] + size + fontSize, origin[1] + fontSize * 0.4]
        }
      ]
    }

    case PlotTypes.TernaryUp : {
      const height = Math.round(size * Math.sin(2 * Math.PI / 6));
      const positions : Vec2[] = [
        [origin[0], origin[1] + height],
        [origin[0] + size, origin[1] + height],
        [origin[0] + size / 2, origin[1]]
      ]
      return () => [
        {
          position: positions[0],
          labelPosition: [positions[0][0], positions[0][1] + fontSize]
        },
        {
          position: positions[1],
          labelPosition: [positions[1][0], positions[1][1] + fontSize]
        },
        {
          position: positions[2],
          labelPosition: [positions[2][0], positions[2][1] - 0.5 * fontSize]
        }
      ]
    }

    case PlotTypes.TernaryDown : {
      const height = Math.round(size * Math.sin(2 * Math.PI / 6));
      const positions : Vec2[] = [
        [origin[0], origin[1]],
        [origin[0] + size, origin[1]],
        [origin[0] + size / 2, origin[1] + height]
      ]
      return () => [
        {
          position: positions[0],
          labelPosition: [positions[0][0], positions[0][1] - 0.5 * fontSize]
        },
        {
          position: positions[1],
          labelPosition: [positions[1][0], positions[1][1] - 0.5 * fontSize]
        },
        {
          position: positions[2],
          labelPosition: [positions[2][0], positions[2][1] + fontSize]
        }
      ]
    }

    default: {
      console.warn(`verticesFnFactory not yet implemented for the ${plotType.toString()} case.`);
      return () => [];
    }
  }
}

export function samplePositionFnFactory(plotType: PlotTypes, verticesFn: VerticesFn, scales: Scale[], edge: number, dp: DataProvider) : SamplePositionFn {
  const vertices = verticesFn();
  switch (plotType) {
    case PlotTypes.Unary : {
      return () => vertices[0].position;
    }

    case PlotTypes.BinaryHorizontal : {
      return (sample) => {
        let pos: [number, number] = [0, 0];
        const composition = dp.getActiveAxes().map(element => DataProvider.getSampleElementFraction(sample, element));
        let frac = composition.map((val, i) => scales[i](val));
        pos[0] = 1 - frac[0];
        pos[0] *= edge;
        pos[0] += vertices[0].position[0];
        pos[1] += vertices[0].position[1];
        return pos;
      }
    }

    case PlotTypes.TernaryUp : {
      return (sample) => {
        let pos: [number, number] = [0, 0];
        const composition = dp.getActiveAxes().map(element => DataProvider.getSampleElementFraction(sample, element));
        let frac = composition.map((val, i) => scales[i](val));
        pos[0] = 0.5 * ((2 * frac[1] + frac[2]) / (frac[0] + frac[1] + frac[2]));
        pos[1] = 0.5 * Math.sqrt(3) * frac[2] / (frac[0] + frac[1] + frac[2]);
        pos[0] *= edge;
        pos[1] *= edge;
        pos[0] += vertices[0].position[0];
        // pos[1] += vertices[0].position[1];
        pos[1] = -pos[1] + vertices[0].position[1];
        return pos;
      }
    }

    case PlotTypes.TernaryDown : {
      return (sample) => {
        let pos: [number, number] = [0, 0];
        const composition = dp.getActiveAxes().map(element => DataProvider.getSampleElementFraction(sample, element));
        let frac = composition.map((val, i) => scales[i](val));
        pos[0] = 0.5 * ((2 * frac[1] + frac[2]) / (frac[0] + frac[1] + frac[2]));
        pos[1] = 0.5 * Math.sqrt(3) * frac[2] / (frac[0] + frac[1] + frac[2]);
        pos[0] *= edge;
        pos[1] *= edge;
        pos[0] += vertices[0].position[0];
        pos[1] += vertices[0].position[1];
        return pos;
      }
    }

    default: {
      console.warn(`samplePositionFnFactory not yet implemented for the ${plotType} case.`);
      return () => vertices[0].position;
    }
  }
}

class BasePlot {

  id: string;
  svg: HTMLElement;
  dp: DataProvider;
  rootGroup: Selection<BaseType, {}, null, undefined>;
  gridGroup: Selection<BaseType, {}, null, undefined>;
  dataGroup: Selection<BaseType, {}, null, undefined>;
  dataTooltip: Selection<BaseType, unknown, HTMLElement, unknown>;
  sampleShape: SampleShape = SampleShape.Hexagon;

  colorFn: (sample: ISample, dp: DataProvider) => RGBColor = () => [0.5, 0.5, 0.5];
  opacityFn: (sample: ISample, dp: DataProvider) => number = () => 1;

  verticesFn: VerticesFn = () => [];
  samplePositionFn: SamplePositionFn = () => [0, 0];

  borderColorFn: (sample: ISample, dp: DataProvider) => RGBColor = () => [1, 1, 1];
  borderWidthFn: (sample: ISample, dp: DataProvider) => number = () => 0;

  labelColorFn: (element: string) => RGBColor = () => [0, 0, 0];

  sampleRadius: number = 10;
  spacing: number[];
  range: number[][];
  enableTooltip: boolean = true;

  onSelect: (sample: ISample) => void;

  mouseDown: boolean = false;

  constructor(svg: HTMLElement, dp: DataProvider, id: string ) {
    this.id = id;
    this.svg = svg;
    this.dp = dp;

    select(svg).selectAll(`.${id}`).remove();
    this.rootGroup = select(svg)
      .append('g')
      .classed(`${id}`, true);

    this.dataGroup = this.rootGroup
      .append('g')
      .classed('data', true);

    this.gridGroup = this.rootGroup
      .append('g')
      .classed('grid', true)
      .style('pointer-events', 'none');

    select(this.svg.parentElement).selectAll('.tooltip')
      .data([1])
      .enter()
      .append("div")
      .attr('class', 'tooltip')
      .style('opacity', 0.9)
      .style('display', 'none')
      .style('position', 'fixed')
      .style('text-align', 'center')
      .style('background-color', 'lightsteelblue')
      .style('border-radius', '0.5rem')
      .style('pointer-events', 'none')
      .style('padding', '0.5rem')
      .style('font-family', 'sans-serif')
      .style('font-size', 'small');

    this.dataTooltip = select(this.svg.parentElement).selectAll('.tooltip');

    this.svg.addEventListener(
      'mousedown', () => {
        this.mouseDown = true;

        const mouseUpListener = () => {
          window.removeEventListener('mouseup', mouseUpListener);
          this.mouseDown = false;
        };

        window.addEventListener('mouseup', mouseUpListener);
      }
    );
    // dragging randomly gets in the way
    this.svg.addEventListener('dragstart', (e) => {e.preventDefault()});
  }

  setColorFn(fn: (sample: ISample, dp: DataProvider) => RGBColor) {
    this.colorFn = fn;
  }

  setOpacityFn(fn: (sample: ISample, dp: DataProvider) => number) {
    this.opacityFn = fn;
  }

  setBorderColorFn(fn: (sample: ISample, dp: DataProvider) => RGBColor) {
    this.borderColorFn = fn;
  }

  setBorderWidthFn(fn: (sample: ISample, dp: DataProvider) => number) {
    this.borderWidthFn = fn;
  }

  setLabelColorFn(fn: (element: string) => RGBColor) {
    this.labelColorFn = fn;
  }

  release() {
    select(this.svg).selectAll(`.${this.id}`).remove();
  }

  render() {
    this.drawGrid();
    this.drawData();
  }

  drawGrid() {
    const vertices = this.verticesFn();

    const circles = this.gridGroup
      .selectAll('circle')
      .data([]);

    // Update
    circles
      .attr('cx', (d) => {return d.position[0]})
      .attr('cy', (d) => {return d.position[1]})
      .attr('r', 3)

    // Enter
    circles
      .enter()
      .append('circle')
      .attr('cx', (d) => {return d.position[0]})
      .attr('cy', (d) => {return d.position[1]})
      .attr('r', 3)

    // Exit
    circles
      .exit()
      .remove()

    const outlines = this.gridGroup.selectAll('path').data([0]);

    const positions = vertices.map(v => v.position);

    let outlineFn = line()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveLinearClosed)

    // Update
    outlines
      .datum(positions)
      .attr('d', outlineFn)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0, 0, 0, 0.7')
      .attr('stroke-width', 1.5);

    // Enter
    outlines
      .enter()
      .append('path')
        .datum(positions)
        .attr('d', outlineFn)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0, 0, 0, 0.7')
        .attr('stroke-width', 1.5);

    // Exit
    outlines
      .exit()
      .remove();

    const axisLabels = vertices.filter(vert => vert.labelPosition).map((vert, i) => (
      {
        position: vert.labelPosition,
        label: this.dp.getAxisLabel(i)
      }
    ));

    const fontSize = 16;

    const labels = this.gridGroup
      .selectAll('text')
      .data(axisLabels);

    // Update
    labels
      .attr('x', (d) => d.position[0])
      .attr('y', (d) => d.position[1])
      .attr('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .attr('font-size', `${fontSize}px`)
      .attr('fill', (d) => rgbToString(...this.labelColorFn(d.label)))
      .style('user-select', 'none')
      .style('pointer-events',  'none')
      .text((d) => d.label);

    // Enter
    labels
      .enter()
      .append('text')
      .attr('x', (d) => d.position[0])
      .attr('y', (d) => d.position[1])
      .attr('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .attr('font-size', `${fontSize}px`)
      .attr('fill', (d) => rgbToString(...this.labelColorFn(d.label)))
      .style('user-select', 'none')
      .style('pointer-events',  'none')
      .text((d) => d.label);

    // Exit
    labels
      .exit()
      .remove()
  }

  drawData() {

    let hexFn = line()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveLinearClosed);

    const fillFn = (_d, i) => {
      const [r, g, b] = this.colorFn(this.dp.getSamples()[i], this.dp);
      const opacity = this.opacityFn(this.dp.getSamples()[i], this.dp);
      return rgbToString(r, g, b, opacity);
    }

    const strokeFn = (_d, i) => {
      const [r, g, b] = this.borderColorFn(this.dp.getSamples()[i], this.dp);
      return rgbToString(r, g, b);
    }

    const strokeWidthFn = (_d, i) => {
      return this.borderWidthFn(this.dp.getSamples()[i], this.dp);
    }

  const onMouseOver = (_d, i, _hexagons) => {
      if (this.enableTooltip && !this.mouseDown) {
        const x = currentEvent.clientX;
        const y = currentEvent.clientY;
        let tooltipHtml = "";
        Object.entries(this.dp.getSamples()[i].composition).forEach(([el, frac]) => {
          if (frac > Number.EPSILON) {
            tooltipHtml += `${this.dp.getAxisLabel(el)}: ${frac.toFixed(2)}<br>`;
          }
        });

        const activeScalar = this.dp.getActiveScalar();
        const scalarValue = DataProvider.getSampleScalar(this.dp.getSamples()[i], activeScalar);
        if (Number.isFinite(scalarValue)) {
          tooltipHtml += `${activeScalar.replace('\\u002', '.')}: ${scalarValue.toFixed(2)}<br>`;
        }

        this.dataTooltip.html(tooltipHtml);
        this.dataTooltip
          .style('left', `${x+10}px`)
          .style('top', `${y-10}px`)
          .style('transform', `translateY(-100%)`)
          .style('display', 'block');
      }
    }

    const onMouseOut = () => {
      this.dataTooltip
      .style('display', 'none');
    }

    const onMouseDown = (_d, i) => {
      if (this.onSelect) {
        this.onSelect(this.dp.getSamples()[i]);
      }
    }

    const hexagons = this.dataGroup
      .selectAll('path')
      .data(this.dp.getSamples());

    let pathFn;
    switch(this.sampleShape) {
      case SampleShape.Square: {
        pathFn = this._polygonFn(4, 1);
        break;
      }
      case SampleShape.Circle: {
        pathFn = this._polygonFn(18);
        break;
      }
      case SampleShape.Hexagon:
      default: {
        pathFn = this._polygonFn(6, 1);
      }
    }

    // Enter
    hexagons
      .enter()
        .append('path')
        .datum((d) => pathFn(d))
        .attr('d', hexFn)
        .attr('fill', fillFn)
        .attr('stroke', strokeFn)
        .attr('stroke-width', strokeWidthFn)
        .on('mouseenter', onMouseOver)
        .on('mouseout', onMouseOut)
        .on('mousedown', onMouseDown);

    // Update
    hexagons
      .datum((d) => pathFn(d))
      .attr('d', hexFn)
      .attr('fill', fillFn)
      .attr('stroke', strokeFn)
      .attr('stroke-width', strokeWidthFn)
      .on('mouseenter', onMouseOver)
      .on('mouseout', onMouseOut)
      .on('mousedown', onMouseDown);

    //Remove
    hexagons
      .exit()
      .remove();
  }

  setSelectCallback(fn: (sample: ISample) => void) {
    this.onSelect = fn;
  }

  setSampleRadius(radius: number) {
    this.sampleRadius = radius;
  }

  setSampleShape(shape: SampleShape) {
    this.sampleShape = shape;
  }

  setEnableTooltip(enable: boolean) {
    this.enableTooltip = enable;
  }

  _polygonFn = (nPoints: number, phase: number = 0) => {
    return (sample: ISample) : [number, number][] => {
      let radius = this.sampleRadius;
      radius *= 0.99;
      let center = this.samplePositionFn(sample);
      let points: [number, number][] = [];
      for (let i = 0; i < nPoints; ++i) {
        let xy: [number, number] = [
          radius * Math.cos(Math.PI * (2 * i + phase) / nPoints) + center[0],
          radius * Math.sin(Math.PI * (2 * i + phase) / nPoints) + center[1],
        ]
        points.push(xy);
      }
      return points;
    }
  }

  dataUpdated() {
  }
}

class QuaternaryShellPlot {
  id: string;
  svg: HTMLElement;
  dp: DataProvider;
  plots: BasePlot[] = [];
  initialShell: number = 0;
  finalShell: number = 0;
  spacing: number = 0.1;
  edgeUnit: number = 100;
  origin: Vec2 = [0, 0];
  maxWidth: number = 1200;
  margin: number = 50;
  sampleRadius: number = 10;
  sampleShape: SampleShape = SampleShape.Hexagon;
  enableTooltip: boolean = true;
  avoidDuplicates: boolean = true;

  colorFn: (sample: ISample, dp: DataProvider) => RGBColor = () => [0.5, 0.5, 0.5];
  opacityFn: (sample: ISample, dp: DataProvider) => number = () => 1;
  labelColorFn: (element: string) => RGBColor = () => [0, 0, 0];
  borderColorFn: (sample: ISample, dp: DataProvider) => RGBColor = () => [1, 1, 1];
  borderWidthFn: (sample: ISample, dp: DataProvider) => number = () => 0;

  onSelect: (sample: ISample) => void = () => {};

  constructor(svg: HTMLElement, dp: DataProvider, id: string ) {
    this.id = id;
    this.svg = svg;
    this.dp = dp;
  }

  setPlacement(
    initialShell: number, finalShell: number, spacing: number, edgeUnit: number,
    origin: Vec2 = [50, 0], maxWidth: number = 1200, margin: number = 50
    ) {
      this.initialShell = initialShell;
      this.finalShell = finalShell;
      this.spacing = spacing;
      this.edgeUnit = edgeUnit;
      this.origin = origin;
      this.maxWidth = maxWidth;
      this.margin = margin;
  }

  initialize() : Vec2 {
    this.release();

    // if (!this.dp.getAxis(0)) {
    //   return;
    // }
    // const spacing = this.dp.getAxis(0).spacing;
    const spacing = this.spacing;
    const finalShell = this.finalShell;
    const initialShell = this.initialShell;
    const edgeUnit = this.edgeUnit;
    const origin = this.origin;
    const maxWidth = this.maxWidth;
    const margin = this.margin;

    this.plots = [];
    const nShells = Math.min(finalShell - initialShell + 1, Math.floor(1 / (3 * spacing)));

    const nPlots = 4;

    let startX = origin[0];
    let rowStartY = origin[1];
    let rowHeight = 0;// Math.round(edgeUnit * Math.sin(2 * Math.PI / 6));

    let sizeX = 0;
    let sizeY = 0;

    for (let i = 0; i < nShells; ++i) {
      let constValue = (i + initialShell) * spacing;
      let edge = Math.round(edgeUnit * (1 - constValue * 4));
      if (edge <= 0) {
        continue;
      }

      const scales = [];
      for (let j = 0; j < 4; ++j) {
        scales.push((x: number) => (x - constValue) / (1 - 3 * constValue));
      }

      const shellWidth = 2.5 * edge;
      const shellHeight = Math.round(edge * Math.sin(2 * Math.PI / 6));
      if (i === 0) {
        startX = origin[0];
        rowHeight = shellHeight;
        sizeY += rowHeight;
      } else if (startX + shellWidth - origin[0] > maxWidth) {
        startX = origin[0];
        rowStartY += rowHeight + 2 * margin;
        rowHeight = shellHeight;
        sizeY += 2 * margin + rowHeight;
      }

      sizeX = Math.max(sizeX, startX + shellWidth - origin[0]);

      let startY = margin + rowStartY + Math.floor(0.5 * (rowHeight - shellHeight));

      for (let j = 0; j < nPlots; ++j) {
        const dp = new DataProvider(3);
        const plot = new BasePlot(this.svg, dp, `${this.id}_face${i}-${j}`);
        const plotType = j % 2 === 0 ? PlotTypes.TernaryUp : PlotTypes.TernaryDown;
        const verticesFn = verticesFnFactory(plotType, [startX + j * (edge / 2), startY], edge, 16);
        const samplePositionFn = samplePositionFnFactory(plotType, verticesFn, scales, edge, dp);
        plot.verticesFn = verticesFn;
        plot.samplePositionFn = samplePositionFn;
        plot.setSampleRadius(this.sampleRadius);
        plot.setSampleShape(this.sampleShape);
        plot.setEnableTooltip(this.enableTooltip);
        plot.setSelectCallback(this.onSelect);
        plot.setColorFn(this.colorFn);
        plot.setOpacityFn(this.opacityFn);
        plot.setBorderColorFn(this.borderColorFn);
        plot.setBorderWidthFn(this.borderWidthFn);
        plot.setLabelColorFn(this.labelColorFn);
        this.plots.push(plot);
      }

      startX += 2 * edge + 2 * spacing * edgeUnit;
    }

    sizeX += 2 * margin;
    sizeY += 2 * margin;

    return [sizeX, sizeY];
  }

  setSelectCallback(fn: (sample: ISample) => void) {
    this.onSelect = fn;
    this.broadCast(plot => {
      plot.setSelectCallback(this.onSelect);
    });
  }

  setColorFn(fn: (sample: ISample, dp: DataProvider) => RGBColor) {
    this.colorFn = fn;
    this.broadCast(plot => {
      plot.setColorFn(this.colorFn);
    });
  }

  setOpacityFn(fn: (sample: ISample, dp: DataProvider) => number) {
    this.opacityFn = fn;
    this.broadCast(plot => {
      plot.setOpacityFn(this.opacityFn);
    });
  }

  setBorderColorFn(fn: (sample: ISample, dp: DataProvider) => RGBColor) {
    this.borderColorFn = fn;
    this.broadCast(plot => {
      plot.setBorderColorFn(this.borderColorFn);
    });
  }

  setBorderWidthFn(fn: (sample: ISample, dp: DataProvider) => number) {
    this.borderWidthFn = fn;
    this.broadCast(plot => {
      plot.setBorderWidthFn(this.borderWidthFn);
    });
  }

  setLabelColorFn(fn: (element: string) => RGBColor) {
    this.labelColorFn = fn;
    this.broadCast(plot => {
      plot.setLabelColorFn(this.labelColorFn);
    });
  }

  setEnableTooltip(enable: boolean) {
    this.broadCast(plot => {
      plot.setEnableTooltip(enable);
    });
  }

  setShellsData() {
    const nShells = Math.floor(this.plots.length / 4);
    for (let i = 0; i < nShells; ++i) {
      const constValue = (i + this.initialShell) * this.spacing;
      this._setShellData(this.plots.slice(i * 4, i * 4 + 4), constValue);
    }
  }

  release() {
    this.broadCast((plot) => {
      plot.release();
    });
  }

  render() {
    const fn = (plot: BasePlot) => {
      plot.render();
    }
    this.broadCast(fn);
  }

  dataUpdated() {
    this.initialize();
    this.setShellsData();
    this.render();
  }

  setSampleRadius(radius: number) {
    this.sampleRadius = radius;
    this.broadCast(plot => {
      plot.setSampleRadius(this.sampleRadius);
      plot.render();
    });
  }

  setSampleShape(shape: SampleShape) {
    this.sampleShape = shape;
    this.broadCast(plot => {
      plot.setSampleShape(this.sampleShape);
      plot.render();
    });
  }

  _setShellData(plots: BasePlot[], constValue: number) {
    const alreadyIncluded = new Set();
    const axes = this.dp.getAxes();
    const allAxes = this.dp.getAxes(true);
    const activeAxes = new Set(this.dp.getActiveAxes());

    const filters = Object.values(allAxes).map(axis => {
      if (activeAxes.has(axis.element)) {
        return {...axis, range: [constValue, 1]} as IAxis;
      } else {
        return {...axis, range: (val, eps) => val < eps } as any as IAxis;
      }
    });
    const [Aidx, Bidx, Cidx, Didx] = Object.keys(axes);

    let shellData: ISample[] = this.dp.slice(filters);

    const permutations = [
      [Aidx, Bidx, Cidx, Didx],
      [Cidx, Didx, Bidx, Aidx],
      [Bidx, Aidx, Didx, Cidx],
      [Didx, Cidx, Aidx, Bidx],
    ]

    for (let i = 0; i < permutations.length; ++i) {
      let perm = permutations[i];
      const filters: any[] = [
        {element: perm[3], range: [constValue, constValue]}
      ]
      if (i > 0) {
        filters.push(
          {element: perm[1], range: (val, eps) => Math.abs(val - constValue) > eps}
        );
      }
      let slicedSamples: ISample[] = DataProvider.filterSamples(shellData, filters);
      if (this.avoidDuplicates) {
        slicedSamples = slicedSamples.filter(sample => !alreadyIncluded.has(sample._id));
      }
      slicedSamples.forEach(sample => {
        alreadyIncluded.add(sample._id);
      });

      plots[i].dp.setData(slicedSamples, false);
      plots[i].dp.setAxisOrder(perm);
      const newAxes: {[element: string]: IAxis} = {
        [perm[0]]: { ...axes[perm[0]], range: [constValue, 1 - 3 * constValue]},
        [perm[1]]: { ...axes[perm[1]], range: [constValue, 1 - 3 * constValue]},
        [perm[2]]: { ...axes[perm[2]], range: [constValue, 1 - 3 * constValue]},
        [perm[3]]: { ...axes[perm[3]], range: [constValue, constValue]}
      }
      plots[i].dp.setAxes(newAxes);
      plots[i].dp.setActiveAxes([perm[0], perm[1], perm[2]]);
      plots[i].dp.setActiveScalar(this.dp.getActiveScalar());
      plots[i].dataUpdated();
    }
  }

  broadCast(fn: (plot: BasePlot) => void) {
    this.plots.forEach(plot => {
      fn(plot);
    });
  }
}

export { BasePlot, QuaternaryShellPlot };
