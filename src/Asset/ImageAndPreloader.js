import React from 'react';

import { Image } from '../components';

const ImageAndPreloader = (props) => {
  const { assets, ...rest } = props;

  const [activeAsset, ...preloadAssets] = assets;

  return (
    <React.Fragment>
      {preloadAssets.map((asset) => (
        <div
          className="preloaded"
          style={{
            background: `url(${asset}) no-repeat -9999px -9999px`,
          }}
        />
      ))}

      {!!activeAsset && (
        <Image {...rest} url={activeAsset} />
      )}
    </React.Fragment>
  );
};

export default ImageAndPreloader;
