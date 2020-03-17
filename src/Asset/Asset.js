import React from 'react';

import ImageAndPreloader from './ImageAndPreloader';

const Asset = (props) => {
  const { assets, data, shouldPreload, type } = props;

  if (type) {
    if (type.includes('image/')) {
      return <ImageAndPreloader assets={assets} shouldPreload={shouldPreload} {...data} />;
    }
  }

  return <div />;
};

export default Asset;
