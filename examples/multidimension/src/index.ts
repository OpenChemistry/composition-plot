import { ISample, DataProvider } from 'composition-plot';
import { MultidimensionalPlot } from 'composition-plot';
import {MultidimensionalDataProvider, AnalyticalCompositionToPositionProvider} from 'composition-plot';
import {linearScale, createColorMap, RGBColor} from '@colormap/core';

function getSamples(): Promise<ISample[]> {
  return fetch('samples.json')
    .then(res => res.json())
    .then(samples => Object.values(samples));
}

function filterSamples(samples: ISample[], elements: string[], threshold: number): ISample[] {
  return samples.filter(sample => {
    const fraction = elements.reduce((fraction, element) => {
      return fraction + (sample.composition[element] || 0);
    }, 0);

    return Math.abs(fraction - 1) < threshold;
  });
}

function main() {
  getSamples().then(samples => {
    const compositionSpace = ['A', 'B', 'C', 'D'];
    samples = filterSamples(samples, compositionSpace, 1e-5);
    const dp = new MultidimensionalDataProvider(compositionSpace.length);
    dp.setData(samples);
    dp.setActiveScalar(compositionSpace[0]);
    const compositionToPosition = new AnalyticalCompositionToPositionProvider();

    const edge = 250;
    const fontSize = 16;
    const margin = 36;
    const spacing = 0.1;
    const hexagonRadius = 1 / Math.sqrt(3) * edge * spacing;

    const container = document.getElementById('root') as HTMLElement;

    // Create a colormap
    const colors: RGBColor[] = [
      [1,0.9,0.9],
      [0.5, 0, 0.5],
      [1,0,0]
    ];

    const plot = new MultidimensionalPlot(container, dp, compositionToPosition);
    plot.setCompositionSpace(compositionSpace);
    const scale = linearScale([0, 1], [0, 1]);
    const colormap = createColorMap(colors, scale);

    plot.setColorFn((sample, dp) => {
      const scalar = DataProvider.getSampleScalar(sample, dp.getActiveScalar());
      return colormap(scalar!);
    });

    plot.setBackground('#fafafa');
    plot.dataUpdated();
  });
}

main();