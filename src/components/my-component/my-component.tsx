import { Component, Element } from '@stencil/core';

import { TernaryPlot } from '../../plots/ternary';

import { Ingredient } from '../../types';

import { viridis } from '../../utils/colors';

// import sampleData from '../../sample-data/FeMnNiZn.json';
import { generateRandom } from '../../sample-data/random';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true
})
export class MyComponent {

  @Element() el: HTMLElement;

  fullData: any[];

  plotsContainer: HTMLElement;
  svgElements: HTMLElement[] = [null, null, null, null, null];

  ingredients: Ingredient[];

  componentWillLoad() {
    // lets make some fake data
    // generate some random data
    const m = 11;
    const extent: [number, number] = [0, 1];
    const spacing = (extent[1] - extent[0]) / (m -1);

    let A: Ingredient = {
      key: 'Zn',
      label: 'A',
      extent: extent,
      spacing: spacing
    };
    let B: Ingredient = {
      key: 'Fe',
      label: 'B',
      extent: extent,
      spacing: spacing
    };
    let C: Ingredient = {
      key: 'Mn',
      label: 'C',
      extent: extent,
      spacing: spacing
    };
    let D: Ingredient = {
      key: 'Ni',
      label: 'D',
      extent: extent,
      spacing: spacing
    }

    this.ingredients = [A, B, C, D];
    this.fullData = generateRandom(
      [A.label, B.label, C.label, D.label],
      ['Jmin.mAcm2'],
      extent,
      spacing
    )
    // this.fullData = sampleData;

  }

  componentDidLoad() {
    for (let i = 0; i < 3; ++i) {
      this.plotShell(this.svgElements[i], i);
    }
  }

  plotShell(svg: HTMLElement, i: number) {
    const n = 4;
    const spacing = this.ingredients[0].spacing;
    const constValue = i * spacing;
    let plots: TernaryPlot[] = [];
    const edge = Math.floor(350 * (1 - constValue));
    for (let i = 0; i < n; ++i) {
      let plot = new TernaryPlot(`lulzi${i}`, svg, i % 2 !== 0);
      let left = i * (edge / 2) + 50;
      let right = left + edge;
      plot.setSize(left, right);
      plots.push(plot);
    }

    let slicedData: any[];
    let A = {...this.ingredients[0]};
    let B = {...this.ingredients[1]};
    let C = {...this.ingredients[2]};
    let D = {...this.ingredients[3]};
    A.extent = [A.extent[0], A.extent[1] - constValue];
    B.extent = [B.extent[0], B.extent[1] - constValue];
    C.extent = [C.extent[0], C.extent[1] - constValue];
    D.extent = [D.extent[0], D.extent[1] - constValue];

    let mapRange: [number, number] = [0, 1];
    // let mapRange: [number, number] = [-40, 0];
    let eps = 1e-6;

    slicedData = this.fullData
      .filter((val) => Math.abs(val[D.key] - constValue) < eps);
    plots[0].setColorMap(viridis, mapRange);
    plots[0].setAxes(A, B, C, D);
    plots[0].setData(slicedData);

    slicedData = this.fullData
      .filter((val) => val[A.key] === constValue)
      .filter((val) => val[D.key] !== 0);
    plots[1].setColorMap(viridis, mapRange);
    plots[1].setAxes(C, D, B, A);
    plots[1].setData(slicedData);

    slicedData = this.fullData
      .filter((val) => val[C.key] === constValue)
      .filter((val) => val[A.key] !== 0);
    plots[2].setColorMap(viridis, mapRange);
    plots[2].setAxes(B, A, D, C);
    plots[2].setData(slicedData);

    slicedData = this.fullData
      .filter((val) => val[B.key] === constValue)
      .filter((val) => val[C.key] !== 0);
    plots[3].setColorMap(viridis, mapRange);
    plots[3].setAxes(D, C, A, B);
    plots[3].setData(slicedData);

    slicedData;
  }

  render() {
    return (
      <div class="fill" ref={(ref) => {this.plotsContainer = ref;}}>
        <div class="half-fill-v">
          <svg class="fill" ref={(ref) => {this.svgElements[0] = ref;}}></svg>
        </div>
        <div class="half-fill-v">
          <svg class="fill" ref={(ref) => {this.svgElements[1] = ref;}}></svg>
        </div>
        <div class="half-fill-v">
          <svg class="fill" ref={(ref) => {this.svgElements[2] = ref;}}></svg>
        </div>
        {/* <div class="half-fill-v">
          <svg class="fill" ref={(ref) => {this.svgElements[3] = ref;}}></svg>
        </div>
        <div class="half-fill-v">
          <svg class="fill" ref={(ref) => {this.svgElements[4] = ref;}}></svg>
        </div> */}
      </div>
    );
  }
}
