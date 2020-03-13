import { linearScale, RGBColor } from '@colormap/core';

import { DataProvider, ICompositionToPositionProvider } from '../data-provider/multidimensional';

import 'vtk.js';
import { hexTorgb } from '../utils/colors';
import { ISample, Vec2 } from '../types';
declare const vtk: any;

function makeCamera() {
  return vtk.Rendering.Core.vtkCamera.newInstance();
}

class MultidimensionalPlot {
  div: HTMLElement;
  dp: DataProvider;
  range: Vec2;
  colors: RGBColor[];
  compositionToPosition: ICompositionToPositionProvider;
  compositionSpace: string[] | undefined;
  inverted: boolean;
  viewer;
  polyData;
  renderer;
  renderWindow;
  mapper;
  actor;
  lut;
  linesPolyData;
  linesMapper;
  linesActor;
  labelWidgets = [];
  radiusFn: (sample: ISample) => number = () => 1.5;

  constructor(
    div: HTMLElement, dp: DataProvider, compositionToPosition: ICompositionToPositionProvider
  ) {
    this.div = div;
    this.dp = dp;
    this.compositionToPosition = compositionToPosition;
    this.range = [0, 1];
    this.colors = [[0, 0, 0], [1, 1, 1]];
    this.inverted = false;

    this.viewer = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance();
    this.viewer.setBackground(0.9, 0.9, 0.9);
    this.viewer.setContainer(this.div);
    this.viewer.resize();
    this.renderer = this.viewer.getRenderer();
    this.renderWindow = this.viewer.getRenderWindow();
    this.polyData = vtk.Common.DataModel.vtkPolyData.newInstance();
    this.mapper = vtk.Rendering.Core.vtkSphereMapper.newInstance();
    this.actor = vtk.Rendering.Core.vtkActor.newInstance();
    this.lut = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();

    this.mapper.setUseLookupTableScalarRange(true);
    this.mapper.setInputData(this.polyData);
    this.mapper.setScaleArray('sizes');
    this.mapper.setLookupTable(this.lut);
    this.actor.setMapper(this.mapper);
    this.renderer.addActor(this.actor);

    this.linesPolyData = vtk.Common.DataModel.vtkPolyData.newInstance();
    this.linesMapper = vtk.Rendering.Core.vtkMapper.newInstance();
    this.linesActor = vtk.Rendering.Core.vtkActor.newInstance();

    this.linesMapper.setInputData(this.linesPolyData);
    this.linesActor.setMapper(this.linesMapper);
    this.linesActor.getProperty().setColor([0, 0, 0]);
    this.renderer.addActor(this.linesActor);
    
    (window as any).widget3d = this;

    this.resize();
  }

  resize() {
    const {width, height} = this.div.getBoundingClientRect();
    this.viewer.getOpenGLRenderWindow().setSize(width, height);
    this.renderWindow.render();
  }

  setBackground(color: RGBColor | string) {
    if (Array.isArray(color)) {
      this.viewer.setBackground(...color);
    } else {
      this.viewer.setBackground(...hexTorgb(color.replace('#', '')));
    }
    this.renderWindow.render();
  }

  setRadiusFn(radiusFn: (sample: ISample) => number) {
    this.radiusFn = radiusFn;
    this.updateSizesArray();
  }

  setCamera(camera, resetCamera = false, watchModified = false) {
    this.renderer.setActiveCamera(camera);

    if (resetCamera) {
      this.renderer.resetCamera();
    }

    if (watchModified) {
      camera.onModified(() => {
        this.renderWindow.render();
      });
    }

    this.renderWindow.render();
  }

  setCompositionSpace(compositionSpace: string[]) {
    this.compositionSpace = compositionSpace;
  }

  setCompositionToPosition(compositionToPosition: ICompositionToPositionProvider) {
    this.compositionToPosition = compositionToPosition;
  }

  getCamera() {
    return this.renderer.getActiveCamera();
  }

