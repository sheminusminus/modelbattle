import React from 'react';

const Polygon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      id="star-demo"
      viewBox="0 0 400 400"
    >
      <script type="text/javascript" xlinkHref="/js/star.js" />
      <defs>
        <circle
          id="point-handle"
          r="10"
          fill="#fff"
          fillOpacity="0.4"
          stroke="#fff"
          strokeWidth="4"
        />
      </defs>
      <path
        id="star"
        fill="none"
        stroke="#29e"
        strokeLinejoin="round"
        strokeWidth="20"
        d="M260.86761704288983 219.77708763999664L297.80746598146754 334.62042786399127 200 264 102.19253401853247 334.62042786399127 139.13238295711017 219.77708763999664 41.74419568848646 148.57957213600872 162.38174385328173 148.22291236000336 200.00000000000003 33.599999999999994 237.6182561467183 148.22291236000336 358.25580431151354 148.57957213600875z"
      />
    </svg>
  );
};

Polygon.propTypes = {};

Polygon.defaultProps = {};

export default Polygon;
