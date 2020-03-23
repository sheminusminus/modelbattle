import React from 'react';
import PT from 'prop-types';

import { withInteract } from 'hoc';

const Point = (props) => {
  const {
    color,
    getRef,
    isActive,
    pointIndex,
    shapeIndex,
    width,
    x,
    y,
  } = props;

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

Point.propTypes = {
  color: PT.string,
  getRef: PT.shape({}).isRequired,
  isActive: PT.bool,
  pointIndex: PT.number.isRequired,
  shapeIndex: PT.number.isRequired,
  width: PT.number,
  x: PT.number.isRequired,
  y: PT.number.isRequired,
};

Point.defaultProps = {
  color: '#29e',
  isActive: undefined,
  width: 8,
};

const InteractablePoint = withInteract(Point);

const DraggablePoint = (props) => {
  const {
    color,
    isActive,
    onPointHeld,
    onPointMoved,
    pointIndex,
    shapeIndex,
    x,
    y,
  } = props;

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
  onPointHeld: PT.func.isRequired,
  onPointMoved: PT.func.isRequired,
  pointIndex: PT.number.isRequired,
  shapeIndex: PT.number.isRequired,
  x: PT.number.isRequired,
  y: PT.number.isRequired,
};

export default DraggablePoint;
