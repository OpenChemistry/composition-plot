import { ISample } from '../types';

export class InfoProvider {
  samples: ISample[] = [];
  scalars: Set<string> = new Set();
  elements: Set<string> = new Set();
  runs: Set<string> = new Set();
  analyses: Set<string> = new Set();
  scalarsRange: {[element: string]: [number, number]} = {};
  elementsRange: {[element: string]: [number, number]} = {};

  setData(samples: ISample[]) : void {
    this.samples = [];
    this.elements = new Set();
    this.scalars = new Set();
    this.runs = new Set();
    this.analyses = new Set();
    this.elementsRange = {};
    this.scalarsRange = {};

    if (samples.length === 0) {
      return;
    }

    const compositions: {[element:string]: [number, number]} = {};
    const scalars: {[scalar:string]: [number, number]} = {};

    for (let sample of samples) {
      Object.entries(sample.composition).forEach(([element, fraction]) => {
        if (!(element in compositions)) {
          compositions[element] = [fraction, fraction];
        }

        if (fraction < compositions[element][0]) {
          compositions[element][0] = fraction;
        } else if (fraction > compositions[element][1]) {
          compositions[element][1] = fraction;
        }
      });

      sample.fom.forEach((fom) => {
        const { name, value, runId, analysisId } = fom;
        if (!(name in scalars)) {
          scalars[name] = [value, value];
        }

        if (value < scalars[name][0]) {
          scalars[name][0] = value;
        } else if (value > scalars[name][1]) {
          scalars[name][1] = value;
        }
        this.scalars.add(name);
        this.runs.add(runId);
        this.analyses.add(analysisId);
      });
    }

    this.scalarsRange = {...scalars};

    const elements = Object.keys(compositions);
    for (let element of elements) {
      const range: [number, number] = compositions[element];
      if (range[1] > Number.EPSILON) {
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

  getSamples() : ISample[] {
    return this.samples;
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
}
