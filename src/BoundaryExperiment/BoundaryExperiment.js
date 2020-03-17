import React from 'react';

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

function draw(ctx, locations) {
  if (locations.length === 2) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'deepskyblue';
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

    ctx.stroke();
  }
}

const BoundaryExperiment = (props) => {
  const { items, onDrawStart, onDrawEnd, onImageLoad } = props;

  const canvasRef = React.useRef(null);
  const [locations, setLocations] = React.useState([]);
  const [isDraw, setIsDraw] = React.useState(false);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    if (isDraw) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx, locations);
    }
  }, [isDraw, locations]);

  const handleImageLoad = React.useCallback((evt) => {
    const { width, height } = evt.target;
    setSize({ width, height });
  }, []);

  if (!items.length) {
    return null;
  }

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
        ref={canvasRef}
        width={size.width}
        height={size.height}
        onClick={(evt) => {
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
        }}
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

export default BoundaryExperiment;
