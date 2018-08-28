import { Selection, BaseType, select, mouse } from 'd3-selection';
import { extent } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
// import { line, curveLinearClosed } from 'd3-shape';

import { Ingredient } from '../types';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { getLineColor } from '../utils/colors';

class Spectrum {

  name: string;
  svg: HTMLElement;
  ingredients: [Ingredient, Ingredient, Ingredient, Ingredient];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  spectra: any[] = [];
  dataTooltip: Selection<BaseType, {}, null, undefined>;
  dataGroup: Selection<BaseType, {}, null, undefined>;
  axesGroup: Selection<BaseType, {}, null, undefined>;
  offset: number = 0.1;

  constructor(svg: HTMLElement) {
    this.svg = svg;
    this.dataGroup = select(this.svg)
      .append('g')
      .classed('data', true);
    
    this.axesGroup = select(this.svg)
      .append('g')
      .classed('axes', true);

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
  }

  setIngredients(A: Ingredient, B: Ingredient, C: Ingredient, D: Ingredient) {
    this.ingredients = [A, B, C, D];
  }

  appendSpectrum(points: any[], meta: any) {
    this.spectra.push({points, meta});
    this.setScales();
    this.drawAxes();
    this.drawSpectra();
  }

  removeSpectrum(meta: any) {
    meta;
    this.spectra = this.spectra.filter((val) => val.meta !== meta);
    this.setScales();
    this.drawAxes();
    this.drawSpectra();
  }

  setOffset(offset: number) {
    this.offset = offset;
  }

  setScales() {
    let xRange = [Infinity, -Infinity];
    let yRange = [Infinity, -Infinity];
    for (let i = 0; i < this.spectra.length; ++i) {
      let spectrum = this.spectra[i];
      let yOffset = i * this.offset;
      let xR = extent(spectrum.points, (d: any) => d.x);
      let yR = extent(spectrum.points, (d: any) => d.y);
      xRange[0] = Math.min(xRange[0], parseFloat(xR[0]));
      xRange[1] = Math.max(xRange[1], parseFloat(xR[1]));
      yRange[0] = Math.min(yRange[0], parseFloat(yR[0]) + yOffset);
      yRange[1] = Math.max(yRange[1], parseFloat(yR[1]) + yOffset);
    }
    const w = this.svg.parentElement.clientWidth;
    const h = this.svg.parentElement.clientHeight;
    const margin = 25;
    this.xScale = scaleLinear().domain(xRange).range([margin, w - margin]);

    // The spectra are stacked for better visibility, adjust the domain accordingly
    // Add 10% to the range for each additional plot
    // let yDelta = yRange[1] - yRange[0];
    // yDelta *= 1 + 0.1 * (this.spectra.length - 1);
    // yRange[1] = yRange[0] + yDelta;
    this.yScale = scaleLinear().domain(yRange).range([h - margin, margin]);
  }

  drawAxes() {
    this.axesGroup.selectAll('g').remove();

    if (this.spectra.length < 1) {
      return;
    }

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
  }

  drawSpectra() {
    let plots = this.dataGroup.selectAll('path')
      .data(this.spectra);

    let lineFn = line()
      .x((d: any) => this.xScale(d.x))
      .y((d: any) => this.yScale(d.y));

    let colorGen = getLineColor();

    const strokeWidth = 2.5;
    const boldStrokeWidth = 4;

    const onMouseOver = (d, i, targets: any) => {
      // d is the datum, i is the index in the data
      d;
      select(targets[i])
        // .transition()
        .attr('stroke-width', boldStrokeWidth);
      let [x, y] = mouse(targets[i]);
      y += this.svg.getBoundingClientRect().top;
      const meta = this.spectra[i].meta;
      let innerHtml = '';
      for (let [key, val] of Object.entries(meta)) {
        if (key !== 'values') {
          innerHtml += `${key}: ${val} <br>`
        }
      }
      this.dataTooltip.html(innerHtml);
      this.dataTooltip
        .style('opacity', 0.9)
        .style('left', `${x}px`)
        .style('top', `${y}px`)
        .style('transform', 'translateY(-100%)');
    };

    const onMouseOut = (d, i, targets: any) => {
      // d is the datum, i is the index in the data
      d;
      i;
      select(targets[i])
        // .transition()
        .attr('stroke-width', strokeWidth);
      this.dataTooltip
          .style('opacity', 0);
    }

    // Update
    plots
      .datum((d, i) => {
        return d.points.map((val) => ({x: val.x, y: val.y + i * this.offset }));
      })
      .attr('d', lineFn)
      .attr('fill', 'transparent')
      .attr('stroke-width', strokeWidth)
      .attr('stroke', () => {
        let color = colorGen.next().value;
        return `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, 0.7)`
      })
      .on('mouseover', onMouseOver)
      .on('mouseout', onMouseOut);

    // Enter
    plots.enter()
      .append('path')
      .datum((d, i) => {
        return d.points.map((val) => ({x: val.x, y: val.y + i * this.offset }));
      })
      .attr('d', lineFn)
      .attr('fill', 'transparent')
      .attr('stroke-width', strokeWidth)
      .attr('stroke', () => {
        let color = colorGen.next().value;
        return `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, 0.7)`
      })
      .on('mouseover', onMouseOver)
      .on('mouseout', onMouseOut);

    // Exit
    plots.exit()
      .remove();
  }

}

export { Spectrum };
