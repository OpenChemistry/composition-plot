export function* combinations<T>(iterable: T[], r: number){
  let pool = iterable.map(v => v);
  let n = pool.length;
  if (r > n) {
    return;
  }

  let indices = [];
  for (let i = 0; i < r; ++i) {
    indices.push(i);
  }

  yield indices.map(i => pool[i]);

  while (true){

    let i = r - 1;
    let interrupted = false;
    while (i >= 0) {
      if (indices[i] !== i + n - r) {
        interrupted = true;
        break;
      }
      i -= 1;
    }
  
    if (!interrupted) {
      return;
    }
    
    indices[i] += 1;
    
    for (let j = i + 1; j < r; ++j) {
      indices[j] = indices[j - 1] + 1;
    }

    yield indices.map(i => pool[i]);
  }
}
