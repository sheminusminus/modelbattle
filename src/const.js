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
  PRV: 'a',
  ADV: 'd',
  NEXT: 'Enter',
  ESC: 'Escape',
  SPC: 32,
  BACK: 'Backspace',
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

const experimentPathName = 'e';

/**
 * @type {Object.<string, string>}
 */
export const RoutePath = {
  AUTH: '/',
  EASTER_EGG: '/egg',
  EXPERIMENT_OLD: '/exp',
  EXPERIMENT: `/${experimentPathName}`,
  CHOOSE_EXPERIMENT: '/choose',
  singleExperiment: (id = ':id') => `/${experimentPathName}/${id}`,
};

/**
 * @enum {string}
 */
export const LSKey = {
  NAME: 'name',
  USER: 'u',
};

/**
 * @enum {string}
 */
export const QueryParamKey = {
  NAME: 'n',
};
