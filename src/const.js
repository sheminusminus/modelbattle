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
const tagsPathName = 'tags';

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
  singleExperimentTags: (id = ':id') => `/${experimentPathName}/${id}/${tagsPathName}`,
  singleExperimentTagsImage: (id = ':id', imageUrl = ':imageUrl') => (
    `/${experimentPathName}/${id}/${tagsPathName}/${imageUrl}`
  ),
};

/**
 * @enum {string}
 */
export const LSKey = {
  ATTEMPTED_URL: 'attempted_url',
  NAME: 'name',
  USER: 'u',
};

/**
 * @enum {string}
 */
export const QueryParamKey = {
  NAME: 'n',
};
