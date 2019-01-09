export interface ISample {
  sampleNum: number;
  composition: {
    [element:string]: number;
  }
  scalars: {
    [scalar: string]: number;
  }
  _id: string;
  platemapId: string;
  runId: string;
  [prop:string]: any;
}

export interface IAxis {
  element: string;
  spacing: number;
  range: [number, number];
}

export interface ISpectrum {
  [name: string]: number[];
}

export interface ISegment {
  start: number;
  stop: number;
  selected: boolean;
}
