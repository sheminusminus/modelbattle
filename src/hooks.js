import React from 'react';

/**
 * @param {Object} options
 * @param {string} [options.search=window.location.search]
 * @param {Function} options.setTotals
 */
export const useInitTotalsHistory = (options) => {
  const { setTotals, expName } = options;

  React.useEffect(() => {
    if (expName) {
      const expKey = `totals:${expName}`;
      const savedTotals = localStorage.getItem(expKey);

      if (savedTotals) {
        const totalsObj = JSON.parse(savedTotals);
        setTotals(totalsObj);
      }
    }
  }, [expName, setTotals]);
};
