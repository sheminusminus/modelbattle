import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Keys } from 'const';

import { isMobileDevice, sortPoints } from 'helpers';

import { addNewTag } from 'services/firebase';

import * as selectors from 'selectors'

import { refreshExperimentTags } from 'types';

import Asset from 'Asset';
import { Input } from '../components';

const isMobile = isMobileDevice();

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
  return points.length ? points.slice(0, 4) : [];
};

const getClientXY = (evt) => {
  let clientX;
  let clientY;

  if (isMobile) {
    const touch = evt.touches[0];
    if (touch) {
      clientX = touch.clientX;
      clientY = touch.clientY;
    }
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }

  return { clientX, clientY };
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
    experimentId,
    items,
    onDrawEnd,
    onDrawStart,
    onImageLoad,
    onRefreshTags,
    shapes: initShapes,
    tags,
  } = props;

  /**
   * @type {React.MutableRefObject<HTMLCanvasElement>}
   */
  const canvasRef = React.useRef(null);
  /**
   * @type {React.MutableRefObject<HTMLInputElement>}
   */
  const inputRef = React.useRef(null);
  const [locations, setLocations] = React.useState([]);
  const [isDraw, setIsDraw] = React.useState(false);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [shapes, setShapes] = React.useState(initShapes);
  const [showInput, setShowInput] = React.useState(false);
  const [inputVal, setInputVal] = React.useState(undefined);
  const [lastTag, setLastTag] = React.useState('');

  const drawShapes = React.useCallback(() => {
    const canvas = canvasRef.current;

    if (shapes && canvas) {
      const ctx = canvas.getContext('2d');
      shapes.forEach((shape) => {
        const { points, tag, url } = shape;

        if (items[0] && url === items[0].url) {
          const itemTag = tags[tag] || {};
          const sortedPoints = sortPoints(points);
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

  const handleCancelLastBox = React.useCallback(() => {
    const nextShapes = shapes.slice(0, shapes.length - 1);
    setShapes(nextShapes);
    setLocations([]);
    setShowInput(false);
  }, [shapes]);

  const handleKeyDown = React.useCallback((evt) => {
    const { key } = evt;
    if (key === Keys.ESC) {
      evt.preventDefault();
      evt.stopPropagation();
      handleCancelLastBox();
      setInputVal(undefined);
    }
  }, [handleCancelLastBox]);

  React.useEffect(() => {
    if (showInput) {
      window.addEventListener('keydown', handleKeyDown);
      if (document.activeElement !== inputRef.current && inputRef.current) {
        inputRef.current.select();
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, showInput]);

  const handleImageLoad = React.useCallback((evt) => {
    const { width, height } = evt.target;
    setSize({ width, height });
  }, []);

  const handleInputChange = React.useCallback((evt) => {
    const { value } = evt.target;
    const formatted = value
      .toLowerCase()
      .replace(/\s/g, '_')
      .replace(/\.|\$|\[|\]|\//g, '');
    setInputVal(formatted);
  }, []);

  const handleMove = React.useCallback((evt) => {
    if (isDraw) {
      const canvas = canvasRef.current;

      const { clientX, clientY } = getClientXY(evt);

      if (clientX && clientY) {
        const bbox = canvas.getBoundingClientRect();
        const { left, top } = bbox;
        const x = clientX - left;
        const y = clientY - top;
        const loc = { x, y: y };
        const nextLocations = [locations[0], loc];
        setLocations(nextLocations);
      }
    }
  }, [isDraw, locations]);

  if (!items.length) {
    return null;
  }

  const handleInputEnter = async () => {
    const val = inputVal || lastTag;

    if (val) {
      const tagKey = await addNewTag(experimentId, val);
      const shapeData = shapes[shapes.length - 1];
      shapeData.tag = tagKey;
      setLastTag(tagKey);
      const nextShapes = [...shapes, shapeData];
      setShapes(nextShapes);
      setLocations([]);
      setShowInput(false);
      setInputVal(undefined);
      onDrawEnd(nextShapes);
      onRefreshTags();
    }
  };

  const handleStart = (evt) => {
    if (showInput) {
      handleInputEnter();
      return;
    }

    if (!isDraw) {
      const canvas = canvasRef.current;
      const { clientX, clientY } = getClientXY(evt);
      if (clientX && clientY) {
        const bbox = canvas.getBoundingClientRect();
        const { left, top } = bbox;
        const x = clientX - left;
        const y = clientY - top;
        const loc = { x, y: y };
        const nextLocations = [loc];
        setLocations(nextLocations);

        setIsDraw(true);

        onDrawStart();
      }
    } else {
      const canvas = canvasRef.current;
      setIsDraw(false);
      const boundaryPoints = getBoundaryPoints(locations);
      const shapeData = {
        url: items[0].url,
        points: boundaryPoints,
        size: {
          width: canvas.width,
          height: canvas.height,
        },
        tag: '',
      };
      const nextShapes = [...shapes, shapeData];
      setShapes(nextShapes);
      // setLocations([]);
      setShowInput(true);
      // onDrawEnd(boundaryPoints);
    }
  };

  const lastShape = shapes[shapes.length - 1];
  const sortedPoints = lastShape ? sortPoints(lastShape.points) : [];

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
        shouldPreload={false}
        type="image/"
      />
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          drawShapes();
        }}
        width={size.width}
        height={size.height}
        onMouseDown={isMobile ? undefined : handleStart}
        onMouseMove={isMobile ? undefined : handleMove}
        onTouchStart={isMobile ? handleStart : undefined}
        onTouchMove={isMobile ? handleMove : undefined}
      />

      {showInput && (
        <button
          className="close-x"
          onClick={(evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            handleCancelLastBox();
          }}
          style={{
            left: sortedPoints[0].x - 3,
            top: sortedPoints[0].y - 20,
          }}
          type="button"
        >
          x
        </button>
      )}

      {showInput && (
        <Input
          autoFocus={true}
          onChange={handleInputChange}
          onKeyDown={async (evt) => {
            console.log(evt.key);
            const { key } = evt;
            if (key === Keys.NEXT) {
              await handleInputEnter();
            } else if (key === Keys.BACK && inputVal === undefined) {
              setInputVal('');
            }
          }}
          ref={inputRef}
          value={inputVal !== undefined ? inputVal : lastTag}
          wrapperStyle={{
            left: sortedPoints[1].x,
            width: Math.abs(sortedPoints[1].x - sortedPoints[2].x),
            top: sortedPoints[1].y - 3,
          }}
        />
      )}
    </div>
  );
};

BoundaryExperiment.defaultProps = {
  shapes: [],
  tags: [],
};

const mapStateToProps = createStructuredSelector({
  experimentId: selectors.getExperimentsActiveId,
  shapes: selectors.getExperimentShapesForActiveId,
  tags: selectors.getExperimentTagsForActiveId,
});

const mapDispatchToProps = {
  onRefreshTags: refreshExperimentTags.trigger,
};

export default connect(mapStateToProps, mapDispatchToProps)(BoundaryExperiment);
