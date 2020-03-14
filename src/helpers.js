import * as R from 'ramda';

export const coinFlip = () => Math.floor(Math.random() * 2) === 0;

export const shuffle = (array) => array.sort(() => Math.random() - 0.5);

export const isEq = (a, b) => R.equals(a, b);
