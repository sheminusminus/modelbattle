import * as R from 'ramda';
import * as changeCase from 'change-case';
import qs from 'query-string';

import { RoutePath } from 'const';

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

export const groupByPublic = (arr) => {
  const byPublic = R.groupBy(function(experiment) {
    return experiment.public ? 'pub' : 'priv';
  });
  return byPublic(arr);
};

export const createDownloadFile = (filename, text) => {
  const element = document.createElement('a');

  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

export const expNameFromUrlParam = (location = window.location) => {
  const { pathname } = location;

  const testRegex = new RegExp(`^${RoutePath.EXPERIMENT}/`);

  if (testRegex.test(pathname)) {
    /* eslint-disable-next-line no-unused-vars */
    const [_, __, experimentName] = pathname.split('/');
    return experimentName;
  }

  return undefined;
};

export const isOldExpUrl = (location = window.location) => {
  const expRegex = new RegExp(`^${RoutePath.EXPERIMENT_OLD}`);
  return expRegex.test(location.pathname);
};

export const getImagePathSegmentFromUrl = (location = window.location) => {
  const experimentName = expNameFromUrlParam(location);
  if (experimentName) {
    const { pathname, search } = location;
    /* eslint-disable-next-line no-unused-vars */
    const [_, __, $, $$, ...imageUrlElements] = pathname.split('/');
    return imageUrlElements.join('/').concat(search);
  }
  return undefined;
};

export const lsSet = (k, v) => localStorage.setItem(k, v);
export const lsGet = (k) => localStorage.getItem(k);
export const lsGetParse = (k) => JSON.parse(lsGet(k));
export const lsRemove = (k) => localStorage.removeItem(k);

export const getQueryParams = (location = window.location) => {
  return qs.parse(location.search);
};

export const getQueryParam = (key, location = window.location) => {
  const params = getQueryParams(location);
  return params[key];
};
