import { Selection, BaseType, select, event as _currentEvent } from 'd3-selection';
import { transition, Transition } from 'd3-transition';

export const enum Element {
  H = 'H',
  He = 'He',
  Li = 'Li',
  Be = 'Be',
  B = 'B',
  C = 'C',
  N = 'N',
  O = 'O',
  F = 'F',
  Ne = 'Ne',
  Na = 'Na',
  Mg = 'Mg',
  Al = 'Al',
  Si = 'Si',
  P = 'P',
  S = 'S',
  Cl = 'Cl',
  Ar = 'Ar',
  K = 'K',
  Ca = 'Ca',
  Sc = 'Sc',
  Ti = 'Ti',
  V = 'V',
  Cr = 'Cr',
  Mn = 'Mn',
  Fe = 'Fe',
  Co = 'Co',
  Ni = 'Ni',
  Cu = 'Cu',
  Zn = 'Zn',
  Ga = 'Ga',
  Ge = 'Ge',
  As = 'As',
  Se = 'Se',
  Br = 'Br',
  Kr = 'Kr',
  Rb = 'Rb',
  Sr = 'Sr',
  Y = 'Y',
  Zr = 'Zr',
  Nb = 'Nb',
  Mo = 'Mo',
  Tc = 'Tc',
  Ru = 'Ru',
  Rh = 'Rh',
  Pd = 'Pd',
  Ag = 'Ag',
  Cd = 'Cd',
  In = 'In',
  Sn = 'Sn',
  Sb = 'Sb',
  Te = 'Te',
  I = 'I',
  Xe = 'Xe',
  Cs = 'Cs',
  Ba = 'Ba',
  La = 'La',
  Ce = 'Ce',
  Pr = 'Pr',
  Nd = 'Nd',
  Pm = 'Pm',
  Sm = 'Sm',
  Eu = 'Eu',
  Gd = 'Gd',
  Tb = 'Tb',
  Dy = 'Dy',
  Ho = 'Ho',
  Er = 'Er',
  Tm = 'Tm',
  Yb = 'Yb',
  Lu = 'Lu',
  Hf = 'Hf',
  Ta = 'Ta',
  W = 'W',
  Re = 'Re',
  Os = 'Os',
  Ir = 'Ir',
  Pt = 'Pt',
  Au = 'Au',
  Hg = 'Hg',
  Tl = 'Tl',
  Pb = 'Pb',
  Bi = 'Bi',
  Po = 'Po',
  At = 'At',
  Rn = 'Rn',
  Fr = 'Fr',
  Ra = 'Ra',
  Ac = 'Ac',
  Th = 'Th',
  Pa = 'Pa',
  U = 'U',
  Np = 'Np',
  Pu = 'Pu',
  Am = 'Am',
  Cm = 'Cm',
  Bk = 'Bk',
  Cf = 'Cf',
  Es = 'Es',
  Fm = 'Fm',
  Md = 'Md',
  No = 'No',
  Lr = 'Lr',
  Rf = 'Rf',
  Db = 'Db',
  Sg = 'Sg',
  Bh = 'Bh',
  Hs = 'Hs',
  Mt = 'Mt',
  Ds = 'Ds',
  Rg = 'Rg',
  Cn = 'Cn',
  Nh = 'Nh',
  Fl = 'Fl',
  Mc = 'Mc',
  Lv = 'Lv',
  Ts = 'Ts',
  Og = 'Og'
}

const enum TableBlock {
  S = 's-block',
  P = 'p-block',
  D0 = 'd-block-0',
  D1 = 'd-block-1',
  F = 'f-block'
}

