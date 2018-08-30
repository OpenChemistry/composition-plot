export interface ISample {
  id: number;
  components: number[];
  values: number[];
};

export interface IDataSet {
  elements: string[];
  scalars: string[];
  samples: ISample[];
  spacing?: number[];
  range?: number[][];
};

export interface ISpectrum {
  [name: string]: number[]
}
