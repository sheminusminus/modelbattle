import React from 'react';

import ImageAndPreloader from './ImageAndPreloader';

const Asset = (props) => {
  const { assets, data, type } = props;

  if (type) {
    if (type.includes('image/')) {
      return <ImageAndPreloader assets={assets} {...data} />;
    }
  }

  return <div />;
};

export default Asset;
