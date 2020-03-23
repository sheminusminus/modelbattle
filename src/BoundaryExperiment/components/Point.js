import React from 'react';

import { withInteract } from 'hoc';

const Point = (props) => {
  const { color, getRef, x, y, dataIndex, width } = props;

  return (
    <g
      data-index={dataIndex}
      transform={`translate(${x},${y})`}
      ref={getRef}
    >
      <circle
        r={width / 2}
        x="0"
        y="0"
        strokeWidth="2"
        fill={color}
        stroke="#fff"
      />
    </g>
  );
};

Point.defaultProps = {
  x: 0,
  y: 0,
  width: 8,
  height: 8,
  angle: 0,
  color: '#29e',
};

const InteractablePoint = withInteract(Point);

const DraggablePoint = ({ color, dataIndex, x, y, onPointMoved }) => {
  return (
    <InteractablePoint
      color={color}
      dataIndex={dataIndex}
      draggable
      onDragMove={onPointMoved}
      x={x}
      y={y}
    />
  )
};

export default DraggablePoint;
