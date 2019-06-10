import { ISample, Vec3 } from '../types';

export interface ICompositionToPositionProvider {
  getPosition: (composition: number[]) => Vec3;
  getDimensions: () => number;
}

export class AnalyticalCompositionToPositionProvider implements ICompositionToPositionProvider {
  private dimensions = 4;
  private compositionToPosition = ([a, b, c, d]: number[]) : Vec3 => {
    const scale = 30;
    let x = (c + 1 - b) / 2;
    let y = Math.sqrt(3) / 2 * a + Math.sqrt(3) / 6 * d;
    let z = Math.sqrt(3) / 2 * d;
    return [scale * (x - 0.5), scale * (y - Math.sqrt(3) / 3), scale * (z - Math.sqrt(3) / 4)];
  }

  setFunction(dimensions: number, fn: (composition: number[]) => Vec3) {
    this.dimensions = dimensions;
    this.compositionToPosition = fn;
  }

  getPosition(composition: number[]) : Vec3 {
    return this.compositionToPosition(composition);
  }

  getDimensions() : number {
    return this.dimensions;
  }
}

export class NearestCompositionToPositionProvider implements ICompositionToPositionProvider {
  private dimensions : number;
  private resolution : number;
  private decimalDigits: number;
  private compositionMap : {[composition: string]: Vec3} = {};

  setData(
    dimensions: number,
    resolution: number,
    data: number[],
    fractional: boolean = true
  ) {
    if (!fractional) {
      resolution /= 100;
    }
    this.resolution = resolution;
    this.dimensions = dimensions;
    this.dimensions;
    this.decimalDigits = Math.ceil(-Math.log10(resolution));
    const n = data.length;
    const chunk = dimensions + 3;
    if (n % chunk !== 0) {
      throw new Error(`The provided data does not match the expected size for a ${dimensions}-dimensional set`);
    }
    const nCompositions = n / chunk;

    for (let i = 0; i < nCompositions; ++i) {
      let composition: number[] = data.slice(i * chunk, i * chunk + dimensions);
      if (!fractional) {
        composition = composition.map(val => val / 100);
      }
      const key = this.compositionToKey(composition);
      const position = data.slice(i * chunk + dimensions, (i + 1) * chunk) as Vec3;
      this.compositionMap[key] = position;
    }
  }

  getPosition(composition: number[]) : Vec3 {
    const key = this.compositionToKey(composition);
    if (key in this.compositionMap) {
      return this.compositionMap[key];
    }
    return [0, 0, 0];
  }

  getDimensions() : number {
    return this.dimensions;
  }

  private compositionToKey(composition: number[]) : string {
    return composition
      .map(val => this.resolution * Math.round(val / this.resolution))
      .map(val => val.toFixed(this.decimalDigits))
      .join(',');
  }

}

export class DataProvider {
  samples: ISample[] = [];
  scalars: Set<string> = new Set();
  elements: Set<string> = new Set();
  activeScalar: string;
  axisToIdx: {[element: string]: number} = {};
  idxToAxis: {[element: number]: string} = {};
  filter: (sample: ISample) => boolean = () => true;

  dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  setData(samples: ISample[]) : void {
    this.samples = [];
    this.scalars = new Set();

    if (samples.length === 0) {
      return;
    }

    for (let sample of samples) {
      sample.fom.forEach(fom => {
        this.scalars.add(fom.name);
      });

      Object.keys(sample.composition).forEach(element => {
        this.elements.add(element);
      });

    }

    this.samples = samples;
    this.setActiveScalar(this.getDefaultScalar(this.getActiveScalar()));
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

  getElements() : string[] {
    const elements = [];
    this.elements.forEach((val) => {elements.push(val)});
    return elements;
  }

  setFilter(filter: undefined | null | ((sample: ISample) => boolean) = null) {
    if (filter === undefined || filter === null) {
      filter = () => true;
    }
    this.filter = filter;
  }

  getSamples(sampleFilter: (sample: ISample) => boolean | undefined = undefined) : ISample[] {
    const filter = sampleFilter || this.filter;
    return this.samples.filter(sample => filter(sample));
  }

  static getSampleScalar(sample: ISample, scalar: string, runId?: string, analysisId?: string) : number | null {
    const matchRunId = !!runId;
    const matchAnalysisId = !!analysisId;

    for (let fom of sample.fom) {
      const isMatch = (fom.name === scalar
                     && (runId == fom.runId || !matchRunId)
                     && (analysisId == fom.analysisId || !matchAnalysisId));
      if (isMatch) {
        return fom.value;
      }
    }

    return null;
  }

  static isSelected(sample: ISample, selectedKeys: Set<string>) : boolean {
    return selectedKeys.has(sample._id);
  }
}
