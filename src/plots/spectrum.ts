import { Selection, BaseType, select, mouse } from 'd3-selection';
import { extent } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
// import { line, curveLinearClosed } from 'd3-shape';

import { ISample, Vec3 } from '../types';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { getLineColor, rgbToString } from '../utils/colors';

import { zip, isNil, uniqueId } from 'lodash-es';
import { IDataProvider as ISpectrumProvider } from '../data-provider/spectrum';
import { RGBColor } from '@colormap/core';

interface IPlotOptions {
  xKey: string;
  yKey: string;
}

interface IMargins {
  left: number;
  bottom: number;
  top: number;
  right: number;
}

class Spectrum {

  name: string;
  id: string;
  svg: HTMLElement;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  xRange: [number, number];
  yRange: [number, number];
  spectra: {spectrum: ISpectrumProvider; sample: ISample}[] = [];
  dataTooltip: Selection<BaseType, {}, null, undefined>;
  dataGroup: Selection<BaseType, {}, null, undefined>;
  axesGroup: Selection<BaseType, {}, null, undefined>;
  offset: number = 0.1;
  plotOptions: IPlotOptions;
  margins: IMargins;
  showPoints: boolean = false;
  onSelect: Function = () => {};
  textColor: RGBColor = [0, 0 ,0];
  lineColors: RGBColor[];

