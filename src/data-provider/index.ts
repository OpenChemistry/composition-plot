import { ISample, IAxis, ISegment, IFom } from '../types';
import { IDataProvider as ISpectrumProvider } from './spectrum';

export class DataProvider {
  samples: ISample[] = [];
  scalars: Set<string> = new Set();
  activeScalar: string;
  activeAxes: string[] = [];
  axisToIdx: {[element: string]: number} = {};
  idxToAxis: {[element: number]: string} = {};

  axes: {
    [element: string]: IAxis;
  } = null;

  dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  setData(samples: ISample[], discardAxes: boolean = true) : void {
    this.samples = [];
    this.axes = {};
    this.scalars = new Set();
    this.axisToIdx = {};
    this.idxToAxis = {};

    if (samples.length === 0) {
      return;
    }

    const compositions: {[element:string]: Set<number>} = {};

    for (let sample of samples) {
      Object.entries(sample.composition).forEach(([element, fraction]) => {
        if (!(element in compositions)) {
          compositions[element] = new Set();
        }
        compositions[element].add(fraction);
      });

      sample.fom.forEach((fom) => {
        const { name } = fom;
        this.scalars.add(name);
      });
    }

    const elements = Object.keys(compositions);
    this.axes = {};
    for (let element of elements) {
      const values: number[] = [];
      compositions[element].forEach(val => {values.push(val)});
      values.sort((a,b) => a < b ? -1 : a > b ? 1 : 0);
      const range: [number, number] = [values[0], values[values.length -1]];

      let spacing = 0;
      if (values.length > 1) {
        // Calculate the spacings between the values
        const spacings = values.reduce((acc, _, i) => {
          if (i != values.length-1) {
            acc.push(values[i+1]-values[i]);
          }
          return acc;
        }, []);

        // Sort them and pick the middle
        spacings.sort((a, b) => a - b);
        spacing = spacings[Math.floor(spacings.length/2)];
      }

      this.axes[element] = {
        element,
        spacing,
        range
      }
    }

    for (let element of elements) {
      const axis = this.axes[element];
      if (discardAxes && axis.range[0] < Number.EPSILON && Math.abs(axis.spacing) < Number.EPSILON) {
        delete this.axes[element];
      }
    }

    let elementNames = Object.keys(this.axes);
    if (elementNames.length < this.dimensions) {
      console.warn(`Samples provided to this ${this.dimensions}-dimensional data provider only span ${elementNames.length} dimensions.`);
    }

    this.activeAxes = elementNames.slice(Math.min(elementNames.length, this.dimensions));

    this.setAxisOrder(Object.keys(this.axes));
    this.samples = samples;
    this.setActiveScalar(this.getDefaultScalar(this.getActiveScalar()));
  }

  getSamples(sampleFilter: (sample: ISample) => boolean | undefined = undefined) : ISample[] {
    const filter = sampleFilter || (() => true);
    return this.samples.filter(filter);
  }

  setAxisOrder(order: string[]) {
    this.axisToIdx = {};
    for (let i = 0; i < order.length; ++i) {
      const key = order[i];
      this.axisToIdx[key] = i;
      this.idxToAxis[i] = key;
    }
  }

  slice(axes: IAxis[]) : ISample[] {
    return DataProvider.filterSamples(this.getSamples(), axes);
  }

  getDefaultScalar(key: string = null) : string {
    if (this.scalars.has(key)) {
      return key;
    } else {
      try {
        return this.scalars.values().next().value;
      } catch(e) {
        return null;
      }
    }
  }

  setActiveAxes(activeAxes: string[]) {
    this.activeAxes = activeAxes;
    this.setAxisOrder(activeAxes);
  }

  getActiveAxes() {
    return this.activeAxes;
  }

  setAxes(axes: {[element: string]: IAxis}) {
    // Ensure the new axes match the elements in the dataset
    for (let key of Object.keys(axes)) {
      if (!(key in this.axes)) {
        console.warn(`Setting axis ${key}, but no samples in the dataset span this dimension`);
      }
      this.axes[key] = axes[key];
    }
  }

  getAxes(force = false) {
    if (force) {
      return this.axes;
    }

    let axes = {};
    for (let element of this.activeAxes) {
      axes[element] = this.axes[element];
    }
    return axes;
  }

  getAxis(val: string | number) {
    let axisKey = null;
    if (typeof val === 'string') {
      if (val in this.axisToIdx) {
        axisKey = val;
      }
    } else {
      if (val in this.idxToAxis) {
        axisKey = this.idxToAxis[val];
      }
    }

    if (axisKey) {
      return this.axes[axisKey];
    } else {
      return null;
    }
  }

