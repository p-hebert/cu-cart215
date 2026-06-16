export const POINT_SHEET = [
  // outermost ring
  // left col
  [0, 0, 1],
  [0, 1, 1],
  [0, 2, 1],
  [0, 3, 1],
  [0, 4, 1],
  [0, 5, 1],
  [0, 6, 1],
  // right col
  [6, 0, 1],
  [6, 1, 1],
  [6, 2, 1],
  [6, 3, 1],
  [6, 4, 1],
  [6, 5, 1],
  [6, 6, 1],
  // top row
  [1, 0, 1],
  [2, 0, 1],
  [3, 0, 1],
  [4, 0, 1],
  [5, 0, 1],
  // bottom row
  [1, 6, 1],
  [2, 6, 1],
  [3, 6, 1],
  [4, 6, 1],
  [5, 6, 1],

  // 2nd ring
  // left col
  [1, 1, 3],
  [1, 2, 3],
  [1, 3, 3],
  [1, 4, 3],
  [1, 5, 3],
  // right col
  [5, 1, 3],
  [5, 2, 3],
  [5, 3, 3],
  [5, 4, 3],
  [5, 5, 3],
  // top row
  [2, 1, 3],
  [3, 1, 3],
  [4, 1, 3],
  // bottom row
  [2, 5, 3],
  [3, 5, 3],
  [4, 5, 3],

  // 3rd ring
  // left col
  [2, 2, 6],
  [2, 3, 6],
  [2, 4, 6],
  // right col
  [4, 2, 6],
  [4, 3, 6],
  [4, 4, 6],
  // top row
  [3, 2, 6],
  // bottom row
  [3, 4, 6],

  // center
  [3, 3, 12],
];

export function getPointValueAt(col, row, pointSheet = POINT_SHEET) {
  const entry = pointSheet.find(([entryCol, entryRow]) => {
    return entryCol === col && entryRow === row;
  });

  return entry?.[2] ?? null;
}

export function isPointValueAt(
  col,
  row,
  allowedValues,
  pointSheet = POINT_SHEET,
) {
  const value = getPointValueAt(col, row, pointSheet);
  return allowedValues.includes(value);
}