const ElementPositions : Partial<Record<TableBlock, Partial<Record<Element, {row: number; col: number}>>>> = {
  [TableBlock.S] : {
    [Element.H]:  { row: 0, col: 0 },

    [Element.Li]: { row: 1, col: 0 },
    [Element.Be]: { row: 1, col: 1 },

    [Element.Na]: { row: 2, col: 0 },
    [Element.Mg]: { row: 2, col: 1 },

    [Element.K]:  { row: 3, col: 0 },
    [Element.Ca]: { row: 3, col: 1 },

    [Element.Rb]: { row: 4, col: 0 },
    [Element.Sr]: { row: 4, col: 1 },

    [Element.Cs]: { row: 5, col: 0 },
    [Element.Ba]: { row: 5, col: 1 },

    [Element.Fr]: { row: 6, col: 0 },
    [Element.Ra]: { row: 6, col: 1 },
  },
  [TableBlock.P] : {
    [Element.He]: { row: 0, col: 5 },

    [Element.B]:  { row: 1, col: 0 },
    [Element.C]:  { row: 1, col: 1 },
    [Element.N]:  { row: 1, col: 2 },
    [Element.O]:  { row: 1, col: 3 },
    [Element.F]:  { row: 1, col: 4 },
    [Element.Ne]: { row: 1, col: 5 },

    [Element.Al]: { row: 2, col: 0 },
    [Element.Si]: { row: 2, col: 1 },
    [Element.P]:  { row: 2, col: 2 },
    [Element.S]:  { row: 2, col: 3 },
    [Element.Cl]: { row: 2, col: 4 },
    [Element.Ar]: { row: 2, col: 5 },

    [Element.Ga]: { row: 3, col: 0 },
    [Element.Ge]: { row: 3, col: 1 },
    [Element.As]: { row: 3, col: 2 },
    [Element.Se]: { row: 3, col: 3 },
    [Element.Br]: { row: 3, col: 4 },
    [Element.Kr]: { row: 3, col: 5 },

    [Element.In]: { row: 4, col: 0 },
    [Element.Sn]: { row: 4, col: 1 },
    [Element.Sb]: { row: 4, col: 2 },
    [Element.Te]: { row: 4, col: 3 },
    [Element.I]:  { row: 4, col: 4 },
    [Element.Xe]: { row: 4, col: 5 },

    [Element.Tl]: { row: 5, col: 0 },
    [Element.Pb]: { row: 5, col: 1 },
    [Element.Bi]: { row: 5, col: 2 },
    [Element.Po]: { row: 5, col: 3 },
    [Element.At]: { row: 5, col: 4 },
    [Element.Rn]: { row: 5, col: 5 },

    [Element.Nh]: { row: 6, col: 0 },
    [Element.Fl]: { row: 6, col: 1 },
    [Element.Mc]: { row: 6, col: 2 },
    [Element.Lv]: { row: 6, col: 3 },
    [Element.Ts]: { row: 6, col: 4 },
    [Element.Og]: { row: 6, col: 5 },
  },
  [TableBlock.D0] : {
    [Element.Sc]: { row: 0, col: 0 },
    [Element.Y]:  { row: 1, col: 0 },
  },
  [TableBlock.D1] : {
    [Element.Ti]: { row: 0, col: 0 },
    [Element.V]:  { row: 0, col: 1 },
    [Element.Cr]: { row: 0, col: 2 },
    [Element.Mn]: { row: 0, col: 3 },
    [Element.Fe]: { row: 0, col: 4 },
    [Element.Co]: { row: 0, col: 5 },
    [Element.Ni]: { row: 0, col: 6 },
    [Element.Cu]: { row: 0, col: 7 },
    [Element.Zn]: { row: 0, col: 8 },

    [Element.Zr]: { row: 1, col: 0 },
    [Element.Nb]: { row: 1, col: 1 },
    [Element.Mo]: { row: 1, col: 2 },
    [Element.Tc]: { row: 1, col: 3 },
    [Element.Ru]: { row: 1, col: 4 },
    [Element.Rh]: { row: 1, col: 5 },
    [Element.Pd]: { row: 1, col: 6 },
    [Element.Ag]: { row: 1, col: 7 },
    [Element.Cd]: { row: 1, col: 8 },

    [Element.Hf]: { row: 2, col: 0 },
    [Element.Ta]: { row: 2, col: 1 },
    [Element.W]:  { row: 2, col: 2 },
    [Element.Re]: { row: 2, col: 3 },
    [Element.Os]: { row: 2, col: 4 },
    [Element.Ir]: { row: 2, col: 5 },
    [Element.Pt]: { row: 2, col: 6 },
    [Element.Au]: { row: 2, col: 7 },
    [Element.Hg]: { row: 2, col: 8 },

    [Element.Rf]: { row: 3, col: 0 },
    [Element.Db]: { row: 3, col: 1 },
    [Element.Sg]: { row: 3, col: 2 },
    [Element.Bh]: { row: 3, col: 3 },
    [Element.Hs]: { row: 3, col: 4 },
    [Element.Mt]: { row: 3, col: 5 },
    [Element.Ds]: { row: 3, col: 6 },
    [Element.Rg]: { row: 3, col: 7 },
    [Element.Cn]: { row: 3, col: 8 },
  },
  [TableBlock.F] : {
    [Element.La]: { row: 0, col: 0 },
    [Element.Ce]: { row: 0, col: 1 },
    [Element.Pr]: { row: 0, col: 2 },
    [Element.Nd]: { row: 0, col: 3 },
    [Element.Pm]: { row: 0, col: 4 },
    [Element.Sm]: { row: 0, col: 5 },
    [Element.Eu]: { row: 0, col: 6 },
    [Element.Gd]: { row: 0, col: 7 },
    [Element.Tb]: { row: 0, col: 8 },
    [Element.Dy]: { row: 0, col: 9 },
    [Element.Ho]: { row: 0, col: 10 },
    [Element.Er]: { row: 0, col: 11 },
    [Element.Tm]: { row: 0, col: 12 },
    [Element.Yb]: { row: 0, col: 13 },
    [Element.Lu]: { row: 0, col: 14 },

    [Element.Ac]: { row: 1, col: 0 },
    [Element.Th]: { row: 1, col: 1 },
    [Element.Pa]: { row: 1, col: 2 },
    [Element.U]:  { row: 1, col: 3 },
    [Element.Np]: { row: 1, col: 4 },
    [Element.Pu]: { row: 1, col: 5 },
    [Element.Am]: { row: 1, col: 6 },
    [Element.Cm]: { row: 1, col: 7 },
    [Element.Bk]: { row: 1, col: 8 },
    [Element.Cf]: { row: 1, col: 9 },
    [Element.Es]: { row: 1, col: 10 },
    [Element.Fm]: { row: 1, col: 11 },
    [Element.Md]: { row: 1, col: 12 },
    [Element.No]: { row: 1, col: 13 },
    [Element.Lr]: { row: 1, col: 14 },
  },
}

