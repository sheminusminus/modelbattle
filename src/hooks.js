import React from 'react';
import qs from "query-string";

/**
 * @param {Object} options
 * @param {string} [options.search=window.location.search]
 * @param {Function} options.setTotals
 */
export const useInitTotalsHistory = (options) => {
  const { setTotals, search = window.location.search } = options;

  React.useEffect(() => {
    const { n: expName } = qs.parse(search);

    const expKey = `totals:${expName}`;
    const savedTotals = localStorage.getItem(expKey);

    if (savedTotals) {
      const totalsObj = JSON.parse(savedTotals);
      setTotals(totalsObj);
    }
  }, [search, setTotals]);
};

/**
 * @param {Object} options
 * @param {?string} [options.name]
 * @param {Function} options.setName
 */
export const useInitExperimentName = (options = {}) => {
  const { name, setName } = options;

  React.useEffect(() => {
    const prevName = localStorage.getItem('name');

    if (!name) {
      const { n } = qs.parse(window.location.search);

      if (n) {
        localStorage.setItem('name', n.replace('?', ''));
        setName(n);
      } else if (prevName) {
        setName(n);
      } else {
        localStorage.setItem('name', '');
        setName('');
      }
    }
  }, [name, setName]);
};