  constructor(svg: HTMLElement) {
    this.id = uniqueId();
    this.margins = {
      left: 60,
      bottom: 50,
      top: 10,
      right: 10
    }
    this.svg = svg;
    this.dataGroup = select(this.svg)
      .append('g')
      .classed('data', true);

    this.axesGroup = select(this.svg)
      .append('g')
      .classed('axes', true);

    select(this.svg)
      .append('g')
        .append('clipPath')
           .attr('id', `clip${this.id}`)
           .append('rect')
              .attr('width', this.svg.parentElement.clientWidth)
              .attr('height', this.svg.parentElement.clientHeight-this.margins.top - this.margins.bottom)
              .attr('transform', `translate(0, ${this.margins.top})`);

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

  setTextColor(color: RGBColor) {
    this.textColor = color;
    this.render()
  }

  setLineColors(colors: RGBColor[]) {
    this.lineColors = colors;
    this.render()
  }

  setSpectra(spectra: {spectrum: ISpectrumProvider; sample: ISample}[]) {
    this.spectra = spectra;
    if (this.spectra.length > 0) {
      const spectrum = this.spectra[0].spectrum;
      if (isNil(this.plotOptions)) {
        this.plotOptions = {
          xKey: spectrum.getKeys()[0],
          yKey: spectrum.getKeys()[1]
        }
      } else if (!spectrum.hasKey(this.plotOptions.xKey) || !spectrum.hasKey(this.plotOptions.yKey)) {
        this.plotOptions.xKey = null;
        this.plotOptions.yKey = null;
      }
    }
    this.render();
  }

  setAxes(xKey: string, yKey: string) {
    this.plotOptions = {xKey, yKey};
    this.render();
  }

  setOffset(offset: number) {
    this.offset = offset;
    this.render();
  }

  setXRange(xRange: [number, number]) {
    this.xRange = xRange;
    this.render();
  }

  setYRange(yRange: [number, number]) {
    this.yRange = yRange;
    this.render();
  }

  setShowPoints(show: boolean) {
    this.showPoints = show;
    this.render();
  }

  setOnSelect(onSelect: Function) {
    if (!onSelect) {
      onSelect = () => {};
    }
    this.onSelect = onSelect;
  }

  setScales() {
    let calculateXRange = isNil(this.xRange);
    let calculateYRange = isNil(this.yRange);

    let xRange = calculateXRange ? [Infinity, -Infinity] : this.xRange;
    let yRange = calculateYRange ? [Infinity, -Infinity] : this.yRange;

    if (calculateXRange || calculateYRange) {
      for (let i = 0; i < this.spectra.length; ++i) {
        let spectrum = this.spectra[i].spectrum;
        if (!spectrum.hasKey(this.plotOptions.xKey) || !spectrum.hasKey(this.plotOptions.yKey)) {
          continue;
        }

        if (calculateXRange) {
          const xR = extent<number>(spectrum.getArray(this.plotOptions.xKey));

          if (!isNil(xR[0]) && !isNil(xR[1])) {
            xRange[0] = Math.min(xRange[0], xR[0]);
            xRange[1] = Math.max(xRange[1], xR[1]);
          }
        }

        if (calculateYRange) {
          const yR = extent<number>(spectrum.getArray(this.plotOptions.yKey));
          if (!isNil(yR[0]) && !isNil(yR[1])) {
            const yOffset = i * this.offset;
            yRange[0] = Math.min(yRange[0], yR[0] + yOffset);
            yRange[1] = Math.max(yRange[1], yR[1] + yOffset);
          }
        }
      }
    }

    const w = this.svg.parentElement.clientWidth;
    const h = this.svg.parentElement.clientHeight;

    if (xRange[0] == Infinity || xRange[1] == -Infinity) {
      xRange = [0, 1];
    } else if (xRange[0] === xRange[1]) {
      xRange[1] = xRange[0] + 1;
    }
    this.xScale = scaleLinear().domain(xRange).range([this.margins.left, w - this.margins.right]);

    // The spectra are stacked for better visibility, adjust the domain accordingly
    // Add 10% to the range for each additional plot
    // let yDelta = yRange[1] - yRange[0];
    // yDelta *= 1 + 0.1 * (this.spectra.length - 1);
    // yRange[1] = yRange[0] + yDelta;
    if (yRange[0] == Infinity || yRange[1] == -Infinity) {
      yRange = [0, 1];
    } else if (yRange[0] === yRange[1]) {
      yRange[1] = yRange[0] + 1;
    }
    this.yScale = scaleLinear().domain(yRange).range([h - this.margins.bottom, this.margins.top]);
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

    let xLabel: string;
    let yLabel: string;
    if (this.spectra.length > 0) {
      const dp = this.spectra[0].spectrum;
      xLabel = dp.getLabel(this.plotOptions.xKey);
      yLabel = dp.getLabel(this.plotOptions.yKey);
    } else {
      xLabel = this.plotOptions.xKey;
      yLabel = this.plotOptions.yKey;
    }

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

  drawSpectra() {
    let plots = this.dataGroup.selectAll('path')
      .data(this.spectra);

    let lineFn = line()
      .x((d: any) => d ? this.xScale(d[0]) : null)
      .y((d: any) => d ? this.yScale(d[1]) : null);

    let colorGen = getLineColor(this.lineColors);

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

      if (isNil(sample)) {
        return;
      }

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
        if (!d.spectrum.hasKey(this.plotOptions.xKey) || !d.spectrum.hasKey(this.plotOptions.yKey)) {
          return [null, null];
        }
        return zip(d.spectrum.getArray(this.plotOptions.xKey), d.spectrum.getArray(this.plotOptions.yKey).map(val => val + i * this.offset));
      })
      .attr('d', lineFn)
      .attr('fill', 'none')
      .attr('stroke-width', strokeWidth)
      .attr('stroke', () => {
        const [r, g, b] = colorGen.next().value as Vec3;
        return rgbToString(r, g, b, 0.7);
      })
      .on('mouseover', onMouseOver)
      .on('mouseout', onMouseOut);

    // Enter
    plots.enter()
      .append('path')
      .datum((d, i) => {
        if (!d.spectrum.hasKey(this.plotOptions.xKey) || !d.spectrum.hasKey(this.plotOptions.yKey)) {
          return [null, null];
        }
        return zip(d.spectrum.getArray(this.plotOptions.xKey), d.spectrum.getArray(this.plotOptions.yKey).map(val => val + i * this.offset));
      })
      .attr('d', lineFn)
      .attr('fill', 'none')
      .attr('stroke-width', strokeWidth)
      .attr('stroke', () => {
        const [r, g, b] = colorGen.next().value as Vec3;
        return rgbToString(r, g, b, 0.7);
      })
      .attr('clip-path', `url(#clip${this.id})`)
      .on('mouseover', onMouseOver)
      .on('mouseout', onMouseOut);

    // Exit
    plots.exit()
      .remove();

    // Conditionally plot the points on the paths
    this.dataGroup.selectAll('g').remove();

    if (!this.showPoints) {
      return;
    }

    let pointGroups = this.dataGroup.selectAll('g')
      .data(this.spectra);

    colorGen = getLineColor(this.lineColors);

    let points = pointGroups
      .enter()
      .append('g')
      .datum((d, i) => {
        if (!d.spectrum.hasKey(this.plotOptions.xKey) || !d.spectrum.hasKey(this.plotOptions.yKey)) {
          return [null, null];
        }
        return zip(d.spectrum.getArray(this.plotOptions.xKey), d.spectrum.getArray(this.plotOptions.yKey).map(val => val + i * this.offset));
      })
      .attr('fill', () => {
        const [r, g, b] = colorGen.next().value as Vec3;
        return rgbToString(r, g, b, 0.7);
      })
      .selectAll('circle')
      .data( d => d);

    const onClick = (d, i, targets: any) => {
      // d is the datum, i is the index in the data
      d;
      i;
      targets;
      if (this.onSelect) {
        this.onSelect(i, d);
      }
    }

    points.enter().append('circle')
      .attr('r', 4)
      .attr('cx', (d) => this.xScale(d[0]))
      .attr('cy', (d) => this.yScale(d[1]))
      .on('click', onClick);
  }

  render() {
    this.setScales();
    this.drawAxes();
    this.drawSpectra();
  }
}

export { Spectrum };
