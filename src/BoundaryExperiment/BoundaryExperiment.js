import React from 'react';

function draw(ctx, locations) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'deepskyblue';
  ctx.shadowBlur = 20;
  ctx.lineWidth = 4;
  ctx.clearRect(0, 0, 600, 600);
  locations.forEach((loc, idx) => {
    ctx.moveTo(loc.x, loc.y);
    const nextLoc = locations[idx + 1];
    if (nextLoc) {
      ctx.lineTo(nextLoc.x, nextLoc.y);
      ctx.stroke();
    }
  });
}

const BoundaryExperiment = () => {
  const canvasRef = React.useRef(null);
  const [locations, setLocations] = React.useState([]);

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
        console.log(nextLocations);
        draw(ctx, nextLocations);
      }}
    />
  );
};

export default BoundaryExperiment;