  getAxisLabel(val: string | number) : string {
    const axis = this.getAxis(val);
    return axis && axis.element ? axis.element.charAt(0).toUpperCase() + axis.element.slice(1) : 'X';
  }

  getScalarRange(key: string) : [number, number] {
    const values: number[] = this.getSamples().map(sample => DataProvider.getSampleScalar(sample, key));
    return [Math.min(...values), Math.max(...values)];
  }

  getScalars() : string[] {
    const scalars = [];
    this.scalars.forEach((val) => {scalars.push(val)});
    return scalars;
  }

  getActiveScalar(): string {
    return this.activeScalar;
  }

  setActiveScalar(key: string): void {
    if (this.scalars.has(key)) {
      this.activeScalar = key;
    } else {
      console.warn(`Unable to set ${key} as active scalar`);
    }
  }

  static getSampleFom(sample: ISample, scalar: string, runId?: string, analysisId?: string) : IFom | null {
    const matchRunId = !!runId;
    const matchAnalysisId = !!analysisId;

    for (let fom of sample.fom) {
      const isMatch = (fom.name === scalar
                     && (runId == fom.runId || !matchRunId)
                     && (analysisId == fom.analysisId || !matchAnalysisId));
      if (isMatch) {
        return fom;
      }
    }

    return null;
  }

  static getSampleScalar(sample: ISample, scalar: string, runId?: string, analysisId?: string) : number | null {
    const fom = DataProvider.getSampleFom(sample, scalar, runId, analysisId);
    return fom ? fom.value : null;
  }

  static getSampleElementFraction(sample: ISample, element: string) : number {
    if (element in sample.composition) {
      return sample.composition[element];
    }
    return 0;
  }

  static filterSamples(samples: ISample[], axes: any[]) : ISample[] {
    let filteredSamples = [...samples];
    for (let axis of axes) {
      if (typeof axis.range === 'function') {
        filteredSamples = filteredSamples.filter(sample => {
          return axis.range(DataProvider.getSampleElementFraction(sample, axis.element), Number.EPSILON);
        });
      } else {
        filteredSamples = filteredSamples.filter(sample => {
          const fraction = DataProvider.getSampleElementFraction(sample, axis.element);
          return (axis.range[0] - Number.EPSILON < fraction && fraction < axis.range[1] + Number.EPSILON);
        });
      }
    }
    return filteredSamples;
  }

  static isSelected(sample: ISample, selectedKeys: Set<string>) : boolean {
    return selectedKeys.has(sample._id);
  }
}

interface ISampleSpectrum {
  sample: ISample;
  spectrum: ISpectrumProvider;
}
export class HeatMapDataProvider {
  data: ISampleSpectrum[] = [];
  axes: [string, string];
  scalars: Set<string> = new Set();
  activeScalars: [string, string];
  numY: number = 10;
  separateSlope: boolean = false;
  indexMaps: number[][][];
  segments: ISegment[] = [];
  selection: string = '';
  reduceFn: (numbers: number[]) => number;
  X: string[];
  Y: string[];
  Z: number[][];

  constructor() {
    this.setReduceFn();
  }

  setData(data: ISampleSpectrum[] = []) {
    this.data = data;
    this.scalars = new Set();
    for (let d of data) {
      for (let key of d.spectrum.getKeys()) {
        this.scalars.add(key);
      }
    }
  }

