export function generateRandom(
  labels: string[],
  fields: string[],
  extent: [number, number] = [0, 1],
  spacing: number = 0.1
): any[] {
  let data = [];

  const span = extent[1] - extent[0];
  const m = span / spacing + 1;

  for (let i = 0; i < m; ++i) {
    for (let j = 0; j < m - i; ++j) {
      for (let k = 0; k < m - i - j; ++k) {

        let d = i / (m - 1);
        let c = (1 - d) * j / (m - i - 1) || 0;
        let b = (1 - c - d) * (k / (m - i - j - 1)) || 0;
        let a = (1 - c - d) * (1 - k / (m - i - j - 1)) || 0;

        data.push({
          [labels[0]]: extent[0] + a * span,
          [labels[1]]: extent[0] + b * span,
          [labels[2]]: extent[0] + c * span,
          [labels[3]]: extent[0] + d * span,
          values: fields.reduce((result, key) => ({
            ...result,
            [key]: Math.random()
          }), {})
        })
      }
    }
  }

  return data;
}
