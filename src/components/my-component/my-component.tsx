import { Component, Element } from '@stencil/core';

import { TernaryPlot } from '../../plots/ternary';
import { Spectrum } from '../../plots/spectrum';

import { Ingredient } from '../../types';

import { viridis } from '../../utils/colors';

import sampleData from '../../sample-data/FeMnNiZn.json';
// import { generateRandom } from '../../sample-data/random';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true
})
export class MyComponent {

  @Element() el: HTMLElement;

  fullData: any[];

  plotsContainer: HTMLElement;
  compositionElement: HTMLElement;
  spectrumElement: HTMLElement;

  ingredients: Ingredient[];
  spectrum: Spectrum;

  componentWillLoad() {
    // lets make some fake data
    // generate some random data
    const m = 11;
    const extent: [number, number] = [0, 1];
    const spacing = (extent[1] - extent[0]) / (m -1);

    let A: Ingredient = {
      key: 'Zn',
      label: 'Zn',
      extent: extent,
      spacing: spacing
    };
    let B: Ingredient = {
      key: 'Fe',
      label: 'Fe',
      extent: extent,
      spacing: spacing
    };
    let C: Ingredient = {
      key: 'Mn',
      label: 'Mn',
      extent: extent,
      spacing: spacing
    };
    let D: Ingredient = {
      key: 'Ni',
      label: 'Ni',
      extent: extent,
      spacing: spacing
    }

    this.ingredients = [A, B, C, D];
    // this.fullData = generateRandom(
    //   [A.key, B.key, C.key, D.key],
    //   ['Jmin.mAcm2'],
    //   extent,
    //   spacing
    // )
    this.fullData = sampleData;

  }

  componentDidLoad() {
    const spacing = this.ingredients[0].spacing;
    let start = 50;
    const edgeUnit = 350;
    for (let i = 0; i < 3; ++i) {
      let constValue = i * spacing;
      let edge = Math.floor(edgeUnit * (1 - constValue * 4));
      this.plotShell(this.compositionElement, constValue, edge, start);
      start += 2 * edge + 0.2 * edgeUnit;
    }

    this.spectrum = new Spectrum(this.spectrumElement);
    this.spectrum.setOffset(0.2);
  }

  onSelect = (d) => {
    const n = 1000;
    const center = n / 2 + Math.random() * n / 100;
    const sigma = (1 + Math.random()) * 20;
    let points = [];
    for (let i = 0; i < n; ++i) {
      let x = i;
      let y = Math.exp(-(((x - center) / sigma)**2));
      points.push({x, y})
    }

    this.spectrum.appendSpectrum(points, d);
  }

  onDeselect = (d) => {
    this.spectrum.removeSpectrum(d);
  }

  plotShell(svg: HTMLElement, constValue: number, edge: number, shift: number) {
    const n = 4;
    let plots: TernaryPlot[] = [];
    for (let i = 0; i < n; ++i) {
      let plot = new TernaryPlot(`lulzi${i}`, svg, i % 2 !== 0);
      let left = shift + i * (edge / 2);
      let right = left + edge;
      plot.setSize(left, right);
      plot.onSelect = this.onSelect;
      plot.onDeselect = this.onDeselect;
      plots.push(plot);
    }

    let shellData: any[];
    let slicedData: any[];
    let A = {...this.ingredients[0]};
    let B = {...this.ingredients[1]};
    let C = {...this.ingredients[2]};
    let D = {...this.ingredients[3]};
    A.extent = [A.extent[0] + constValue, A.extent[1] - 3 * constValue];
    B.extent = [B.extent[0] + constValue, B.extent[1] - 3 * constValue];
    C.extent = [C.extent[0] + constValue, C.extent[1] - 3 * constValue];
    D.extent = [D.extent[0] + constValue, D.extent[1] - 3 * constValue];

    // let mapRange: [number, number] = [0, 1];
    let mapRange: [number, number] = [-40, 0];
    let eps = 1e-6;

    shellData = this.fullData
      .filter((val) => val[A.key] >= constValue)
      .filter((val) => val[B.key] >= constValue)
      .filter((val) => val[C.key] >= constValue)
      .filter((val) => val[D.key] >= constValue);

    slicedData = shellData
      .filter((val) => Math.abs(val[D.key] - constValue) < eps);
    plots[0].setColorMap(viridis, mapRange);
    plots[0].setAxes(A, B, C, D);
    plots[0].setData(slicedData);

    slicedData = shellData
      .filter((val) => Math.abs(val[A.key] - constValue) < eps)
      .filter((val) => Math.abs(val[D.key] - constValue) > eps);
    plots[1].setColorMap(viridis, mapRange);
    plots[1].setAxes(C, D, B, A);
    plots[1].setData(slicedData);

    slicedData = shellData
      .filter((val) => Math.abs(val[C.key] - constValue) < eps)
      .filter((val) => Math.abs(val[A.key] - constValue) > eps);
    plots[2].setColorMap(viridis, mapRange);
    plots[2].setAxes(B, A, D, C);
    plots[2].setData(slicedData);

    slicedData = shellData
      .filter((val) => Math.abs(val[B.key] - constValue) < eps)
      .filter((val) => Math.abs(val[C.key] - constValue) > eps);
    plots[3].setColorMap(viridis, mapRange);
    plots[3].setAxes(D, C, A, B);
    plots[3].setData(slicedData);

    slicedData;
  }

  render() {
    return (
      <div class="fill" ref={(ref) => {this.plotsContainer = ref;}}>
        <div class="fill-half-v">
          <svg class="fill" ref={(ref) => {this.compositionElement = ref;}}></svg>
        </div>
        <div class="fill-half-v">
          <svg class="fill" ref={(ref) => {this.spectrumElement = ref;}}></svg>
        </div>
      </div>
    );
  }
}
