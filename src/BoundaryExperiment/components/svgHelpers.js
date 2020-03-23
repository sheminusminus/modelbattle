import { strToBool } from 'helpers';

/**
 * @param {Object} options
 * @param {Point[]} options.points
 * @param {number} options.stablePtIndex
 * @param {Point} options.stablePoint
 * @param {number} options.dx
 * @param {number} options.dy
 * @return {Point[]}
 */
export const mapPointsOnScale = (options) => {
  const {
    dx,
    dy,
    points,
    stablePoint,
    stablePtIndex,
  } = options;

  return points.map((pt, idx) => {
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
};

/**
 * @param {GetShapesOptions} options
 * @return {Shape[]}
 */
export const getNextShapesOnScale = (options) => {
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
 * @param {GetShapesOptions} options
 * @return {Shape[]}
 */
export const getNextShapesOnPointMove = (options) => {
  const {
    dx,
    dy,
    prev,
    ptIndex,
    shapeIndex,
  } = options;

  const nextDrawShapes = [...prev];
  const { x, y } = prev[shapeIndex].points[ptIndex];
  nextDrawShapes[shapeIndex].points[ptIndex] = {
    x: x + dx,
    y: y + dy,
  };
  return nextDrawShapes;
};

/**
 * @param {number} shapeIndex
 * @param {number} [ptIndex]
 * @return {string}
 */
export const getChildKey = (shapeIndex, ptIndex) => {
  const key = `shape-${shapeIndex}`;
  if (ptIndex) {
    return `${key}-pt-${ptIndex}`;
  }
  return key;
};

/**
 * @param {number} length
 * @return {function(string, Point, number): string}
 */
export const makeShapePointsStrAccum = (length) => (str, pt, idx) => {
  return `${str}${pt.x},${pt.y}${idx < length - 1 ? ' ' : ''}`;
};

/**
 * @param {HTMLElement} target
 * @return {{ dataActive: boolean, dataPoint: number, dataShape: number }}
 */
export const getDataAttributesFromTarget = (target) => {
  const dataActive = strToBool(target.getAttribute('data-active'));
  const dataPoint = parseInt(target.getAttribute('data-point'), 10);
  const dataShape = parseInt(target.getAttribute('data-shape'), 10);
  return {
    dataActive,
    dataPoint,
    dataShape,
  };
};

/**
 * @param {number} shapeIndex
 * @param {number} ptIndex
 * @param {{ shape: ?number, point: ?number }} activePoint
 * @return {boolean}
 */
export const isPtActive = (shapeIndex, ptIndex, activePoint) => (
  shapeIndex === activePoint.shape && ptIndex === activePoint.point
);
