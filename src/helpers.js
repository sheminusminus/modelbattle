import * as R from 'ramda';

export const coinFlip = () => Math.floor(Math.random() * 2) === 0;

export const shuffle = (array) => array.sort(() => Math.random() - 0.5);

export const isEq = (a, b) => R.equals(a, b);

export const underscoreToCamel = (str) => {
  const matcher = /_([A-Z]|[a-z]){1}/g;
  const matches = str.matchAll(matcher);
  return matches.reduce((newStr, match) => {
    return newStr.replace(match, match.toUpperCase());
  }, str);
};
