import React from 'react';

const Rect = React.forwardRef((props, ref) => {
  const { color, initialPoints, points } = props;

  return (
    <polygon
      ref={ref}
      id="star"
      stroke={color}
      strokeWidth="6"
      strokeLinejoin="round"
      fill="none"
      points={points.length ? points : initialPoints}
    />
  );
});

Rect.defaultProps = {
  x: 0,
  y: 0,
  width: 150,
  height: 150,
  angle: 0,
  color: '#29e',
  initialPoints: '10,10 10,130 130,130 130,10',
};

export default Rect;

