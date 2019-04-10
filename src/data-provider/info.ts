import { ISample } from '../types';

const eps = 1e-6;

export class InfoProvider {
  samples: ISample[] = [];
  scalars: Set<string> = new Set();
  elements: Set<string> = new Set();
  scalarsRange: {[element: string]: [number, number]} = {};
  elementsRange: {[element: string]: [number, number]} = {};

  setData(samples: ISample[]) : void {
    this.samples = [];
    this.elements = new Set();
    this.scalars = new Set();
    this.elementsRange = {};
    this.scalarsRange = {};

    if (samples.length === 0) {
      return;
    }

    const compositions: {[element:string]: [number, number]} = {};
    const scalars: {[scalar:string]: [number, number]} = {};

    for (let sample of samples) {
      const elements = Object.keys(sample.composition);

      for (let element of elements) {
        let fraction = sample.composition[element];
        if (!(element in compositions)) {
          compositions[element] = [fraction, fraction];
        }

        if (fraction < compositions[element][0]) {
          compositions[element][0] = fraction;
        } else if (fraction > compositions[element][1]) {
          compositions[element][1] = fraction;
        }
      }

      for (let key of Object.keys(sample.scalars)) {
        let value = sample.scalars[key];
        if (!(key in scalars)) {
          scalars[key] = [value, value];
        }

        if (value < scalars[key][0]) {
          scalars[key][0] = value;
        } else if (value > scalars[key][1]) {
          scalars[key][1] = value;
        }
        this.scalars.add(key);
      }
    }

    this.scalarsRange = {...scalars};

    const elements = Object.keys(compositions);
    for (let element of elements) {
      const range: [number, number] = compositions[element];
      if (range[1] > eps) {
        this.elements.add(element);
        this.elementsRange[element] = range;
      }
    }

    this.samples = samples;
  }

  getScalarsRange() : {[scalar: string]: [number, number]} {
    return this.scalarsRange;
  }

  getScalarRange(key: string) : [number, number] {
    if (key in this.scalarsRange) {
      return this.scalarsRange[key];
    }
    return [0, 0];
  }

  getScalars() : string[] {
    const scalars = [];
    this.scalars.forEach((val) => {scalars.push(val)});
    return scalars;
  }

  getElements() : string[] {
    const elements = [];
    this.elements.forEach((val) => {elements.push(val)});
    return elements;
  }

  getValidScalar(key: string = null) : string {
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

  static getSampleScalar(sample: ISample, scalar: string) : number {
    if (scalar in sample.scalars) {
      return sample.scalars[scalar];
    } else {
      return null;
    }
  }
}
