import React from 'react';

import { Image } from '../components';

const ImageAndPreloader = React.forwardRef((props, ref) => {
  const { assets, shouldPreload, ...rest } = props;

  const [activeAsset, ...preloadAssets] = assets;

  return (
    <React.Fragment>
      {shouldPreload === true && preloadAssets.map((asset) => (
        <div
          className="preloaded"
          key={asset}
          style={{
            background: `url(${asset}) no-repeat -9999px -9999px`,
          }}
        />
      ))}

      {!!activeAsset && (
        <Image {...rest} ref={ref} url={activeAsset} />
      )}
    </React.Fragment>
  );
});

export default ImageAndPreloader;
