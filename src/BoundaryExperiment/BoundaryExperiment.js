import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { sortPoints } from 'helpers';

import * as selectors from 'selectors';

import Asset from 'Asset';

const getBoundingPoints = (locations) => {
  if (locations.length === 2) {
    const { x: x0, y: y0 } = locations[0];
    const { x: x1, y: y1 } = locations[1];
    return [{
      x: x0,
      y: y0,
    }, {
      x: x0,
      y: y1,
    }, {
      x: x1,
      y: y1,
    }, {
      x: x1,
      y: y0,
    }, {
      x: x0,
      y: y0,
    }];
  }

  return [];
};

const getBoundaryPoints = (locations) => {
  const points = getBoundingPoints(locations);
  return points.slice(0, 4);
};

function draw(ctx, locations, color = 'deepskyblue', text = '') {
  if (locations.length === 2) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.fillStyle = 'transparent';


    const drawLocations = getBoundingPoints(locations);

    ctx.beginPath();

    drawLocations.forEach((loc, idx) => {
      ctx.moveTo(loc.x, loc.y);
      const nextLoc = drawLocations[idx + 1];
      if (nextLoc) {
        ctx.lineTo(nextLoc.x, nextLoc.y);
      }
    });

    if (text) {
      ctx.font = '20px Arial';
      ctx.fillStyle = color;
      ctx.fillText(text, locations[0].x, locations[1].y + 20);
    }

    ctx.stroke();
  }
}

const BoundaryExperiment = (props) => {
  const {
    items,
    onDrawStart,
    onDrawEnd,
    onImageLoad,
    shapes: initShapes,
    tags,
  } = props;

  const canvasRef = React.useRef(null);
  const [locations, setLocations] = React.useState([]);
  const [isDraw, setIsDraw] = React.useState(false);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [shapes, setShapes] = React.useState(initShapes);

  const drawShapes = React.useCallback(() => {
    const canvas = canvasRef.current;

    if (shapes && canvas) {
      const ctx = canvas.getContext('2d');
      shapes.forEach((shape) => {
        const { points, tag, url } = shape;

        if (items[0] && url === items[0].url) {
          const itemTag = tags[tag] || {};
          const sortedPoints = sortPoints(points);
          console.log(sortedPoints);
          draw(ctx, [sortedPoints[0], sortedPoints[2]], itemTag.color, itemTag.text);
        }
      });
    }
  }, [items, shapes, tags]);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx, locations);
    }

    drawShapes();
  }, [drawShapes, isDraw, locations]);

  const handleImageLoad = React.useCallback((evt) => {
    const { width, height } = evt.target;
    setSize({ width, height });
  }, []);

  if (!items.length) {
    return null;
  }

  const handleStart = (evt) => {
    if (!isDraw) {
      const canvas = canvasRef.current;
      const { clientX, clientY } = evt;
      const bbox = canvas.getBoundingClientRect();
      const { left, top } = bbox;
      const x = clientX - left;
      const y = clientY - top;
      const loc = { x, y: y };
      const nextLocations = [loc];
      setLocations(nextLocations);

      setIsDraw(true);

      onDrawStart();
    } else {
      setIsDraw(false);
      const boundaryPoints = getBoundaryPoints(locations);
      onDrawEnd(boundaryPoints);
    }
  };

  return (
    <div
      className="boundary-exp-wrapper"
      style={{
        height: `${size.height}px`,
        width: `${size.width}px`,
      }}
    >
      <Asset
        assets={items.map((item => item.url))}
        data={{
          onLoad: (evt) => {
            handleImageLoad(evt);

            if (onImageLoad) {
              onImageLoad(evt);
            }
          },
        }}
        type="image/"
      />
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          drawShapes();
        }}
        width={size.width}
        height={size.height}
        onMouseDown={handleStart}
        onMouseMove={(evt) => {
          if (isDraw) {
            const canvas = canvasRef.current;
            const { clientX, clientY } = evt;
            const bbox = canvas.getBoundingClientRect();
            const { left, top } = bbox;
            const x = clientX - left;
            const y = clientY - top;
            const loc = { x, y: y };
            const nextLocations = [locations[0], loc];
            setLocations(nextLocations);
          }
        }}
      />
    </div>
  );
};

BoundaryExperiment.defaultProps = {
  shapes: [],
  tags: [],
};

const mapStateToProps = createStructuredSelector({
  shapes: selectors.getExperimentShapesForActiveId,
  tags: selectors.getExperimentTagsForActiveId,
});

export default connect(mapStateToProps)(BoundaryExperiment);
