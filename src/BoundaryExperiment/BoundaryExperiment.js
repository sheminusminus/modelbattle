import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Keys } from 'const';

import { isMobileDevice, sortPoints } from 'helpers';

import { addNewTag } from 'services/firebase';

import * as selectors from 'selectors'

import { refreshExperimentTags, exportBoundaryExperiment } from 'types';

import Asset from 'Asset';

import { Input } from 'components';

import { Polygon, Svg } from './components';

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
    onAdvanceByValue,
    onDrawEnd,
    onDrawStart,
    onExportBoundaryExperiment,
    onImageLoad,
    onRefreshTags,
    onSubmit,
    shapes = [],
    tags,
  } = props;

  /**
   * @type {React.MutableRefObject<HTMLInputElement>}
   */
  const inputRef = React.useRef(null);
  const svgWrapRef = React.useRef(null);
  const [locations, setLocations] = React.useState([]);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [drawnShapes, setDrawnShapes] = React.useState([]);
  const [showInput, setShowInput] = React.useState(false);
  const [inputVal, setInputVal] = React.useState(undefined);
  const [lastTag, setLastTag] = React.useState(window.lastTag || '');

  const [currentShapes, setCurrentShapes] = React.useState(shapes);

  // const handleCancelLastBox = React.useCallback(() => {
  //   const nextShapes = drawnShapes.slice(0, drawnShapes.length - 1);
  //   setDrawnShapes(nextShapes);
  //   setLocations([]);
  //   setShowInput(false);
  // }, [drawnShapes]);
  //
  // const handleInputEnter = React.useCallback(async () => {
  //   const val = inputVal || lastTag;
  //   window.lastTag = val;
  //
  //   if (val) {
  //     const tagKey = await addNewTag(experimentId, val);
  //     const lastIdx = drawnShapes.length - 1;
  //     const shapeData = drawnShapes[lastIdx];
  //     shapeData.tag = tagKey;
  //     setLastTag(tagKey);
  //     const nextShapes = [...drawnShapes.slice(0, lastIdx), shapeData];
  //     setDrawnShapes(nextShapes);
  //     setLocations([]);
  //     setShowInput(false);
  //     setInputVal(undefined);
  //     onDrawEnd(nextShapes);
  //     onRefreshTags();
  //   }
  // }, [drawnShapes, experimentId, inputVal, lastTag, onDrawEnd, onRefreshTags]);
  //
  // const handleKeyDown = React.useCallback((evt) => {
  //   const { key } = evt;
  //   if (key === Keys.ESC && showInput) {
  //     evt.preventDefault();
  //     evt.stopPropagation();
  //     handleCancelLastBox();
  //     setInputVal(undefined);
  //   } else if (key === Keys.SKIP && !showInput) {
  //     window.advanceBy = 1;
  //     onSubmit();
  //   } else if (key === Keys.ADV && !showInput) {
  //     window.advanceBy = 1;
  //     onSubmit();
  //   } else if (key === Keys.PRV && !showInput) {
  //     window.advanceBy = -1;
  //     onSubmit({ advanceBy: -1 });
  //   }
  // }, [handleCancelLastBox, onSubmit, showInput]);
  //
  // React.useEffect(() => {
  //   window.addEventListener('keydown', handleKeyDown);
  //   if (document.activeElement !== inputRef.current && inputRef.current) {
  //     inputRef.current.select();
  //   }
  //
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   }
  // }, [handleKeyDown]);

  const handleImageLoad = React.useCallback((evt) => {
    const { width, height } = evt.target;
    setSize({ width, height });
  }, []);

  // const lastShape = drawnShapes[drawnShapes.length - 1];
  // const sortedPoints = lastShape ? sortPoints(lastShape.points) : [];
  // const renderTaggingUi = Boolean(showInput && sortedPoints.length);

  const handleAddNewRect = React.useCallback((event) => {
    event.preventDefault();
    const { clientX, clientY } = event;
    const bbox = svgWrapRef.current.getBoundingClientRect();
    const tapPoint = {x: clientX - bbox.x, y: clientY - bbox.y };
    const boxCorner = { x: tapPoint.x + 120, y: tapPoint.y + 120 };
    const boxPoints = getBoundingPoints([tapPoint, boxCorner]);
    setCurrentShapes((prev) => {
      return [...prev, {
        points: boxPoints,
        size,
        url: shapes[0].url,
      }];
    });
  }, [shapes, size]);

  return (
    <React.Fragment>
      <div className="test-actions">
        {items.length > 0 && (
          <div style={{ display: 'flex' }}>
            <button
              disabled={drawnShapes.length === 0}
              className="undo-bound"
              type="button"
              onClick={() => {
                const nextShapes = [...drawnShapes];
                nextShapes.pop();
                setDrawnShapes(nextShapes);
                setShowInput(false);
                setLocations([]);
              }}
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
            onError: () => {
              setTimeout(() => {
                console.log('404, advancing...');
                onSubmit({ advanceBy: window.advanceBy || 1 });
              }, 10);
            },
          }}
          shouldPreload={false}
          type="image/"
        />
        <div
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            height: `${size.height}px`,
            width: `${size.width}px`,
          }}
          ref={svgWrapRef}
        >
          <Svg
            height={size.height}
            width={size.width}
            shapes={currentShapes}
            tags={tags}
            onDoubleTap={handleAddNewRect}
          />
        </div>
        {/*{renderTaggingUi && (*/}
        {/*  <button*/}
        {/*    className="close-x"*/}
        {/*    onClick={(evt) => {*/}
        {/*      evt.preventDefault();*/}
        {/*      evt.stopPropagation();*/}
        {/*      handleCancelLastBox();*/}
        {/*    }}*/}
        {/*    style={{*/}
        {/*      left: sortedPoints[0].x - 3,*/}
        {/*      top: sortedPoints[0].y - 20,*/}
        {/*    }}*/}
        {/*    type="button"*/}
        {/*  >*/}
        {/*    x*/}
        {/*  </button>*/}
        {/*)}*/}

        {/*{renderTaggingUi && (*/}
        {/*  <Input*/}
        {/*    autoFocus={true}*/}
        {/*    onChange={handleInputChange}*/}
        {/*    onKeyDown={async (evt) => {*/}
        {/*      console.log(evt.key);*/}
        {/*      const { key } = evt;*/}
        {/*      if (key === Keys.NEXT) {*/}
        {/*        await handleInputEnter();*/}
        {/*      } else if (key === Keys.BACK && inputVal === undefined) {*/}
        {/*        setInputVal('');*/}
        {/*      }*/}
        {/*    }}*/}
        {/*    ref={inputRef}*/}
        {/*    value={inputVal !== undefined ? inputVal : lastTag}*/}
        {/*    wrapperStyle={{*/}
        {/*      left: sortedPoints[1].x,*/}
        {/*      width: Math.abs(sortedPoints[1].x - sortedPoints[2].x),*/}
        {/*      top: sortedPoints[1].y - 3,*/}
        {/*    }}*/}
        {/*  />*/}
        {/*)}*/}
      </div>
    </React.Fragment>
  );
};

BoundaryExperiment.defaultProps = {
  shapes: [],
  tags: [],
};

const mapStateToProps = createStructuredSelector({
  experimentId: selectors.getExperimentsActiveId,
  shapes: selectors.getExperimentShapesForActiveIdWithSortedPoints,
  tags: selectors.getExperimentTagsForActiveId,
});

const mapDispatchToProps = {
  onRefreshTags: refreshExperimentTags.trigger,
  onExportBoundaryExperiment: exportBoundaryExperiment.trigger,
};

export default connect(mapStateToProps, mapDispatchToProps)(BoundaryExperiment);
