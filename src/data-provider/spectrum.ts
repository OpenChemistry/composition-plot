import { linearSpace } from '@openchemistry/utils';

import { ISplineModel, splineEval} from '../utils/spline';
import { ISpectrum } from '../types';

export interface IDataProvider {
  getArray: { (key: string) : number[] };
  setArray: { (key: string, data: any) };
  removeArray: { (key: string): boolean };
  hasKey: { (key: string): boolean };
  getKeys: { (): string[] };
}

class DataProvider implements IDataProvider {
  protected arrays: ISpectrum = {};

  constructor() {
    if (this.constructor == DataProvider) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  getArray(key: string): number[] {
    return this.arrays[key] || [];
  }

  getKeys(): string[] {
    return Object.keys(this.arrays);
  }

  hasKey(key: string): boolean {
    return key in this.arrays;
  }

  removeArray(key: string): boolean {
    const deleted = key in this.arrays;
    delete this.arrays[key];
    return deleted;
  }

  setArray(_key: string, _data: any) {
    throw new Error("setArray method must be implemented");
  }
}

export class ArrayDataProvider extends DataProvider {

  setArray(key: string, data: number[]) {
    this.arrays[key] = data;
  }

}

export class SplineDataProvider extends DataProvider {
  protected splines: {[key: string]: ISplineModel} = {};
  protected nPoints: number = 300;

  getArray(key): number[] {
    if (key in this.arrays && this.arrays[key] === null) {
      const x = linearSpace(0, 1, this.nPoints, false);
      this.arrays[key] = splineEval(x, this.splines[key]);
    }
    return super.getArray(key);
  }

  setArray(key: string, data: ISplineModel) {
    this.splines[key] = data;
    this.arrays[key] = null;
  }

  removeArray(key: string): boolean {
    delete this.splines[key];
    return super.removeArray(key);
  }

  setPoints(n: number) {
    if (n === this.nPoints) {
      return;
    }
    this.nPoints = n;
    for (let key in this.arrays) {
      this.arrays[key] = null;
    }
  }
}
