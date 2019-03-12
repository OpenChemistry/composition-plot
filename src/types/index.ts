export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

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
  range: Vec2;
}

export interface ISpectrum {
  [name: string]: number[];
}

export interface ISegment {
  start: number;
  stop: number;
  selected: boolean;
}
