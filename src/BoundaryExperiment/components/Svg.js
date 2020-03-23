import React from 'react';
import PT from 'prop-types';

import { withInteract } from 'hoc';

import Point from './Point';
import Rect from './Rect';
import Text from './Text';

/**
 * @param {Object} options
 * @param {Point[]} options.points
 * @param {number} options.stablePtIndex
 * @param {Point} options.stablePoint
 * @param {number} options.dx
 * @param {number} options.dy
 * @return {Point[]}
 */
const mapPointsOnScale = ({
  points,
  stablePtIndex,
  stablePoint,
  dx,
  dy,
}) => points.map((pt, idx) => {
  if (idx === stablePtIndex) {
    return pt;
  }

  if (pt.x === stablePoint.x) {
    return {
      x: pt.x,
      y: pt.y + dy,
    };
  }

  if (pt.y === stablePoint.y) {
    return {
      x: pt.x + dx,
      y: pt.y,
    };
  }

  return {
    x: pt.x + dx,
    y: pt.y + dy,
  };
});

/**
 * @param {Object} options
 * @param {number} options.dx
 * @param {number} options.dy
 * @param {Shape[]} options.prev
 * @param {number} options.ptIndex
 * @param {number} options.shapeIndex
 * @return {Shape[]}
 */
const getNextShapesOnScale = (options) => {
  const {
    dx,
    dy,
    prev,
    ptIndex,
    shapeIndex,
  } = options;

  const nextDrawShapes = [...prev];

  const points = prev[shapeIndex].points;
  const halfPointsCount = points.length / 2;

  let stablePtIndex = ptIndex - halfPointsCount;
  if (stablePtIndex < 0) {
    stablePtIndex = points.length + stablePtIndex;
  }

  const stablePoint = points[stablePtIndex];

  nextDrawShapes[shapeIndex].points = mapPointsOnScale({
    points,
    stablePoint,
    stablePtIndex,
    dx,
    dy,
  });

  return nextDrawShapes;
};

/**
 * @param {number} shapeIndex
 * @param {number} [ptIndex]
 * @return {string}
 */
const getChildKey = (shapeIndex, ptIndex) => {
  const key = `shape-${shapeIndex}`;
  if (ptIndex) {
    return `${key}-pt-${ptIndex}`;
  }
  return key;
};

const makeShapePointsStrAccum = (length) => (str, pt, idx) => {
  return `${str}${pt.x},${pt.y}${idx < length - 1 ? ' ' : ''}`;
};

const getDataAttributesFromTarget = (target) => {
  const dataActive = target.getAttribute('data-active');
  const dataPoint = parseInt(target.getAttribute('data-point'), 10);
  const dataShape = parseInt(target.getAttribute('data-shape'), 10);
  return {
    dataActive,
    dataPoint,
    dataShape,
  };
};

const Svg = (props) => {
  const {
    /**
     * @type {Object}
     */
    getRef,
    /**
     * @type {number}
     */
    height,
    /**
     * @type {Shape[]}
     */
    shapes,
    /**
     * @type {Object}
     */
    tags,
    /**
     * @type {number}
     */
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
      const nextDrawShapes = [...prev];
      const { x, y } = prev[shapeIndex].points[ptIndex];
      nextDrawShapes[shapeIndex].points[ptIndex] = {
        x: x + dx,
        y: y + dy,
      };
      return nextDrawShapes;
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
    if (dataActive === 'true') {
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

    onPointHeld(event, dataShape, dataPoint, dataActive === 'true');
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
                isActive={shapeIndex === activePoint.shape && ptIndex === activePoint.point}
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

Svg.propTypes = {
  getRef: PT.shape().isRequired,
  initialPoints: PT.arrayOf(PT.shape({
    x: PT.number,
    y: PT.number,
  })),
  width: PT.number,
  height: PT.number,
  shapes: PT.arrayOf(PT.shape({
    points: PT.arrayOf(PT.shape({
      x: PT.number,
      y: PT.number,
    })),
    tag: PT.string,
  })),
  tags: PT.shape(),
};

Svg.defaultProps = {
  initialPoints: undefined,
  width: 0,
  height: 0,
  shapes: [],
  tags: {},
};

const InteractableSvg = withInteract(Svg);

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
  tags: PT.shape(),
};

TappableSvg.defaultProps = {
  width: 0,
  height: 0,
  shapes: [],
  tags: {},
};

export default TappableSvg;