export enum TableLayout {
  L = 'L',
  M = 'M',
  S = 'S'
}

type RGBAColor = [number, number, number, number];

export type BorderColorFn = (el: Element) => RGBAColor;
export type BackgroundColorFn = (el: Element) => RGBAColor;
export type TextColorFn = (el: Element) => RGBAColor;
export type TitleTextFn = (el: Element) => string;
export type BodyTextFn = (el: Element) => string;
export type OnClickFn = (el: Element) => void;

const defaultBorderColorFn: BorderColorFn = () => [0.1, 0.1, 0.1, 1];
const defaultBackgroundColorFn: BackgroundColorFn = () => [0.9, 0.9, 0.9, 1];
const defaultTextColorFn: TextColorFn = () => [0.1, 0.1, 0.1, 1];
const defaultTitleTextFn: TitleTextFn = (el) => el;
const defaultBodyTextFn: BodyTextFn = () => '';
const defaultOnClickFn: OnClickFn = () => {};

export class PeriodicTable {
  svg: SVGElement;
  rootGroup: Selection<BaseType, {}, null, undefined>;
  borderColorFn: BorderColorFn = defaultBorderColorFn;
  backgroundColorFn: BackgroundColorFn = defaultBackgroundColorFn;
  textColorFn: TextColorFn = defaultTextColorFn;
  titleTextFn: TitleTextFn = defaultTitleTextFn;
  bodyTextFn: BodyTextFn = defaultBodyTextFn;
  onClickFn: OnClickFn = defaultOnClickFn;
  cellWidth: number = 50;
  cellHeight: number = 60;
  cellMargin: number = 5;
  tableLayout: TableLayout = TableLayout.M;

  constructor(svg: SVGElement) {
    this.svg = svg;
    select(svg).selectAll(`.periodic-table`).remove();
    this.rootGroup = select(svg)
    .append('g')
    .classed(`.periodic-table`, true);
    this.resize();
  }

  resize() {
    const { row, col } = this.getTableSize();
    const width = col * (this.cellWidth + this.cellMargin);
    const height = row * (this.cellHeight + this.cellMargin);
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.style.width = `100%`;
  }

  setLayout(layout: TableLayout) {
    this.tableLayout = layout;
    this.resize();
    this.render();
  }

  setBorderColorFn(fn?: BorderColorFn) {
    this.borderColorFn = fn || defaultBorderColorFn;
  }

  setBackgroundColorFn(fn?: BackgroundColorFn) {
    this.backgroundColorFn = fn || defaultBackgroundColorFn;
  }

  setTextColorFn(fn?: TextColorFn) {
    this.textColorFn = fn || defaultTextColorFn;
  }

  setTitleTextFn(fn?: TitleTextFn) {
    this.titleTextFn = fn || defaultTitleTextFn;
  }

  setBodyTextFn(fn?: BodyTextFn) {
    this.bodyTextFn = fn || defaultBodyTextFn;
  }

