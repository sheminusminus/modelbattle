import React from 'react';
import PT from 'prop-types';

import { withInteract } from 'hoc';

const Point = (props) => {
  const { color, isActive, getRef, x, y, pointIndex, shapeIndex, width } = props;

  return (
    <g
      data-active={String(isActive)}
      data-point={pointIndex}
      data-shape={shapeIndex}
      transform={`translate(${x},${y})`}
      ref={getRef}
    >
      <circle
        data-active={String(isActive)}
        data-point={pointIndex}
        data-shape={shapeIndex}
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

const DraggablePoint = (props) => {
  const { color, isActive, pointIndex, shapeIndex, x, y, onPointMoved, onPointHeld } = props;

  return (
    <InteractablePoint
      color={color}
      pointIndex={pointIndex}
      shapeIndex={shapeIndex}
      isActive={isActive}
      draggable
      onDragMove={onPointMoved}
      onHold={onPointHeld}
      x={x}
      y={y}
    />
  )
};

DraggablePoint.propTypes = {
  color: PT.string,
  isActive: PT.bool,
  pointIndex: PT.number.isRequired,
  shapeIndex: PT.number.isRequired,
  x: PT.number.isRequired,
  y: PT.number.isRequired,
  onPointMoved: PT.func.isRequired,
  onPointHeld: PT.func.isRequired,
};

export default DraggablePoint;
