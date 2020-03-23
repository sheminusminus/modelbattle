import React from 'react';
import PT from 'prop-types';

import { withInteract } from 'hoc';

import Point from './Point';
import Rect from './Rect';
import Text from './Text';

const Svg = (props) => {
  const { getRef, tags, shapes, width, height } = props;

  const [drawShapes, setDrawShapes] = React.useState(shapes);
  const [activePoint, setActivePoint] = React.useState({ shape: null, point: null });

  React.useEffect(() => {
    if (shapes.length > drawShapes.length) {
      setDrawShapes((prev) => {
        return [...prev, shapes[shapes.length - 1]];
      });
    }
  }, [drawShapes.length, shapes]);

  const onPointMoved = React.useCallback((event, shapeIndex, ptIndex) => {
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

  const onPointHeld = React.useCallback((event, shapeIndex, ptIndex) => {
    setActivePoint({ shape: shapeIndex, point: ptIndex });
  }, []);

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
        const points = shapePoints.reduce((str, pt, idx) => {
          return `${str}${pt.x},${pt.y}${idx < shapePoints.length - 1 ? ' ' : ''}`;
        }, '');

        return (
          <React.Fragment key={`shape-${shapeIndex}`}>
            <Rect
              points={points}
              color={tag.color}
            />

            {shapePoints.map((pt, ptIndex) => (
              <Point
                color={tag.color}
                key={`shape-${shapeIndex}-pt-${ptIndex}`}
                onPointMoved={(event) => {
                  onPointMoved(event, shapeIndex, ptIndex);
                }}
                onPointHeld={(event) => {
                  onPointHeld(event, shapeIndex, ptIndex);
                }}
                x={pt.x}
                y={pt.y}
                dataIndex={ptIndex}
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
