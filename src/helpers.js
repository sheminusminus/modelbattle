import * as R from 'ramda';
import * as changeCase from 'change-case';

export const coinFlip = () => Math.floor(Math.random() * 2) === 0;

export const shuffle = (array) => array.sort(() => Math.random() - 0.5);

export const isEq = (a, b) => R.equals(a, b);

export const camelcaseObjectKeys = (obj) => {
  return Object.keys(obj).reduce((o, key) => {
    const val = obj[key];
    const newKey = changeCase.camelCase(key);
    return {
      ...o,
      [newKey]: typeof val === 'object' && !Array.isArray(val)
        ? camelcaseObjectKeys(val)
        : val,
    };
  }, {});
};

export const sortPoints = (points) => {
  if (points.length === 4) {
    const xySort = R.sortWith([
      R.ascend(R.prop('x')),
      R.ascend(R.prop('y'))
    ]);
    const xySorted = xySort(points);
    const firstHalf = xySorted.slice(0, 2);
    const secondHalf = xySorted.slice(2, 4);
    return [...firstHalf, ...secondHalf.reverse()];
  }

  return [];
};

export const randomColor = () => (
  `#${Math.floor(Math.random()*16777215).toString(16)}`
);

export const omit = R.omit;

export const isMobileDevice = () => {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};

export const flatten = (arr) => R.flatten(arr);
