import { IDataSet, ISample } from '../types';
import { TernaryPlot } from './ternary';
import { redWhiteBlue } from '../utils/colors';

class QuaternaryPlot {
  svg: HTMLElement;
  selectedScalar: string;
  scalarIdx: number;
  data: IDataSet;
  edgeUnit: number = 350;
  colorMap: [number, number, number][];
  colorMapRange: [number, number];
  shells: TernaryPlot[][] = [];

  constructor(svg: HTMLElement) {
    this.svg = svg;
    this.initShells();
  }

  initShells() {

    // Initialize 3 shells, 4 ternary plots per shell
    const nShells = 3;
    const nPlots = 4;
    this.shells = [];

    let start = 50;
    const spacing = this.data && this.data.spacing ? this.data.spacing[0] : 0.1;

    for (let i = 0; i < nShells; ++i) {
      let constValue = i * spacing;
      let edge = Math.floor(this.edgeUnit * (1 - constValue * 4));
      let plots: TernaryPlot[] = [];
      
      for (let j = 0; j < nPlots; ++j) {
        let plot = new TernaryPlot(`lulzi${i}`, this.svg, j % 2 !== 0);
        let left = start + j * (edge / 2);
        let right = left + edge;
        plot.setSize(left, right);
        plots.push(plot);
      }
      start += 2 * edge + 0.2 * this.edgeUnit;
      this.shells.push(plots);
    }
  }

  setData(data: IDataSet) {
    this.data = data;
    let selectedScalar: string;
    let scalarIdx: number;
    if (!this.selectedScalar) {
      selectedScalar = this.data.scalars[0];
      scalarIdx = 0;
    } else {
      scalarIdx = this.data.scalars.findIndex((val) => val === this.selectedScalar);
      selectedScalar = this.selectedScalar;
      if (scalarIdx === -1) {
        selectedScalar = this.data.scalars[0];
        scalarIdx = 0;
      }
    }
    this.setShellsData();
    this.selectScalar(selectedScalar);
    this.setColorMap(this.colorMap, null);
  }

  selectScalar(key: string) {
    this.selectedScalar = key;
    this.scalarIdx = this.data.scalars.findIndex((val) => val === this.selectedScalar);
    const fn = (plot: TernaryPlot) => {
      plot.selectScalar(this.selectedScalar);
    }
    this.setColorMap(this.colorMap, null);    
    this.broadCast(fn);
  }

  setColorMap(map: [number, number, number][], range: [number, number] = null) {
    if (!map) {
      map = redWhiteBlue;
    }
    if (!range) {
      let arr = this.data.samples.map(val=>val.values[this.scalarIdx]);
      range = [Math.min(...arr), Math.max(...arr)];
    }
    this.colorMapRange = range;
    this.colorMap = map;
    const fn = (plot: TernaryPlot) => {
      plot.setColorMap(this.colorMap, this.colorMapRange);
    }
    this.broadCast(fn);
  }

  setShellsData() {
    if (!this.data) {
      return;
    }

    const spacing = this.data.spacing ? this.data.spacing[0] : 0.1;
    for (let i = 0; i < this.shells.length; ++i) {
      let constValue = i * spacing;
      this._setShellData(this.shells[i], constValue);
    }
  }

  setCallBacks(onSelect: Function, onDeselect: Function) {
    const fn = (plot: TernaryPlot) => {
      plot.onSelect = onSelect;
      plot.onDeselect = onDeselect;
    }
    this.broadCast(fn);
  }

  _setShellData(plots: TernaryPlot[], constValue: number) {
    let shellData: IDataSet;

    const Aidx = 0;
    const Bidx = 1;
    const Cidx = 2;
    const Didx = 3;

    shellData = {
      ...this.data,
      range: this.data.range
        ? [
          [this.data.range[0][0] + constValue, this.data.range[0][1] - 3 * constValue],
          [this.data.range[1][0] + constValue, this.data.range[1][1] - 3 * constValue],
          [this.data.range[2][0] + constValue, this.data.range[2][1] - 3 * constValue]
        ]
        : [
          [0 + constValue, 1 - 3 * constValue],
          [0 + constValue, 1 - 3 * constValue],
          [0 + constValue, 1 - 3 * constValue]
        ],
      samples: this.data.samples
        .filter((val) => val.components[Aidx] >= constValue)
        .filter((val) => val.components[Bidx] >= constValue)
        .filter((val) => val.components[Cidx] >= constValue)
        .filter((val) => val.components[Didx] >= constValue)
    }

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
      plots[i].setData(
        {...shellData, samples: slicedSamples},
        perm.slice(0, 3).map(idx => shellData.elements[idx]),
        shellData.elements[perm[3]]
      );
    }
  }

  // Helper function to broadcast an action to all the the ternary plots composing the
  // quaternary plot
  broadCast(fn: Function) {
    for (let shell of this.shells) {
      for (let plot of shell) {
        fn(plot);
      }
    }
  }
}

export { QuaternaryPlot }
