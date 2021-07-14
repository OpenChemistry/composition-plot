import { ColorMapLegend, CategoryLegend } from 'composition-plot/dist/plots/legend';

function main() {
  {
    const container = document.getElementById('legend-0') as HTMLDivElement;
    const legend = new ColorMapLegend(container);
    legend.setDirection('horizontal');
    legend.setColors([
      [1,0,0],
      [1,1,0],
      [0,1,0],
      [0,1,1],
      [0,0,1],
    ]);
    legend.setRange([0,100]);
    legend.draw();
  }
  {
    const container = document.getElementById('legend-1') as HTMLDivElement;
    const legend = new CategoryLegend(container);
    legend.setDirection('horizontal');
    legend.setColors([
      [0,1,0],
      [1,1,1],
      [1,0,0],
    ]);
    legend.setLabels([
      'Foo',
      'Bar',
      'Baz',
    ])
    legend.draw();
  }
}

main();