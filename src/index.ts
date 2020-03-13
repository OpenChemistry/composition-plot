export { TernaryPlot } from './plots/ternary';
export { QuaternaryPlot } from './plots/quaternary';
export { Spectrum } from './plots/spectrum';
export { HeatMap } from './plots/heatmap';
export { MultidimensionalPlot, makeCamera } from './plots/multidimensional';
export { ColorMapLegend, CategoryLegend } from './plots/legend';
export { DataProvider, HeatMapDataProvider } from './data-provider';
export { InfoProvider } from './data-provider/info';
export { ISample } from './types';
export { combinations } from './utils/combinations';
export {
  ICompositionToPositionProvider,
  NearestCompositionToPositionProvider,
  AnalyticalCompositionToPositionProvider,
  DataProvider as MultidimensionalDataProvider
} from './data-provider/multidimensional';
export {
  BasePlot, IVertex, verticesFnFactory,
  VerticesFn, PlotTypes, samplePositionFnFactory,
  QuaternaryShellPlot
} from './plots/common';
import * as colors from './utils/colors';
import * as spline from './utils/spline';
export { colors, spline };
export { samplesToLines, downloadLinesAsCSV } from './utils/csv';
