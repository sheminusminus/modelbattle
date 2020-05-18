import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Keys } from 'const';

import { isMobileDevice, sortPoints } from 'helpers';

import { addNewTag, getUID } from 'services/firebase';

import * as selectors from 'selectors'

import { refreshExperimentTags, exportBoundaryExperiment } from 'types';

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

const underline = (ctx, text, x, y) => {
  let metrics = ctx.measureText(text);
  let fontSize = Math.floor(metrics.actualHeight * 1.4); // 140% the height
  switch (ctx.textAlign) {
    case "center" : x -= (metrics.width / 2) ; break;
    case "right"  : x -= metrics.width       ; break;
    default: break;
  }
  switch (ctx.textBaseline) {
    case "top"    : y += (fontSize)     ; break;
    case "middle" : y += (fontSize / 2) ; break;
    default: break;
  }
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = Math.ceil(fontSize * 0.08);
  ctx.moveTo(x, y);
  ctx.lineTo(x + metrics.width, y);
  ctx.stroke();
  ctx.restore();
};

function draw(ctx, locations, color = 'deepskyblue', text = '', textStyle = '') {
  if (locations.length > 0) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 1.3;
    ctx.fillStyle = 'transparent';

    if (locations.length === 1) {
      const { x, y } = locations[0];
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;

      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

    } else {
      ctx.beginPath();

      const drawLocations = getBoundingPoints(locations);

      drawLocations.forEach((loc, idx) => {
        ctx.moveTo(loc.x, loc.y);
        const nextLoc = drawLocations[idx + 1];
        if (nextLoc) {
          ctx.lineTo(nextLoc.x, nextLoc.y);
        }
      });

      ctx.stroke();
    }

    if (text) {
      // https://stackoverflow.com/questions/13627111/drawing-text-with-an-outer-stroke-with-html5s-canvas
      const drawStroked = (ctx, text, x, y, color, textStyle='', bgColor='black', lineWidth=3, font='14px Verdana, Geneva, sans-serif', textDecoration='none') => {
        if (textStyle) {
          ctx.font = textStyle + ' ' + font;
        } else {
          ctx.font = font;
        }
        // This breaks on Windows!
        //const metrics = ctx.measureText(text);
        //var y0 = Math.max(0, Math.min(y, ctx.canvas.height - Math.abs(metrics.fontBoundingBoxDescent)));
        //var x0 = Math.max(0, Math.min(x, ctx.canvas.width - metrics.width - 2));
        // This works.
        const y0 = Math.max(0, Math.min(y, ctx.canvas.height));
        const x0 = Math.max(0, Math.min(x, ctx.canvas.width - 80));
        const u = 0.7;
        ctx.globalAlpha = 0.7 * u;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth + 1;
        ctx.strokeText(text, x0, y0);
        if (textDecoration === 'underline') {
          underline(ctx, text, x0, y0);
        }
        ctx.globalAlpha = 0.9 * u;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = lineWidth - 1;
        ctx.strokeText(text, x0, y0);
        if (textDecoration === 'underline') {
          underline(ctx, text, x0, y0);
        }
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.fillText(text, x0, y0);
        if (textDecoration === 'underline') {
          underline(ctx, text, x0, y0);
        }
      };
      drawStroked(ctx, text, locations[0].x, locations[1].y + 14, color, textStyle);
    }
  }
}

