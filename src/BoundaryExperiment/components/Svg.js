import React from 'react';
import PT from 'prop-types';

import { withInteract } from 'hoc';

import Point from './Point';
import Rect from './Rect';
import Text from './Text';

import {
  makeShapePointsStrAccum,
  getChildKey,
  getDataAttributesFromTarget,
  getNextShapesOnPointMove,
  getNextShapesOnScale,
  isPtActive,
} from './svgHelpers';

/**
 * @param {Object} props
 * @param {Object} props.getRef
 * @param {number} props.height
 * @param {Shape[]} props.shapes
 * @param {Object} props.tags
 * @param {number} props.number
 * @return {*}
 * @constructor
 */
const BaseSvg = (props) => {
  const {
    getRef,
    height,
    shapes,
    tags,
    width,
  } = props;

  const [drawShapes, setDrawShapes] = React.useState(shapes);
  const [activePoint, setActivePoint] = React.useState({ shape: null, point: null });

  React.useEffect(() => {
    if (shapes.length > drawShapes.length) {
      setDrawShapes((prev) => {
        return [...prev, shapes[shapes.length - 1]];
      });
    }
  }, [drawShapes.length, shapes]);

  const onSinglePointMoved = React.useCallback((event, shapeIndex, ptIndex) => {
    const { dx, dy } = event;

    setDrawShapes((prev) => {
      return getNextShapesOnPointMove({
        dx,
        dy,
        prev,
        ptIndex,
        shapeIndex,
      });
    });
  }, []);

  const onRectScaled = React.useCallback((event, shapeIndex, ptIndex) => {
    const { dx, dy } = event;

    setDrawShapes((prev) => {
      return getNextShapesOnScale({
        dx,
        dy,
        prev,
        ptIndex,
        shapeIndex,
      });
    });
  }, []);

  const pointMoveHandler = React.useCallback((event) => {
    const {
      dataActive,
      dataPoint,
      dataShape,
    } = getDataAttributesFromTarget(event.target);
    if (dataActive) {
      onSinglePointMoved(event, dataShape, dataPoint);
    } else {
      onRectScaled(event, dataShape, dataPoint);
    }
  }, [onRectScaled, onSinglePointMoved]);

  const onPointHeld = React.useCallback((event, shapeIndex, ptIndex, isActive) => {
    if (isActive) {
      setActivePoint({ shape: null, point: null });
    } else {
      setActivePoint({ shape: shapeIndex, point: ptIndex });
    }
  }, []);

  const pointHeldHandler = React.useCallback((event) => {
    const {
      dataActive,
      dataPoint,
      dataShape,
    } = getDataAttributesFromTarget(event.target);

    onPointHeld(event, dataShape, dataPoint, dataActive);
  }, [onPointHeld]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${width} ${height}`}
      style={{ width, height }}
      ref={getRef}
    >
      {drawShapes.map((shape, shapeIndex) => {
        const tag = tags[shape.tag] || {};
        const shapePoints = shape.points;
        const reducer = makeShapePointsStrAccum(shapePoints.length);
        const points = shapePoints.reduce(reducer, '');

        return (
          <React.Fragment key={getChildKey(shapeIndex)}>
            <Rect points={points} color={tag.color} />

            {shapePoints.map((pt, ptIndex) => (
              <Point
                color={tag.color}
                key={getChildKey(shapeIndex, ptIndex)}
                onPointMoved={pointMoveHandler}
                onPointHeld={pointHeldHandler}
                x={pt.x}
                y={pt.y}
                pointIndex={ptIndex}
                shapeIndex={shapeIndex}
                isActive={isPtActive(shapeIndex, ptIndex, activePoint)}
              />
            ))}

            {!!tag.text && (
              <Text
                x={shapePoints[1].x}
                y={shapePoints[1].y + 20}
                color={tag.color}
              >
                {tag.text}
              </Text>
            )}
          </React.Fragment>
        )
      })}
    </svg>
  );
};

BaseSvg.propTypes = {
  getRef: PT.shape({}).isRequired,
  height: PT.number,
  initialPoints: PT.arrayOf(PT.shape({
    x: PT.number,
    y: PT.number,
  })),
  shapes: PT.arrayOf(PT.shape({
    points: PT.arrayOf(PT.shape({
      x: PT.number,
      y: PT.number,
    })),
    tag: PT.string,
  })),
  tags: PT.shape({}),
  width: PT.number,
};

BaseSvg.defaultProps = {
  height: 0,
  initialPoints: undefined,
  shapes: [],
  tags: {},
  width: 0,
};

const InteractableSvg = withInteract(BaseSvg);

const TappableSvg = (props) => {
  const {
    onDoubleTap,
    initialPoints,
    width,
    height,
    shapes,
    tags,
  } = props;

  return (
    <InteractableSvg
      gesturable
      onDoubleTap={onDoubleTap}
      width={width}
      height={height}
      initialPoints={initialPoints}
      shapes={shapes}
      tags={tags}
    />
  );
};

TappableSvg.propTypes = {
  onDoubleTap: PT.func.isRequired,
  width: PT.number,
  height: PT.number,
  shapes: PT.arrayOf(PT.shape({
    points: PT.arrayOf(PT.shape({
      x: PT.number,
      y: PT.number,
    })),
    tag: PT.string,
  })),
  tags: PT.shape({}),
};

TappableSvg.defaultProps = {
  width: 0,
  height: 0,
  shapes: [],
  tags: {},
};

export { BaseSvg };
export default TappableSvg;