  setActiveScalars(keys: [string, string]): void {
    this.activeScalars = [null, null];
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (this.scalars.has(key)) {
        this.activeScalars[i] = key;
      } else {
        console.warn(`Unable to set ${key} as active scalar`);
      }
    }
  }

  getActiveScalars() : [string, string] {
    return this.activeScalars;
  }

  setNumY(n: number = 10) {
    this.numY = n;
  }

  setSeparateSlope(flag: boolean) {
    this.separateSlope = flag;
  }

  computeMaps() {
    // Values in the Y axis can be repeated
    let minY = Infinity;
    let maxY = -Infinity;
    for (let d of this.data) {
      if (!d.spectrum.hasKey(this.getActiveScalars()[0])) {
        continue;
      }
      minY = Math.min(minY, ...d.spectrum.getArray(this.getActiveScalars()[0]));
      maxY = Math.max(maxY, ...d.spectrum.getArray(this.getActiveScalars()[0]));
    }
    const slopeFactor = this.separateSlope ? 2 : 1;
    const spacing = (maxY - minY) / this.numY;
    if (this.separateSlope) {
      this.findSegments();
    }
    this.Y = [];
    for (let i = 0; i < this.numY; ++i) {
      if (this.separateSlope) {
        this.Y.push(`${(minY + i * spacing).toFixed(2)} (+)`);
      } else {
        this.Y.push(`${(minY + i * spacing).toFixed(2)}`);
      }
    }
    if (this.separateSlope) {
      for (let i = 0; i < this.numY; ++i) {
        this.Y.push(`${(maxY - (i + 1) * spacing).toFixed(2)} (-)`);
      }
    }

    this.indexMaps = [];
    for (let i = 0; i < this.data.length; ++i) {
      if (!this.data[i].spectrum.hasKey(this.getActiveScalars()[0])) {
        this.indexMaps.push([]);
        continue;
      }
      const yData = this.data[i].spectrum.getArray(this.getActiveScalars()[0]);
      const map = [];
      for (let j = 0; j < this.numY * slopeFactor; ++j) {
        map.push([]);
      }
      for (let j = 0; j < yData.length; ++j) {
        // Only include the Y values in the selected segments
        if (this.inSelectedSegment(j)) {
          let idx = Math.min(Math.round( (yData[j] - minY) / spacing ), this.numY -1);
          if (this.separateSlope && j > 0) {
            const slope = yData[j] >= yData[j-1] ? 1 : -1;
            if (slope === -1) {
              idx = 2 * this.numY - idx - 1;
            }
          }
          map[idx].push(j);
        }
      }
      this.indexMaps.push(map);
    }

    // Take the median of the Z values occurring at a specific Y value
    this.Z = [];
    for (let i = 0; i < this.indexMaps.length; ++i) {
      const map = this.indexMaps[i];
      const vals = [];
      for (let j = 0; j < map.length; ++j) {
        const y = map[j];
        let v = [];
        for (let k = 0; k < y.length; ++k) {
          const idx = y[k];
          v.push(this.data[i].spectrum.getArray(this.getActiveScalars()[1])[idx]);
        }
        vals.push(this.reduceFn(v));
      }
      this.Z.push(vals);
    }

    //
    this.X = [];
    for (let d of this.data) {
      this.X.push(Object.entries(d.sample.composition).map(([key, val]) => `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${val.toFixed(1)}`).join(', '));
    }
  }

  getSegments() {
    return this.segments;
  }

  selectSegments(selection: string) {
    this.selection = selection;
  }

  setReduceFn(name: 'min' | 'max' | 'mean' | 'median' = 'median') {
    const reduceFunctions = {
      'min': function(values: number[]) : number {
        return Math.min(...values);
      },
      'max': function(values: number[]) : number {
        return Math.max(...values);
      },
      'mean': function(values: number[]) : number {
        let sum = 0;
        for (let v of values) {
          sum += v;
        }
        return sum / values.length;
      },
      'median': function(values: number[]) : number {
        values = values.sort((a, b) => a < b ? -1 : 1);
        return values[Math.floor(values.length / 2)];
      },
    }
    this.reduceFn = reduceFunctions[name];
  }

  private findSegments() {
    this.segments = [];
    if (this.data.length == 0) {
      return;
    }
    if (!this.data[0].spectrum.hasKey(this.getActiveScalars()[0])) {
      return;
    }
    const Y = this.data[0].spectrum.getArray(this.getActiveScalars()[0]);
    let currSlope: boolean = null;

    for (let i = 1; i < Y.length; ++i) {
      const slope = Y[i] - Y[i - 1] >= 0;
      if (slope !== currSlope) {
        this.segments.push({start: i, stop: i, selected: false});
      } else {
        let currSegment = this.segments.pop();
        currSegment = {...currSegment, stop: i};
        this.segments.push(currSegment);
      }
      currSlope = slope;
    }
    this.setActiveSegments(this.selection);
  }

  private setActiveSegments(selection: string) {
    const s: string[] = selection.split(',');

    const init = selection.trim() == '';
    for (let i = 0; i < this.segments.length; ++i) {
      this.segments[i].selected = init;
    }

    for (let seg of s) {
      const range = seg.split('-');
      let start = parseInt(range[0]);
      let stop = start;
      if (range.length > 1) {
        stop = parseInt(range[1]);
      }
      if (!isFinite(start) || !isFinite(stop)) {
        continue;
      }
      if (stop < start) {
        continue;
      }
      for (let idx = start; idx <= stop; ++idx) {
        if (idx < this.segments.length) {
          this.segments[idx].selected = true;
        }
      }
    }
  }

  private inSelectedSegment(idx: number) {
    if (!this.separateSlope || this.segments.length === 0) {
      return true;
    }
    // Will write the function in ln(n) complexity one day...
    for (let segment of this.segments) {
      if (idx >= segment.start && idx < segment.stop && segment.selected) {
        return true;
      }
    }
    return false;
  }
}
