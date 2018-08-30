import { Component, Element } from '@stencil/core';

import { QuaternaryPlot } from '../../plots/quaternary';
import { Spectrum } from '../../plots/spectrum';

import { IDataSet, ISpectrum } from '../../types';

import { plasma } from '../../utils/colors';

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
    let quatPlot = new QuaternaryPlot(this.compositionElement);
    quatPlot.setCallBacks(this.onSelect, this.onDeselect);
    quatPlot.setData(this.fullData);
    // quatPlot.setColorMap(viridis);
    quatPlot.selectScalar('Jmin.mAcm2');
    setTimeout(()=>{quatPlot.setColorMap(plasma)}, 4000)
    setTimeout(()=>{quatPlot.setData(this.fullData);}, 8000)

    // setTimeout(()=>{quatPlot.selectScalar('Jmax.mAcm2');}, 4000)
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
