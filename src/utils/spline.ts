export interface ISplineModel {
  knots: number[];
  coeffs: number[];
  k: number;
}

export function splineEval(x: number[], spl: ISplineModel) : number[] {
  /*
    TypeScript port of FITPACK's `splev` routine:
    subroutine splev(t,n,c,k,x,y,m,e,ier)
  */
  const y: number[] = [];

  const { knots, coeffs, k } = spl;

  const n = knots.length;
  const m = x.length;

  let l = k;

  for (let i = 0; i < m; ++ i) {
    let xVal = x[i];

    while (xVal >= knots[l + 1] && l < n - k - 2) {
      l += 1;
    }

    while (xVal < knots[l] && l > k) {
      l -= 1;
    }

    let h = bSpline(knots, k, xVal, l);

    let yVal = 0;
    for (let j = 0; j < k + 1; ++j) {
      yVal += coeffs[l + j - k] * h[j];
    }

    y.push(yVal);

  }

  return y;
}

function bSpline(knots: number[], k: number, x: number, l: number): number[] {
  /*
    TypeScript port of FITPACK's `fpbspl` routine
    subroutine fpbspl(t,n,k,x,l,h)
  */
  let h: number[] = [];
  let hh: number[] = [];
  for (let i = 0; i < k + 1; ++i) {
    h.push(0);
    hh.push(0);
  }

  h[0] = 1;

  for (let j = 0; j < k; ++j) {
    for (let i = 0; i <= j; ++i) {
      hh[i] = h[i];
    }

    h[0] = 0;

    for (let i = 0; i <= j; ++i) {
      let li = l + i + 1;
      let lj = li - j -1;

      const f = hh[i] / (knots[li] - knots[lj]);
      h[i] = h[i] + f * (knots[li] - x);
      h[i + 1] = f * (x - knots[lj]);
    }
  }

  return h;
}
