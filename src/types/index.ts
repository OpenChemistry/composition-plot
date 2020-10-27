export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export interface IComposition {
  [element: string]: number;
}

export interface IFom {
  _id: string;
  name: string;
  value: number;
  analysisId: string;
  runId: string;
}

export interface IPosition {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface ISample<T = {}> {
  _id: string;
  sampleNum: number;
  composition: IComposition;
  fom: IFom[];
  position?: IPosition;
  metaData?: T;
  // [prop:string]: any;
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
