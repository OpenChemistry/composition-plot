import Plotly from 'plotly.js';

import { HeatMapDataProvider } from '../data-provider';
import { RGBColor } from '@colormap/core';

class HeatMap {
  div: HTMLElement;
  dp: HeatMapDataProvider;
  textColor: RGBColor;

  constructor(div: HTMLElement, dp: HeatMapDataProvider) {
    this.div = div;
    this.dp = dp;
    this.textColor = [0, 0, 0];
  }

  setTextColor(color: RGBColor) {
    this.textColor = color;
  }

  dataUpdated() {
    const xValues = this.dp.X;
    const yValues = this.dp.Y;
    const zValues = this.dp.Z;

    const m = zValues.length;
    const n = zValues[0].length;

    const transposedZ = [];
    for (let i = 0; i < n; ++i) {
      transposedZ.push([]);
      for (let j = 0; j< m; ++j) {
        transposedZ[i].push(zValues[j][i]);
      }
    }

    const data = [
      {
        x: xValues,
        y: yValues,
        z: transposedZ,
        flipZ: true,
        type: 'heatmap',
        colorscale: 'Viridis'
      }
    ];

    const layout = {
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      autosize: true,
      margin: {
        l: 75,
        r: 0,
        b: 125,
        t: 16
      },
      font: {
        color: `rgb(${this.textColor[0] * 255}, ${this.textColor[1] * 255}, ${this.textColor[2] * 255})`
      }
    }

    const config = {
      displayModeBar: false
    }

    Plotly.newPlot(this.div, data, layout, config);
  }
}

export { HeatMap };
