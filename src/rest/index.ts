import { ISpectrum } from '../types';

export function fetchSpectrum(id: number): Promise<ISpectrum> {
  return fetch(`assets/sample${id}.json`)
    .then(res => {
      return res.json();
    });
}