  dataUpdated() {
    let filter: (sample: ISample) => boolean;
    if (this.compositionSpace) {
      const compositionSet = new Set(this.compositionSpace);
      filter = (sample: ISample) : boolean => {
        for (let [element, fraction] of Object.entries(sample.composition)) {
          if (!compositionSet.has(element) && fraction > Number.EPSILON) {
            return false;
          }
        }
        return true;
      }
    } else {
      filter = () => true;
    }
    const samples = this.dp.getSamples(filter);
    const nSamples = samples.length;
    const coords = new Float32Array(3 * nSamples);
    const scalars = {};
    const scalarKeys = this.dp.getScalars();
    for (let key of scalarKeys) {
      scalars[key] = new Float32Array(nSamples);
    }

    let elements: string[] = this.compositionSpace ? [...this.compositionSpace] : this.dp.getElements();

    if (elements.length < this.compositionToPosition.getDimensions()) {
      let extra = this.compositionToPosition.getDimensions() - elements.length;
      for (let i = 0; i < extra; ++i ) {
        elements.push('');
      }
    } else if (elements.length > this.compositionToPosition.getDimensions()) {
      return;
      // throw new Error(`The composition space ${elements} is larger than 8`);
    }

    for (let i = 0; i < nSamples; ++i) {
      let sample = samples[i];
      let composition = elements.map(key => sample.composition[key] || 0.0);
      let position = this.compositionToPosition.getPosition(composition);
      coords[3 * i] = position[0];
      coords[3 * i + 1] = position[1];
      coords[3 * i + 2] = position[2];
      for (let key of scalarKeys) {
        scalars[key][i] = DataProvider.getSampleScalar(sample, key) || 0.0;
      }
    }
    this.polyData.getPoints().setData(coords);
    for (let key of scalarKeys) {
      this.polyData.getPointData().addArray(
        vtk.Common.Core.vtkDataArray.newInstance({name: key, values: scalars[key]})
      );
    }

    this.addLabels();
    this.addLines();

    this.polyData.getPointData().setActiveScalars(this.dp.getActiveScalar());
    this.updateSizesArray();
    this.polyData.modified();
    this.renderer.resetCamera();
    this.renderWindow.render();
  }

  updateSizesArray() {
    const samples = this.dp.getSamples();
    const nSamples = samples.length;
    const sizes = new Float32Array(nSamples);
    for (let i = 0; i < nSamples; ++i) {
      let sample = samples[i];
      sizes[i] = this.radiusFn(sample);
    }
    this.polyData.getPointData().addArray(
      vtk.Common.Core.vtkDataArray.newInstance({name: 'sizes', values: sizes})
    );
    this.polyData.modified();
    this.renderWindow.render();
  }

  addLabels() {
    this.removeLabels();
    const elements = this.compositionSpace || this.dp.getElements();
    const composition = new Array(elements.length);
    for (let i = 0; i < elements.length; ++i) {
      for (let j = 0; j < this.compositionToPosition.getDimensions(); ++j) {
        composition[j] = 0.0;
      }
      composition[i] = 1.0;
      let position = this.compositionToPosition.getPosition(composition)
        .map(val => 1.2 * val);
      const labelWidget = vtk.Interaction.Widgets.vtkLabelWidget.newInstance();
      labelWidget.setInteractor(this.renderWindow.getInteractor());
      labelWidget.setEnabled(1);
      labelWidget.setProcessEvents(false);
      labelWidget.getWidgetRep().setLabelText(elements[i]);
      labelWidget.getWidgetRep().setWorldPosition(position);
      this.labelWidgets.push(labelWidget);
    }
  }

  addLines() {
    const elements = this.compositionSpace || this.dp.getElements();
    const composition = new Array(elements.length);

    this.removeLines();

    if (elements.length > 4) {
      return;
    }

    const points = new Float32Array(elements.length * 3);
    const lines = new Uint32Array(3 * elements.length * (elements.length - 1) / 2);

    for (let i = 0; i < elements.length; ++i) {
      for (let j = 0; j < this.compositionToPosition.getDimensions(); ++j) {
        composition[j] = 0.0;
      }
      composition[i] = 1.0;
      let position = this.compositionToPosition.getPosition(composition);
      points[i * 3] = position[0];
      points[i * 3 + 1] = position[1];
      points[i * 3 + 2] = position[2];
    }

    let k = 0;
    for (let i = 0; i < elements.length - 1; ++i) {
      for (let j = i + 1; j < elements.length; ++j) {
        lines[3 * k] = 2;
        lines[3 * k + 1] = i;
        lines[3 * k + 2] = j;
        ++k;
      }
    }

    this.linesPolyData.getPoints().setData(points);
    this.linesPolyData.getLines().setData(lines);
    this.linesPolyData.modified();
  }

  removeLabels() {
    for (let labelWidget of this.labelWidgets) {
      labelWidget.setEnabled(0);
    }
  }

  removeLines() {
    this.linesPolyData.getPoints().setData(new Float32Array(0));
    this.linesPolyData.getLines().setData(new Uint32Array(0));
  }

  activeScalarsUpdated() {
    this.polyData.getPointData().setActiveScalars(this.dp.getActiveScalar());
    this.polyData.modified();
    this.renderWindow.render();
  }

  setColorMap(map: RGBColor[], range: Vec2) {
    this.lut.removeAllPoints();
    this.range = range;
    this.colors = map;

    let mapRange: Vec2;
    if (this.inverted) {
      mapRange = [range[1], range[0]];
    } else {
      mapRange = [range[0], range[1]];
    }

    let scale = linearScale([0, map.length], mapRange);

    for (let i = 0; i < map.length; ++i) {
      let x = scale(i);
      this.lut.addRGBPoint(x, ...map[i]);
    }
    this.renderWindow.render();
  }

  setInverted(inverted: boolean) {
    this.inverted = inverted;
    this.setColorMap(this.colors, this.range);
  }
}

export { MultidimensionalPlot, makeCamera };
