/**
 * deeply converts keys of an object from one case to another
 * @param {object} oldObject
 * @param {(v: string) => string} converterFunction
 * @returns {object}
 */
const convertCase = (oldObject: any, converterFunction: (v: string) => string) => {
  let newObject: any;

  if (!oldObject || typeof oldObject !== 'object' || !Object.keys(oldObject).length) {
    return oldObject;
  }

  if (Array.isArray(oldObject)) {
    newObject = oldObject.map(element => convertCase(element, converterFunction));
  } else {
    newObject = {};
    Object.keys(oldObject).forEach((oldKey) => {
      const newKey = converterFunction(oldKey);
      newObject[newKey] = convertCase(oldObject[oldKey], converterFunction);
    });
  }

  return newObject;
};

/**
 * Convert a snake_case string to camelCase.
 * Simple implementation — handles `foo_bar` → `fooBar`.
 */
const camelCase = (v: string): string =>
  v.replace(/_[a-z]/g, (match) => match.charAt(1).toUpperCase());

/**
 * Convert a camelCase string to snake_case.
 * Simple implementation — handles `fooBar` → `foo_bar`.
 */
const snakeCase = (v: string): string =>
  v.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

export const toCamelCase = (obj: object) => convertCase(obj, camelCase);
export const toSnakeCase = (obj: object) => convertCase(obj, snakeCase);
