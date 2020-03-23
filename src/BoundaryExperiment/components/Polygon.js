import React from 'react';

import { withInteract } from 'hoc';

const Point = (props) => {
  const { getRef, x, y, dataIndex, width } = props;

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
        fill="#29e"
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
};

const ReactablePoint = withInteract(Point);

const DraggablePoint = ({ dataIndex, x, y, onPointMoved }) => {
  const [coordinate, setCoordinate] = React.useState({ x, y });

  return (
    <ReactablePoint
      dataIndex={dataIndex}
      draggable
      onDragMove={(event) => {
        const { dx, dy } = event;
        setCoordinate(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        onPointMoved(event);
      }}
      x={coordinate.x}
      y={coordinate.y}
    />
  )
};

const Polygon = (props) => {
  const { width, height, initialPoints } = props;

  /**
   *
   * @type {React.MutableRefObject<SVGPolygonElement>}
   */
  const starRef = React.useRef(null);
  /**
   *
   * @type {React.MutableRefObject<SVGElement>}
   */
  const rootRef = React.useRef(null);
  const [rectPoints, setRectPoints] = React.useState([]);
  const [points, setPoints] = React.useState([]);

  React.useEffect(() => {
    const star = starRef.current;

    if (star) {
      const nextPoints = [];
      for (let i = 0, len = star.points.numberOfItems; i < len; i++) {
        const point = star.points.getItem(i);
        const circle = {
          x: point.x,
          y: point.y,
          dataIndex: i,
        };
        nextPoints.push(circle);
      }
      setPoints(nextPoints);
      setRectPoints([...nextPoints]);
    }
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        left: '8px',
        top: '8px',
        border: "1px solid black",
        boxSizing: "border-box",
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
        <polygon
          ref={starRef}
          id="star"
          stroke="#29e"
          strokeWidth="6"
          strokeLinejoin="round"
          fill="none"
          points={
            rectPoints.length
              ? rectPoints.reduce((str, pt, idx) => {
                  return `${str}${pt.x},${pt.y}${idx < rectPoints.length - 1 ? ' ' : ''}`;
                }, '')
              : initialPoints
          }
        />
        {points.map((pt, idx) => (
          <DraggablePoint
            dataIndex={pt.dataIndex}
            dataX={pt.x}
            dataY={pt.y}
            key={`point-${pt.dataIndex}`}
            x={pt.x}
            y={pt.y}
            onPointMoved={(event) => {
              const { target } = event;
              const index = parseInt(target.getAttribute('data-index'), 10);
              const xform = target.transform.animVal[0].matrix;
              const x = xform.e;
              const y = xform.f;
              const nextPoints = [...rectPoints];
              nextPoints[index] = { x, y, dataIndex: pt.dataIndex };
              setRectPoints((prev) => {
                const nextPoints = [...prev];
                nextPoints[index] = { x, y, dataIndex: pt.dataIndex };
                return nextPoints;
              });
            }}
          />
        ))}
      </svg>
    </div>
  );
};

Polygon.defaultProps = {
  x: 0,
  y: 0,
  width: 150,
  height: 150,
  angle: 0,
  initialPoints: '10,10 10,130 130,130 130,10',
};

const Draggable = () => {
  const [coordinate, setCoordinate] = React.useState({ x: 0, y: 0 });

  return (
    <Polygon />
  )
};

export default Draggable;
