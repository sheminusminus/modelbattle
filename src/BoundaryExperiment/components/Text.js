import React from 'react';
import PT from 'prop-types';

const Text = (props) => {
  const {
    children,
    color,
    x,
    y,
  } = props;

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

Text.propTypes = {
  children: PT.node,
  color: PT.string,
  x: PT.number,
  y: PT.number,
};

Text.defaultProps = {
  children: undefined,
  color: '#29e',
  x: 0,
  y: 0,
};

export default Text;