const BoundaryExperiment = (props) => {
  const {
    experimentId,
    items,
    onDrawEnd,
    onDrawStart,
    onExportBoundaryExperiment,
    onImageLoad,
    onRefreshTags,
    onSubmit,
    shapes = [],
    tags,
    defaultTag,
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
  const [crosshair, setCrosshair] = React.useState([]);
  const [isDraw, setIsDraw] = React.useState(false);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [drawnShapes, setDrawnShapes] = React.useState([]);
  const [showInput, setShowInput] = React.useState(false);
  const [inputVal, setInputVal] = React.useState(undefined);
  const [lastTag, setLastTag] = React.useState(defaultTag || '');

  const drawShapes = React.useCallback(() => {
    const canvas = canvasRef.current;

    if (shapes && canvas) {
      const ctx = canvas.getContext('2d');
      [...shapes, ...drawnShapes].forEach((shape) => {
        const { points, tag, url, user } = shape;
        const uid = getUID();

        if (items[0] && url === items[0].url) {
          const itemTag = tags[tag] || {text: tag};
          const sortedPoints = sortPoints(points);
          const textStyle = (uid === user) ? 'italic' : '';
          draw(ctx, [sortedPoints[0], sortedPoints[2]], itemTag.color, itemTag.text, textStyle);
        }
      });
    }
  }, [drawnShapes, items, shapes, tags]);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (locations.length > 0) {
        draw(ctx, locations);
      }
      if (crosshair.length > 0 && !showInput) {
        draw(ctx, crosshair);
      }
    }

    drawShapes();
  }, [drawShapes, isDraw, locations, crosshair, showInput]);

  const handleCancelLastBox = React.useCallback(() => {
    const nextShapes = drawnShapes.slice(0, drawnShapes.length - 1);
    setDrawnShapes(nextShapes);
    setLocations([]);
    setCrosshair([]);
    setShowInput(false);
  }, [drawnShapes]);

  const handleInputEnter = React.useCallback(async () => {
    const val = inputVal || lastTag;
    window.lastTag = val;

    if (val) {
      const tagKey = await addNewTag(experimentId, val);
      const lastIdx = drawnShapes.length - 1;
      const shapeData = drawnShapes[lastIdx];
      shapeData.tag = tagKey;
      shapeData.user = getUID();
      setLastTag(tagKey);
      const nextShapes = [...drawnShapes.slice(0, lastIdx), shapeData];
      setDrawnShapes(nextShapes);
      setLocations([]);
      setCrosshair([]);
      setShowInput(false);
      setInputVal(undefined);
      onDrawEnd(nextShapes);
      onRefreshTags();
    }
  }, [drawnShapes, experimentId, inputVal, lastTag, onDrawEnd, onRefreshTags]);

  const handleKeyDown = React.useCallback((evt) => {
    const { key, which } = evt;
    const windowHeight = window.innerHeight || document.clientHeight || document.body.clientHeight;
    const windowWidth = window.innerWidth || document.clientWidth || document.body.clientWidth;
    const scrollEl = document.scrollingElement || document.body;
    const scrolledRight = scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth;
    const scrolledLeft = scrollEl.scrollLeft <= 0;
    const prevScrolledRight = window.prevScrolledRight != null ? window.prevScrolledRight : scrolledRight;
    const prevScrolledLeft = window.prevScrolledLeft != null ? window.prevScrolledLeft : scrolledLeft;
    window.prevScrolledRight = scrolledRight;
    window.prevScrolledLeft = scrolledLeft;
    console.log('keyDown', key, which);
    if (key === Keys.ESC && showInput) {
      evt.preventDefault();
      evt.stopPropagation();
      handleCancelLastBox();
      setInputVal(undefined);
    } else if (which === Keys.SPC && !showInput) {
      const playa = document.getElementById("playa");
      if (playa) {
        if (playa.paused) {
          playa.play();
        } else {
          playa.pause();
        }
        evt.preventDefault();
        evt.stopPropagation();
      }
    } else if (key === 'v' && !showInput) {
      const url = (items[0] || {}).url;
      if (url) {
        window.open(url, '_blank')
      }
    } else if (key === 'z' && !showInput) {
      // undo
      doUndo();
    } else if (key === '1') {
      // next video or gif
      const exts = '.gif .mp4 .webm .mpg .mpeg .wmv'.split(' ');
      window.advanceBy = exts;
      onSubmit({ advanceBy: exts });
    } else if (key === '2') {
      // next pic or gif
      const exts = '.gif .jpg .jpeg .bmp .png'.split(' ');
      window.advanceBy = exts;
      onSubmit({ advanceBy: exts });
    } else if (key === '3') {
      // next video (no gif)
      const exts = '.mp4 .webm .mpg .mpeg .wmv'.split(' ');
      window.advanceBy = exts;
      onSubmit({ advanceBy: exts });
    } else if (key === '4') {
      // next pic (no gif)
      const exts = '.jpg .jpeg .bmp .png'.split(' ');
      window.advanceBy = exts;
      onSubmit({ advanceBy: exts });
    } else if (key === 'p') {
      // random
      onSubmit({ advanceBy: 'random' });
    } else if (key === 'j' && !showInput) {
      // forward by 1000
      window.advanceBy = 1000;
      onSubmit({ advanceBy: 1000 });
    } else if (key === 'u' && !showInput) {
      // back by 100
      window.advanceBy = -1000;
      onSubmit({ advanceBy: -1000 });
    } else if (key === 'h' && !showInput) {
      // forward by 100
      window.advanceBy = 100;
      onSubmit({ advanceBy: 100 });
    } else if (key === 'y' && !showInput) {
      // back by 100
      window.advanceBy = -100;
      onSubmit({ advanceBy: -100 });
    } else if (key === 'g' && !showInput) {
      // forward by 10
      window.advanceBy = 10;
      onSubmit({ advanceBy: 10 });
    } else if (key === 't' && !showInput) {
      // back by 10
      window.advanceBy = -10;
      onSubmit({ advanceBy: -10 });
    } else if (key === 'f' && !showInput) {
      // forward by 1
      window.advanceBy = 1;
      onSubmit({ advanceBy: 1 });
    } else if (key === 'r' && !showInput) {
      // back by 1
      window.advanceBy = -1;
      onSubmit({ advanceBy: -1 });
    } else if (key === 'w' && !showInput) {
      // scroll up
      window.scrollBy(0, -0.15 * windowHeight);
    } else if (key === 's' && !showInput) {
      // scroll down
      window.scrollBy(0, 0.15 * windowHeight);
    } else if (key === 'a' && !showInput) {
      // scroll left
      if (scrolledLeft && prevScrolledLeft && false) {
        window.advanceBy = -1;
        onSubmit({ advanceBy: -1 });
      } else {
        window.scrollBy(-0.15 * windowWidth, 0);
      }
    } else if (key === 'd' && !showInput) {
      // scroll right
      if (scrolledRight && prevScrolledRight && false) {
        window.advanceBy = 1;
        onSubmit({ advanceBy: 1 });
      } else {
        window.scrollBy(0.15 * windowWidth, 0);
      }
    }
  }, [handleCancelLastBox, onSubmit, showInput]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (document.activeElement !== inputRef.current && inputRef.current) {
      inputRef.current.select();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

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
    const canvas = canvasRef.current;

    const { clientX, clientY } = getClientXY(evt);

    if (clientX && clientY) {
      const bbox = canvas.getBoundingClientRect();
      const { left, top } = bbox;
      const x = clientX - left;
      const y = clientY - top;
      const loc = { x, y };
      if (isDraw) {
        const nextLocations = [locations[0], loc];
        setLocations(nextLocations);
      }
      setCrosshair([loc]);
    }
  }, [isDraw, locations]);

  const handleOut = React.useCallback((evt) => {
    setCrosshair([]);
  }, []);

  if (!items.length) {
    return null;
  }

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
        setCrosshair([loc]);

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
      const nextShapes = [...drawnShapes, shapeData];
      setDrawnShapes(nextShapes);
      setShowInput(true);
    }
  };

  const doUndo = () => {
    const nextShapes = [...drawnShapes];
    nextShapes.pop();
    setDrawnShapes(nextShapes);
    setShowInput(false);
    setLocations([]);
    setCrosshair([]);
  };

  const lastShape = drawnShapes[drawnShapes.length - 1];
  const sortedPoints = lastShape ? sortPoints(lastShape.points) : [];
  const renderTaggingUi = Boolean(showInput && sortedPoints.length);

  return (
    <React.Fragment>
      <div className="test-actions">
        {items.length > 0 && (
          <div style={{ display: 'flex' }}>
            <button
              disabled={drawnShapes.length === 0}
              className="undo-bound"
              type="button"
              onClick={() => doUndo()}
            >
              <i className="material-icons">
                undo
              </i>
            </button>

            <button
              className="undo-bound"
              type="button"
              onClick={() => {
                onSubmit({ advanceBy: 10 });
              }}
              title="Advance by 10"
            >
              <i className="material-icons">
                skip_next
              </i>
            </button>

            <button
              className="undo-bound"
              type="button"
              onClick={() => {
                onSubmit({ advanceBy: 50 });
              }}
              title="Advance by 50"
            >
              <i className="material-icons">
                fast_forward
              </i>
            </button>

            <button
              className="undo-bound"
              type="button"
              onClick={() => {
                const random = Math.floor(Math.random() * items.length);
                onSubmit({ advanceBy: random });
              }}
              title="Advance by random, be surprised!"
            >
              <i className="material-icons">
                help_outline
              </i>
            </button>

            <button
              className="undo-bound"
              type="button"
              onClick={() => {
                onExportBoundaryExperiment(experimentId);
              }}
              title="Export this experiment's data"
            >
              <i className="material-icons">
                cloud_download
              </i>
            </button>
          </div>
        )}
      </div>

      <center>
      <div
        className="boundary-exp-wrapper"
        style={(size.width && size.height) ? {
          height: `${size.height}px`,
          width: `${size.width}px`,
        } : {}}
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
            onError: () => {
              console.log('404, advancing...');
              onSubmit({ advanceBy: window.advanceBy || 1 });
            },
          }}
          shouldPreload={true}
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
          onMouseOut={isMobile ? undefined : handleOut}
          onTouchStart={isMobile ? handleStart : undefined}
          onTouchMove={isMobile ? handleMove : undefined}
        />

        {renderTaggingUi && (
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

        {renderTaggingUi && (
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
      </center>
    </React.Fragment>
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
  onExportBoundaryExperiment: exportBoundaryExperiment.trigger,
};

export default connect(mapStateToProps, mapDispatchToProps)(BoundaryExperiment);