  setOnClickFn(fn?: OnClickFn) {
    this.onClickFn = fn || defaultOnClickFn;
  }

  render() {
    type ElementDatum = {element: Element, block: TableBlock, x: number, y: number};
    const elements = Object.entries(ElementPositions).reduce((cumulated, [block, elements]) => {
      const blockOrigin = this.getBlockOrigin(block as TableBlock);
      Object.entries(elements).forEach(([element, {row, col}]) => {
        cumulated.push({
          block: block as TableBlock,
          element: element as Element,
          x: (blockOrigin.col + col) * (this.cellWidth + this.cellMargin),
          y: (blockOrigin.row + row) * (this.cellHeight + this.cellMargin)
        })
      });
      return cumulated;
    }, [] as ElementDatum[]);
  
    const setupBlocks = (blocks: Selection<BaseType, ElementDatum, BaseType, {}>, t?: Transition<HTMLElement, unknown, null, undefined>) => {
      blocks = blocks.on('mousedown', d => {
        this.onClickFn(d.element);
      });

      const b = t ? blocks.transition(t) : blocks;
      b
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', this.cellWidth)
        .attr('height', this.cellHeight)
        .attr('fill', d => {
          const [r, g, b, a] = this.backgroundColorFn(d.element);
          return `rgba(${r * 255},${g * 255},${b * 255},${a})`;
        })
        .attr('stroke', d => {
          const [r, g, b, a] = this.borderColorFn(d.element);
          return `rgba(${r * 255},${g * 255},${b * 255},${a})`;
        })
      return b;
    }

    const setupText = (texts: Selection<BaseType, ElementDatum, BaseType, {}>, t?: Transition<HTMLElement, unknown, null, undefined>) => {
      texts = texts.text(d => this.titleTextFn(d.element));

      const txts = t ? texts.transition(t) : texts;
      txts
        .attr('fill', d => {
          const [r, g, b, a] = this.textColorFn(d.element);
          return `rgba(${r * 255},${g * 255},${b * 255},${a})`;
        })
        .attr('x', d => d.x + 10)
        .attr('y', d => d.y + 20)
      return txts;
    }

    const t = transition().duration(250);

    const blocks = this.rootGroup.selectAll('rect').data(elements);
    setupBlocks(blocks.enter().append('rect'));
    setupBlocks(blocks, t);
    blocks.exit().remove();

    const texts = this.rootGroup.selectAll('text').data(elements);
    setupText(texts.enter().append('text'));
    setupText(texts, t);
    texts.exit().remove();
  }

  private getBlockOrigin(block: TableBlock) {
    switch(this.tableLayout) {
      case TableLayout.S: {
        return this.getBlockOriginS(block);
      }

      case TableLayout.M: {
        return this.getBlockOriginM(block);
      }

      case TableLayout.L: {
        return this.getBlockOriginL(block);
      }
    }
  }

  private getBlockOriginS(block: TableBlock) {
    switch(block) {
      case TableBlock.S: {
        return {row: 0, col: 0};
      }

      case TableBlock.P: {
        return {row: 0, col: 2};
      }

      case TableBlock.D0: {
        return {row: 7.25, col: 0};
      }

      case TableBlock.D1: {
        return {row: 7.25, col: 1};
      }

      case TableBlock.F: {
        return {row: 11.5, col: 0};
      }
    }
  }

  private getBlockOriginM(block: TableBlock) {
    switch(block) {
      case TableBlock.S: {
        return {row: 0, col: 0};
      }

      case TableBlock.P: {
        return {row: 0, col: 12};
      }

      case TableBlock.D0: {
        return {row: 3, col: 2};
      }

      case TableBlock.D1: {
        return {row: 3, col: 3};
      }

      case TableBlock.F: {
        return {row: 7.25, col: 2};
      }
    }
  }

  private getBlockOriginL(block: TableBlock) {
    switch(block) {
      case TableBlock.S: {
        return {row: 0, col: 0};
      }

      case TableBlock.P: {
        return {row: 0, col: 26};
      }

      case TableBlock.D0: {
        return {row: 3, col: 2};
      }

      case TableBlock.D1: {
        return {row: 3, col: 17};
      }

      case TableBlock.F: {
        return {row: 5, col: 2};
      }
    }
  }

  private getTableSize() {
    switch(this.tableLayout) {
      case TableLayout.S: {
        return {row: 13.5, col: 15};
      }

      case TableLayout.M: {
        return {row: 9.25, col: 18};
      }

      case TableLayout.L: {
        return {row: 7, col: 32};
      }
    }
  }
}
