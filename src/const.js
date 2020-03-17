/**
 * @enum {string}
 */
export const ExperimentMode = {
  BOUNDARY: 'boundary',
  AB: 'ab',
};

/**
 * @enum {string}
 */
export const Keys = {
  ONE: '1',
  TWO: '2',
  SKIP: 'q',
  NEXT: 'Enter',
  ESC: 'Escape',
};

/**
 * @enum {string}
 */
export const Vote = {
  A: 'a',
  B: 'b',
  NONE: 'none',
};

/**
 * @type {Keys[]}
 */
export const validKeyDownKeys = Object.values(Keys);

/**
 * @type {Keys[]}
 */
export const instantSubmitKeys = validKeyDownKeys.filter(k => k !== Keys.NEXT);
