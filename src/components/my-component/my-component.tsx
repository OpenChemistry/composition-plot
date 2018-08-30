import { Component, Element } from '@stencil/core';

import { TernaryPlot } from '../../plots/ternary';
import { Spectrum } from '../../plots/spectrum';

import { IDataSet, ISample, ISpectrum } from '../../types';

import { viridis } from '../../utils/colors';

import { fetchSpectrum } from '../../rest';

import sampleData from '../../assets/experiment.json';
// import { generateRandom } from '../../sample-data/random';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true
})
export class MyComponent {

  @Element() el: HTMLElement;

  fullData: IDataSet;

  plotsContainer: HTMLElement;
  compositionElement: HTMLElement;
  spectrumElement: HTMLElement;

  spectrum: Spectrum;

  componentWillLoad() {
    // lets make some fake data
    // generate some random data
    this.fullData = sampleData;
  }

  componentDidLoad() {
    const spacing = this.fullData.spacing ? this.fullData.spacing[0] : 0.1;
    let start = 50;
    const edgeUnit = 350;
    for (let i = 0; i < 3; ++i) {
      let constValue = i * spacing;
      let edge = Math.floor(edgeUnit * (1 - constValue * 4));
      this.plotShell(this.compositionElement, constValue, edge, start);
      start += 2 * edge + 0.2 * edgeUnit;
    }

    this.spectrum = new Spectrum(this.spectrumElement);
    this.spectrum.setOffset(0);
  }

  onSelect = (d) => {
    fetchSpectrum(d.id)
      .then((val: any) => {
        let spectrum: ISpectrum = {};
        for (let key in val) {
          spectrum[key] = val[key].map((n) => parseFloat(n)).slice(50);
        }
        let metaData = {
          elements: this.fullData.elements,
          components: d.components,
          id: d.id
        }
        this.spectrum.setAxes('t(s)', 'J(mAcm2)');
        // this.spectrum.setAxes('t(s)', 'Ewe(Vrhe)');
        // this.spectrum.setAxes('J(mAcm2)', 'Ewe(Vrhe)');
        // this.spectrum.setAxes('Ewe(Vrhe)', 'J(mAcm2)');
        // this.spectrum.setAxes('J(mAcm2)', 'J(mAcm2)');
        this.spectrum.appendSpectrum(spectrum, metaData);
      })
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

    let shellData: IDataSet;

    const Aidx = 0;
    const Bidx = 1;
    const Cidx = 2;
    const Didx = 3;
    const scalarKey = 'Jmax.mAcm2';

    shellData = {
      ...this.fullData,
      range: this.fullData.range
        ? [
          [this.fullData.range[0][0] + constValue, this.fullData.range[0][1] - 3 * constValue],
          [this.fullData.range[1][0] + constValue, this.fullData.range[1][1] - 3 * constValue],
          [this.fullData.range[2][0] + constValue, this.fullData.range[2][1] - 3 * constValue]
        ]
        : [
          [0 + constValue, 1 - 3 * constValue],
          [0 + constValue, 1 - 3 * constValue],
          [0 + constValue, 1 - 3 * constValue]
        ],
      samples: this.fullData.samples
        .filter((val) => val.components[Aidx] >= constValue)
        .filter((val) => val.components[Bidx] >= constValue)
        .filter((val) => val.components[Cidx] >= constValue)
        .filter((val) => val.components[Didx] >= constValue)
    }

    // let mapRange: [number, number] = [0, 1];
    let mapRange: [number, number] = [-40, 0];
    let eps = 1e-6;

    const permutations = [
      [Aidx, Bidx, Cidx, Didx],
      [Cidx, Didx, Bidx, Aidx],
      [Bidx, Aidx, Didx, Cidx],
      [Didx, Cidx, Aidx, Bidx],
    ]

    for (let i = 0; i < permutations.length; ++i) {
      let perm = permutations[i];
      let slicedSamples: ISample[] = shellData.samples
        .filter((val) => Math.abs(val.components[perm[3]] - constValue) < eps);
      if (i > 0) {
        // Don't include twice the points along shared lines
        slicedSamples = slicedSamples
          .filter((val) => Math.abs(val.components[perm[1]] - constValue) > eps);
      }
      plots[i].setColorMap(viridis, mapRange);
      plots[i].setData(
        {...shellData, samples: slicedSamples},
        scalarKey,
        perm.slice(0, 3).map(idx => shellData.elements[idx]),
        shellData.elements[perm[3]]
      );
    }
  }

  render() {
    return (
      <div class="fill" ref={(ref) => {this.plotsContainer = ref;}}>
        <div class="fill-half-v">
          <svg class="fill" draggable={false} ref={(ref) => {this.compositionElement = ref;}}></svg>
        </div>
        <div class="fill-half-v">
          <svg class="fill" ref={(ref) => {this.spectrumElement = ref;}}></svg>
        </div>
      </div>
    );
  }
}
