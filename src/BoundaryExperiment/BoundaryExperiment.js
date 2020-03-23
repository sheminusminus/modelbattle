import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { addNewTag } from 'services/firebase';
import * as selectors from 'selectors'

import { refreshExperimentTags, exportBoundaryExperiment } from 'types';

import Asset from 'Asset';

import { Svg } from './components';

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
    }];
  }

  return [];
};

const BoundaryExperiment = React.forwardRef((props, ref) => {
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
  const svgWrapRef = React.useRef(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [drawnShapes, setDrawnShapes] = React.useState(0);
  const [lastTag, setLastTag] = React.useState(window.lastTag || '');

  const [currentShapes, setCurrentShapes] = React.useState([]);

  React.useImperativeHandle(ref, () => ({
    resetShapes: (nextItem) => {
      setDrawnShapes(0);
      const nextShapes = nextItem
        ? shapes.filter(shape => shape.url === nextItem.url)
        : [];
      setCurrentShapes(nextShapes);
    },
  }));

  const handleCancelLastBox = React.useCallback(() => {
    const nextShapes = [...currentShapes];
    nextShapes.pop();
    setDrawnShapes(drawnShapes - 1);
    setCurrentShapes(nextShapes);
  }, [currentShapes, drawnShapes]);

  const handleInputEnter = React.useCallback(async (event, allShapes) => {
    const val = event.target.value || lastTag;
    window.lastTag = val;

    if (val) {
      const tagKey = await addNewTag(experimentId, val);
      const saveShapes = [...currentShapes];
      const lastIdx = saveShapes.length - 1;
      const shapeData = saveShapes[lastIdx];
      shapeData.tag = tagKey;
      setLastTag(tagKey);
      saveShapes[lastIdx] = shapeData;
      const nextShapes = [...shapes, ...saveShapes];
      setCurrentShapes(nextShapes);
      onDrawEnd(saveShapes);
      onRefreshTags();
    }
  }, [currentShapes, experimentId, lastTag, onDrawEnd, onRefreshTags, shapes]);

  const handleImageLoad = React.useCallback((evt) => {
    const { width, height } = evt.target;
    setSize({ width, height });
  }, []);

  const handleAddNewRect = React.useCallback((event) => {
    event.preventDefault();
    setDrawnShapes((prev) => prev + 1);
    setCurrentShapes((prev) => {
      const lastShape = prev[prev.length - 1];
      if (lastShape && !lastShape.tag) {
        return prev;
      }
      const { clientX, clientY } = event;
      const bbox = svgWrapRef.current.getBoundingClientRect();
      const tapPoint = {x: clientX - bbox.x, y: clientY - bbox.y };
      const boxCorner = { x: tapPoint.x + 120, y: tapPoint.y + 120 };
      const boxPoints = getBoundingPoints([tapPoint, boxCorner]);
      return [...prev, {
        points: boxPoints,
        size,
      }];
    });
  }, [size]);

  return (
    <React.Fragment>
      <div className="test-actions">
        {items.length > 0 && (
          <div style={{ display: 'flex' }}>
            <button
              disabled={drawnShapes === 0}
              className="undo-bound"
              type="button"
              onClick={() => {
                if (drawnShapes > 0) {
                  const nextShapes = [...currentShapes];
                  nextShapes.pop();
                  setCurrentShapes(nextShapes);
                  setDrawnShapes(drawnShapes - 1);
                }
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
            drawnShapesCount={drawnShapes}
            handleCancelLastBox={handleCancelLastBox}
            handleInputEnter={handleInputEnter}
            height={size.height}
            lastTag={lastTag}
            onDoubleTap={handleAddNewRect}
            shapes={[...shapes, ...currentShapes]}
            tags={tags}
            width={size.width}
          />
        </div>
      </div>
    </React.Fragment>
  );
});

BoundaryExperiment.defaultProps = {
  shapes: [],
  tags: [],
};

const mapStateToProps = createStructuredSelector({
  experimentId: selectors.getExperimentsActiveId,
  tags: selectors.getExperimentTagsForActiveId,
});

const mapDispatchToProps = {
  onRefreshTags: refreshExperimentTags.trigger,
  onExportBoundaryExperiment: exportBoundaryExperiment.trigger,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true },
)(BoundaryExperiment);
