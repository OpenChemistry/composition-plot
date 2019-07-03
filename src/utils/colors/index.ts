import * as presets from './presets';

export { presets };

export function scalarToColor(
  scalar: number,
  colorMap: [number, number, number][],
  colorMapRange: [number, number]
) {
  // console.log("SCALAR TO COLOR", scalar, colorMap, colorMapRange);
  let indexFloat = (colorMap.length - 1) * (scalar - colorMapRange[0]) / (colorMapRange[1] - colorMapRange[0]);
  if (indexFloat <= 0) {
    return colorMap[0];
  } else if (indexFloat >= colorMap.length - 1) {
    return colorMap[colorMap.length - 1];
  }

  let index = Math.floor(indexFloat);
  let delta = indexFloat - index;

  let color = [
    (1 - delta) * colorMap[index][0] + delta * colorMap[index + 1][0],
    (1 - delta) * colorMap[index][1] + delta * colorMap[index + 1][1],
    (1 - delta) * colorMap[index][2] + delta * colorMap[index + 1][2],
  ]
  return color;
}

// const lineColors: [number, number, number][] = [
  // [1, 0, 0],
  // [0, 1, 0],
  // [0, 0, 1]
// ]

export function* getLineColor() {
  let i = 0;
  while(true) {
    let idx = i % presets.viridis.length;
    yield presets.viridis[idx];
    i += 4;
  }
}

export function rgbToHex(r: number, g: number, b: number) : string {
  const red = numToHex(Math.floor(r * 255));
  const green = numToHex(Math.floor(g * 255));
  const blue = numToHex(Math.floor(b * 255));
  return red + green + blue;
};

export function hexTorgb(hex: string) : [number, number, number] {
  if (hex.length !== 6) {
    return [0, 0, 0];
  }
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  return [r / 255, g / 255, b / 255];
}

function numToHex(n: number) : string {
  let hex = Number(n).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};
