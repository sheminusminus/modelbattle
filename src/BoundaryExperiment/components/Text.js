import React from 'react';

const Text = (props) => {
  const { color, children, x, y } = props;

  return (
    <text
      x={x}
      y={y}
      style={{
        fill: color,
        stroke: color,
        strokeWidth: '1px',
        fontSize: '16px',
        userSelect: 'none',
        letterSpacing: '1px',
      }}
    >
      {children}
    </text>
  );
};

Text.defaultProps = {
  x: 0,
  y: 0,
  children: undefined,
  color: '#29e',
};

export default Text;