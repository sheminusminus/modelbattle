import React from 'react';

import { withInteract } from 'hoc';

const Point = (props) => {
  const { color, isActive, getRef, x, y, dataIndex, width } = props;

  return (
    <g
      data-index={dataIndex}
      transform={`translate(${x},${y})`}
      ref={getRef}
    >
      <circle
        data-point={dataIndex}
        r={width / 2}
        x="0"
        y="0"
        strokeWidth="2"
        fill={isActive ? '#ff0000' : color}
        stroke={isActive ? '#ff0000' : '#fff'}
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

const DraggablePoint = ({ color, isActive, dataIndex, x, y, onPointMoved, onPointHeld }) => {
  return (
    <InteractablePoint
      color={color}
      dataIndex={dataIndex}
      isActive={isActive}
      draggable
      onDragMove={onPointMoved}
      onHold={onPointHeld}
      x={x}
      y={y}
    />
  )
};

export default DraggablePoint;
