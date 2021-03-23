/**
 * Merges two arrays. If left array contains values from right, overwrite using
 * ones from right.
 */
export function mergeArraysFromRight<T>(
  left: ReadonlyArray<T>,
  right: ReadonlyArray<T>,
  equal: (a: T, b: T) => boolean,
): Array<T> {
  const toAdd = left.filter((x) => !right.some((y) => equal(x, y)))
  return right.concat(toAdd)
}
