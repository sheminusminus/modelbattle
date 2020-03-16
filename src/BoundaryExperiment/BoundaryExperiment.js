import React from 'react';

function draw(ctx, locations) {
  if (locations[1]) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'deepskyblue';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.clearRect(0, 0, 600, 600);

    const { x: x0, y: y0 } = locations[0];
    const { x: x1, y: y1 } = locations[1];
    const drawLocations = [{
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
    drawLocations.forEach((loc, idx) => {
      const nextLoc = drawLocations[idx + 1];
      if (nextLoc) {
        ctx.lineTo(nextLoc.x, nextLoc.y);
      }
    });
    ctx.stroke();
  }
}

const BoundaryExperiment = () => {
  const canvasRef = React.useRef(null);
  const [locations, setLocations] = React.useState([]);

  const [isDraw, setIsDraw] = React.useState(false);

  React.useEffect(() => {
    if (isDraw) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      draw(ctx, locations);
    }
  }, [isDraw, locations]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      onClick={evt => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { clientX, clientY } = evt;
        const bbox = canvas.getBoundingClientRect();
        const { left, top } = bbox;
        const x = clientX - left;
        const y = clientY - top;
        const loc = { x, y: y };
        const nextLocations = [...locations, loc];
        setLocations(nextLocations);

        if (!isDraw) {
          setIsDraw(true);
        }
      }}
    />
  );
};

export default BoundaryExperiment;
