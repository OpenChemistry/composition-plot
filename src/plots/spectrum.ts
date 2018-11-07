import { Selection, BaseType, select, mouse } from 'd3-selection';
import { extent } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
// import { line, curveLinearClosed } from 'd3-shape';

import { ISpectrum, ISample } from '../types';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { getLineColor } from '../utils/colors';

import { has, zip, isNil } from 'lodash-es';

interface IPlotOptions {
  xKey: string;
  yKey: string;
}

class Spectrum {

  name: string;
  svg: HTMLElement;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  spectra: {spectrum: ISpectrum; sample: ISample}[] = [];
  dataTooltip: Selection<BaseType, {}, null, undefined>;
  dataGroup: Selection<BaseType, {}, null, undefined>;
  axesGroup: Selection<BaseType, {}, null, undefined>;
  offset: number = 0.1;
  plotOptions: IPlotOptions;

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

  setSpectra(spectra: {spectrum: ISpectrum; sample: ISample}[]) {
    this.spectra = spectra;
    if (this.spectra.length > 0) {
      const spectrum = this.spectra[0].spectrum;
      if (isNil(this.plotOptions)) {
        this.plotOptions = {
          xKey: Object.keys(spectrum)[0],
          yKey: Object.keys(spectrum)[1]
        }
      } else if (!has(spectrum, this.plotOptions.xKey) || !has(spectrum, this.plotOptions.yKey)) {
        this.plotOptions.xKey = null;
        this.plotOptions.yKey = null;
      }
    }
    this.setScales();
    this.drawAxes();
    this.drawSpectra();
  }

  setAxes(xKey: string, yKey: string) {
    this.plotOptions = {xKey, yKey};
    this.setScales();
    this.drawAxes();
    this.drawSpectra();
  }

  setOffset(offset: number) {
    this.offset = offset;
    this.setScales();
    this.drawAxes();
    this.drawSpectra();
  }

  setScales() {
    let xRange = [Infinity, -Infinity];
    let yRange = [Infinity, -Infinity];
    for (let i = 0; i < this.spectra.length; ++i) {
      let spectrum = this.spectra[i].spectrum;
      let yOffset = i * this.offset;
      let xR = extent<number>(spectrum[this.plotOptions.xKey]);
      let yR = extent<number>(spectrum[this.plotOptions.yKey]);
      xRange[0] = Math.min(xRange[0], xR[0]);
      xRange[1] = Math.max(xRange[1], xR[1]);
      yRange[0] = Math.min(yRange[0], yR[0] + yOffset);
      yRange[1] = Math.max(yRange[1], yR[1] + yOffset);
    }
    const w = this.svg.parentElement.clientWidth;
    const h = this.svg.parentElement.clientHeight;
    const margin = {
      left: 60,
      bottom: 50,
      top: 10,
      right: 10
    }
    this.xScale = scaleLinear().domain(xRange).range([margin.left, w - margin.right]);

    // The spectra are stacked for better visibility, adjust the domain accordingly
    // Add 10% to the range for each additional plot
    // let yDelta = yRange[1] - yRange[0];
    // yDelta *= 1 + 0.1 * (this.spectra.length - 1);
    // yRange[1] = yRange[0] + yDelta;
    this.yScale = scaleLinear().domain(yRange).range([h - margin.bottom, margin.top]);
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

    // Add axis labels

    let xLow = this.xScale(this.xScale.domain()[0]);
    let xMid = this.xScale(this.xScale.domain()[0] + (this.xScale.domain()[1] - this.xScale.domain()[0]) /2 );
    let yLow = this.yScale(this.yScale.domain()[0]);
    let yMid = this.yScale(this.yScale.domain()[0] + (this.yScale.domain()[1] - this.yScale.domain()[0]) /2 );

    this.axesGroup
      .append('g')
      .attr("transform", `translate(${xMid}, ${yLow + 40})`)
      .append("text")
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .text(this.plotOptions.xKey);

    this.axesGroup
      .append('g')
      .attr("transform", `translate(${xLow - 40}, ${yMid})`)
      .append("text")
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('font-family', 'sans-serif')
        .text(this.plotOptions.yKey);

  }

  drawSpectra() {
    let plots = this.dataGroup.selectAll('path')
      .data(this.spectra);

    let lineFn = line()
      .x((d: any) => this.xScale(d[0]))
      .y((d: any) => this.yScale(d[1]));

    let colorGen = getLineColor();

    const strokeWidth = 1.5;
    const boldStrokeWidth = 3;

    const onMouseOver = (d, i, targets: any) => {
      // d is the datum, i is the index in the data
      d;
      select(targets[i])
        // .transition()
        .attr('stroke-width', boldStrokeWidth);
      let [x, y] = mouse(targets[i]);
      x += this.svg.getBoundingClientRect().left;
      // y += this.svg.getBoundingClientRect().top;
      const sample = this.spectra[i].sample;
      let innerHtml = '';
      for (let [key, val] of Object.entries(sample.composition)) {
        innerHtml += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val.toFixed(2)} <br>`
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
        return zip(d.spectrum[this.plotOptions.xKey], d.spectrum[this.plotOptions.yKey].map(val => val + i * this.offset));
      })
      .attr('d', lineFn)
      .attr('fill', 'none')
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
        return zip(d.spectrum[this.plotOptions.xKey], d.spectrum[this.plotOptions.yKey].map(val => val + i * this.offset));
      })
      .attr('d', lineFn)
      .attr('fill', 'none')
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
