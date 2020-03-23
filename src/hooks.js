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

export const usePrevious = (value, defaultValue) => {
  // the ref object is a generic container whose current property is mutable,
  // and can hold any value, similar to an instance property on a class
  const ref = React.useRef(defaultValue);

  // store current value in ref, as a side-effect
  // (to *only* re-run when value changes, we could pass `[value]` as the second arg)
  React.useEffect(() => {
    ref.current = value;
  });

  // return previous value (happens before update in useEffect above)
  return ref.current;
};
