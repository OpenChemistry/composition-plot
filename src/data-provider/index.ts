import { ISample, IAxis } from '../types';

const eps = 1e-6;

export class DataProvider {
  samples: ISample[] = [];
  scalars: Set<string> = new Set();
  activeScalar: string;
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
      const elements = Object.keys(sample.composition);
      for (let element of elements) {
        if (!(element in compositions)) {
          compositions[element] = new Set();
        }
        compositions[element].add(sample.composition[element]);
      }
      for (let key of Object.keys(sample.scalars)) {
        this.scalars.add(key);
      }
    }

    const elements = Object.keys(compositions);
    this.axes = {};
    for (let element of elements) {
      const values: number[] = [];
      compositions[element].forEach(val => {values.push(val)});
      values.sort((a,b) => a < b ? -1 : a > b ? 1 : 0);
      const range: [number, number] = [values[0], values[values.length -1]];
      const spacing: number = values.length > 1 ? values[1] - values[0] : 0;
      this.axes[element] = {
        element,
        spacing,
        range
      }
    }

    for (let element of elements) {
      const axis = this.axes[element];
      if (discardAxes && Math.abs(axis.spacing) < eps) {
        delete this.axes[element];
      }
    }

    if (Object.keys(this.axes).length !== this.dimensions) {
      console.warn(`A quaternary data provider can only span a ${this.dimensions}-dimensional space, but ${elements.length} different elements are found in the dataset`);
      // throw new Error(`A quaternary data provider can only span a ${this.dimensions}-dimensional space, but ${elements.length} different elements are found in the dataset`);
    }
    
    this.setAxisOrder(Object.keys(this.axes));
    this.samples = samples;
    this.setActiveScalar(this.getDefaultScalar(this.getActiveScalar()));
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
    return DataProvider.filterSamples(this.samples, axes);
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

  setAxes(axes: {[element: string]: IAxis}) {
    // Ensure the new axes match the elements in the dataset
    for (let key of Object.keys(axes)) {
      if (!(key in this.axes)) {
        console.warn(`Setting axis ${key}, but no samples in the dataset span this dimension`);
      }
      this.axes[key] = axes[key];
    }
  }

  getAxes() {
    return this.axes;
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
    return axis ? axis.element.charAt(0).toUpperCase() + axis.element.slice(1) : 'X';
  }

  getScalarRange(key: string) : [number, number] {
    const values: number[] = this.samples.map(sample => DataProvider.getSampleScalar(sample, key));
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

  static getSampleScalar(sample: ISample, scalar: string) : number {
    if (scalar in sample.scalars) {
      return sample.scalars[scalar];
    } else {
      return null;
    }
  }

  static filterSamples(samples: ISample[], axes: any[]) : ISample[] {
    for (let axis of axes) {
      if (typeof axis.range === 'function') {
        samples = samples.filter(sample => {
          const fraction = axis.element in sample.composition ? sample.composition[axis.element] : 0;
          return axis.range(fraction, eps);
        });
      } else {
        samples = samples.filter(sample => {
          const fraction = axis.element in sample.composition ? sample.composition[axis.element] : 0;
          if (axis.range[0] - eps < fraction && fraction < axis.range[1] + eps) {
            return true;
          } else {
            return false;
          }
        })
      }
    }
    return samples;
  }
}

export class QuaternaryDataProvider extends DataProvider {
  constructor() {
    super(4);
  }
}
