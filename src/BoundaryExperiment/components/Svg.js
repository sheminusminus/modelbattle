import React from 'react';
import PT from 'prop-types';

import Point from './Point';
import Rect from './Rect';
import Text from './Text';

const Svg = (props) => {
  const { tags, shapes, width, height } = props;

  const rootRef = React.useRef(null);
  const [drawShapes, setDrawShapes] = React.useState(shapes);

  const onPointMoved = (event, shapeIndex, ptIndex) => {
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
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '0',
        top: '0',
        height: `${height}px`,
        width: `${width}px`,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        id="star-demo"
        viewBox={`0 0 ${width} ${height}`}
        ref={rootRef}
        style={{ width, height }}
      >
        {drawShapes.map((shape, shapeIndex) => {
          const tag = tags[shape.tag] || {};
          const shapePoints = shape.points;
          const points = shapePoints.reduce((str, pt, idx) => {
            return `${str}${pt.x},${pt.y}${idx < shapePoints.length - 1 ? ' ' : ''}`;
          }, '');

          console.log(tag);
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
                  x={pt.x}
                  y={pt.y}
                  dataIndex={ptIndex}
                />
              ))}
              <Text
                x={shapePoints[1].x}
                y={shapePoints[1].y + 15}
                color={tag.color}
              >
                {shape.tag}
              </Text>
            </React.Fragment>
          )
        })}
      </svg>
    </div>
  );
};

Svg.propTypes = {
  initialPoints: PT.arrayOf(PT.shape({
    x: PT.number,
    y: PT.number,
  })),
  width: PT.number,
  height: PT.number,
};

Svg.defaultProps = {
  initialPoints: undefined,
  width: 0,
  height: 0,
};

export default Svg;
