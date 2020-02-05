import { ISample } from '../types';

export function downloadLinesAsCSV(lines: string[], filename: string) {
  const element = document.createElement('a');
  const href = `data:text/plain;charset=utf-8,${encodeURIComponent(lines.join('\n'))}`;
  element.setAttribute('href', href);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function samplesToLines(samples: ISample[], plateId?: number, elementsHeaderSuffix: string = '.PM.Loading') : string[] {
  const elements = Array.from(discoverElements(samples));
  const foms = Array.from(discoverFoms(samples));

  const lines = [];

  lines.push(getHeaderLine(elements, foms, elementsHeaderSuffix, plateId));
  samples.forEach((sample, i) => {
    lines.push(getSampleLine(i, sample, elements, foms, plateId));
  });

  return lines;
}

function getSampleNo(sample: ISample) : number {
  return sample.sampleNum;
}

function getFomValue(sample: ISample, fomName: string) : number {
  for (let fom of sample.fom) {
    if (fom.name === fomName) {
      return fom.value;
    }
  }
  return Number.NaN;
}

function getComposition(sample: ISample, element: string) : number {
  return sample.composition[element] || 0;
}

function getHeaderLine(elements: string[], foms: string[], elementsHeaderSuffix: string, plateId?: number) : string {
  const columns : string[] = ['', 'sample_no'];

  if (plateId !== undefined && plateId !== null) {
    columns.push('plate_id');
  }

  foms.forEach(fom => {
    columns.push(fom);
  });

  elements.forEach(el => {
    columns.push(`${el}${elementsHeaderSuffix}`);
  });

  return columns.join(', ');
}

function getSampleLine(i: number, sample: ISample, elements: string[], foms: string[], plateId?: number) : string {
  const columns: string[] = [i.toString(), getSampleNo(sample).toString()];

  if (plateId !== undefined && plateId !== null) {
    columns.push(plateId.toString());
  }

  foms.forEach(fom => {
    columns.push(getFomValue(sample, fom).toString());
  });

  elements.forEach(el => {
    columns.push(getComposition(sample, el).toString());
  });

  return columns.join(', ');
}

function discoverFoms(samples: ISample[]) : Set<string> {
  return samples.reduce((foms, sample) => {
    sample.fom.forEach(fom => {
      foms.add(fom.name);
    });
    return foms;
  }, new Set<string>());
}

function discoverElements(samples: ISample[]) : Set<string> {
  return samples.reduce((elements, sample) => {
    Object.entries(sample.composition).forEach(([element, fraction]) => {
      if (fraction > Number.EPSILON) {
        elements.add(element);
      }
    });
    return elements;
  }, new Set<string>());
}
