import { ArrayDataProvider, CategoryLegend, ISample, Spectrum } from 'composition-plot';

function main() {
  const container = document.getElementById('plot-container') as HTMLElement;

  type Sp = {
    spectrum: ArrayDataProvider;
    sample: ISample;
  }

  const spectra: Sp[] = [];

  {
    const dp = new ArrayDataProvider();
    dp.setArray('x', [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    dp.setLabel('x', 'X (m)');
    dp.setArray('y', [16, 9, 4, 1, 0, 1, 4, 9, 16]);
    dp.setLabel('y', 'Y (m)');
    const sample: ISample = {
      _id: '0',
      sampleNum: 0,
      composition: {
        Fe: 1
      },
      fom: []
    };
    spectra.push({spectrum: dp, sample: sample});
  }

  {
    const dp = new ArrayDataProvider();
    dp.setArray('x', [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    dp.setLabel('x', 'X (m)');
    dp.setArray('y', [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    dp.setLabel('y', 'Y (m)');
    const sample: ISample = {
      _id: '0',
      sampleNum: 0,
      composition: {
        Co: 1
      },
      fom: []
    };
    spectra.push({spectrum: dp, sample: sample});
  }

  const plot = new Spectrum(container);

  plot.setSpectra(spectra);

  plot.setLineColors([
    [1,0,0],
    [0,1,0],
    [0,0,1],
  ]);

  plot.setShowPoints(true);

  plot.setOnSelect((...args: any[]) => console.log(args));

  plot.render();
}

main();