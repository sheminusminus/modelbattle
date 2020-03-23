import React from 'react';
import PT from 'prop-types';

import { withInteract } from 'hoc';

const Point = (props) => {
  const {
    color,
    drawnShapesCount,
    getRef,
    isActive,
    pointIndex,
    savedShapesCount,
    shapeIndex,
    width,
    x,
    y,
  } = props;

  return (
    <g
      data-active={String(isActive)}
      data-drawn={drawnShapesCount}
      data-point={pointIndex}
      data-saved={savedShapesCount}
      data-shape={shapeIndex}
      transform={`translate(${x},${y})`}
      ref={getRef}
    >
      <circle
        data-active={String(isActive)}
        data-drawn={drawnShapesCount}
        data-point={pointIndex}
        data-shape={shapeIndex}
        r={width / 2}
        x="0"
        y="0"
        strokeWidth="4"
        fill={isActive ? '#ff0000' : color}
        stroke={isActive ? '#ff0000' : 'transparent'}
      />
    </g>
  );
};

Point.propTypes = {
  color: PT.string,
  drawnShapesCount: PT.number.isRequired,
  getRef: PT.shape({}).isRequired,
  isActive: PT.bool,
  pointIndex: PT.number.isRequired,
  savedShapesCount: PT.number.isRequired,
  shapeIndex: PT.number.isRequired,
  width: PT.number,
  x: PT.number.isRequired,
  y: PT.number.isRequired,
};

Point.defaultProps = {
  color: '#29e',
  isActive: undefined,
  width: 10,
};

const InteractablePoint = withInteract(Point);

const DraggablePoint = (props) => {
  const {
    drawnShapesCount,
    color,
    isActive,
    onPointHeld,
    onPointMoved,
    pointIndex,
    savedShapesCount,
    shapeIndex,
    x,
    y,
  } = props;

  return (
    <InteractablePoint
      drawnShapesCount={drawnShapesCount}
      color={color}
      pointIndex={pointIndex}
      shapeIndex={shapeIndex}
      isActive={isActive}
      draggable
      onDragMove={onPointMoved}
      onHold={onPointHeld}
      savedShapesCount={savedShapesCount}
      x={x}
      y={y}
    />
  )
};

DraggablePoint.propTypes = {
  drawnShapesCount: PT.number.isRequired,
  color: PT.string,
  isActive: PT.bool,
  onPointHeld: PT.func.isRequired,
  onPointMoved: PT.func.isRequired,
  pointIndex: PT.number.isRequired,
  savedShapesCount: PT.number.isRequired,
  shapeIndex: PT.number.isRequired,
  x: PT.number.isRequired,
  y: PT.number.isRequired,
};

export default DraggablePoint;
