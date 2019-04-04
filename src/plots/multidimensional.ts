import { DataProvider, NearestCompositionToPositionProvider } from '../data-provider/multidimensional';
import * as vtk from 'vtk.js-lite';

class MultidimensionalPlot {
  div: HTMLElement;
  dp: DataProvider;
  compositionToPosition: NearestCompositionToPositionProvider;
  viewer;
  polyData;
  renderer;
  renderWindow;
  mapper;
  actor;
  lut;
  labelWidgets = [];

  constructor(
    div: HTMLElement, dp: DataProvider, compositionToPosition: NearestCompositionToPositionProvider
  ) {
    this.div = div;
    this.dp = dp;
    this.compositionToPosition = compositionToPosition;

    this.viewer = vtk.vtkGenericRenderWindow.newInstance();
    this.viewer.setBackground(0.9, 0.9, 0.9);
    this.viewer.setContainer(this.div);
    this.viewer.resize();
    this.renderer = this.viewer.getRenderer();
    this.renderWindow = this.viewer.getRenderWindow();
    this.polyData = vtk.vtkPolyData.newInstance();
    this.mapper = vtk.vtkSphereMapper.newInstance();
    this.actor = vtk.vtkActor.newInstance();
    this.lut = vtk.vtkColorTransferFunction.newInstance();

    this.mapper.setUseLookupTableScalarRange(true);
    this.mapper.setInputData(this.polyData);
    this.mapper.setRadius(1.5);
    this.mapper.setLookupTable(this.lut);
    this.actor.setMapper(this.mapper);
    this.renderer.addActor(this.actor);
  }

  setBackground(color: [number, number, number]) {
    this.viewer.setBackground(...color);
    this.renderWindow.render();
  }

  dataUpdated() {
    const samples = this.dp.getSamples();
    const nSamples = samples.length;
    const coords = new Float32Array(3 * nSamples);
    const scalars = {};
    const scalarKeys = this.dp.getScalars();
    for (let key of scalarKeys) {
      scalars[key] = new Float32Array(nSamples);
    }

    let elements = this.dp.getElements();
    if (elements.length < this.compositionToPosition.getDimensions()) {
      let extra = this.compositionToPosition.getDimensions() - elements.length;
      for (let i = 0; i < extra; ++i ) {
        elements.push('');
      }
    } else if (elements.length > this.compositionToPosition.getDimensions()) {
      throw new Error(`The composition space ${elements} is larger than 8`);
    }

    for (let i = 0; i < nSamples; ++i) {
      let sample = samples[i];
      let composition = elements.map(key => sample.composition[key] || 0.0);
      let position = this.compositionToPosition.getPosition(composition);
      coords[3 * i] = position[0];
      coords[3 * i + 1] = position[1];
      coords[3 * i + 2] = position[2];
      for (let key of scalarKeys) {
        scalars[key][i] = sample.scalars[key] || 0.0;
      }
    }
    this.polyData.getPoints().setData(coords);
    for (let key of scalarKeys) {
      this.polyData.getPointData().addArray(
        vtk.vtkDataArray.newInstance({name: key, values: scalars[key]})
      );
    }

    this.addLabels();

    this.polyData.getPointData().setActiveScalars(this.dp.getActiveScalar());
    this.polyData.modified();
    this.renderer.resetCamera();
    this.renderWindow.render();
  }

  addLabels() {
    this.removeLabels();
    const elements = this.dp.getElements();
    const composition = new Array(elements.length);
    for (let i = 0; i < elements.length; ++i) {
      for (let j = 0; j < this.compositionToPosition.getDimensions(); ++j) {
        composition[j] = 0.0;
      }
      composition[i] = 1.0;
      let position = this.compositionToPosition.getPosition(composition)
        .map(val => 1.2 * val);
      const labelWidget = vtk.vtkLabelWidget.newInstance();
      labelWidget.setInteractor(this.renderWindow.getInteractor());
      labelWidget.setEnabled(1);
      labelWidget.setProcessEvents(false);
      labelWidget.getWidgetRep().setLabelText(elements[i]);
      labelWidget.getWidgetRep().setWorldPosition(position);
      this.labelWidgets.push(labelWidget);
    }
  }

  removeLabels() {
    for (let labelWidget of this.labelWidgets) {
      labelWidget.setEnabled(0);
    }
  }

  activeScalarsUpdated() {
    this.polyData.getPointData().setActiveScalars(this.dp.getActiveScalar());
    this.polyData.modified();
    this.renderWindow.render();
  }

  setColorMap(map: [number, number, number][], range: [number, number]) {
    this.lut.removeAllPoints();
    const delta = range[1] - range[0];
    for (let i = 0; i < map.length; ++i) {
      let x = range[0] + i * delta / (map.length - 1);
      this.lut.addRGBPoint(x, ...map[i]);
    }
    this.renderWindow.render();
  }
}

export { MultidimensionalPlot };
