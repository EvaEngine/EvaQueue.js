import snakeCase from 'lodash/snakeCase';
import camelCase from 'lodash/camelCase';

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

export const toCamelCase = (obj: object) => convertCase(obj, camelCase);
export const toSnakeCase = (obj: object) => convertCase(obj, snakeCase);

export default { toCamelCase, toSnakeCase };
