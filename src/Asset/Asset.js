import React from 'react';

import ImageAndPreloader from './ImageAndPreloader';

const Asset = React.forwardRef((props, ref) => {
  const { assets, data, shouldPreload, type } = props;

  if (type) {
    if (type.includes('image/')) {
      return <ImageAndPreloader ref={ref} assets={assets} shouldPreload={shouldPreload} {...data} />;
    }
  }

  return <div />;
});

export default Asset;
