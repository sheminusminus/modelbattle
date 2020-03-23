import React from 'react';
import PT from 'prop-types';

import { Keys } from 'const';
import { withInteract } from 'hoc';
import { usePrevious } from 'hooks';
import { randomColor } from 'helpers';

import Point from './Point';
import Rect from './Rect';
import Text from './Text';

import { Input } from 'components';

import {
  makeShapePointsStrAccum,
  getChildKey,
  getDataAttributesFromTarget,
  getNextShapesOnPointMove,
  getNextShapesOnScale,
  isPtActive,
} from './svgHelpers';

/**
 * @param {Object} props
 * @param {Object} props.getRef
 * @param {Function} props.handleCancelLastBox
 * @param {Function} props.handleInputEnter
 * @param {number} props.height
 * @param {?string} props.lastTag
 * @param {Shape[]} props.shapes
 * @param {Object} props.tags
 * @param {number} props.number
 * @return {*}
 * @constructor
 */
const BaseSvg = (props) => {
  const {
    drawnShapesCount,
    getRef,
    handleCancelLastBox,
    handleInputEnter,
    height,
    lastTag,
    shapes,
    tags,
    width,
  } = props;

  /**
   * @type {React.MutableRefObject<HTMLInputElement>}
   */
  const inputRef = React.useRef();
  const savedShapesCount = React.useRef(shapes.length);
  const [inputVal, setInputVal] = React.useState(undefined);
  const [drawShapes, setDrawShapes] = React.useState(shapes);
  const [activePoint, setActivePoint] = React.useState({ shape: null, point: null });
  const [nextTagColor, setNextTagColor] = React.useState(randomColor());

  const previousShapes = usePrevious(shapes, []);

  React.useEffect(() => {
    if (previousShapes.length !== shapes.length) {
      setDrawShapes(shapes);
    }

    if (shapes.length === drawShapes.length - 1) {
      setDrawShapes((prev) => {
        const nextShapes = [...prev];
        nextShapes.pop();
        return nextShapes;
      });
    } else if (shapes.length === drawShapes.length + 1) {
      setDrawShapes((prev) => {
        return [...prev, shapes[shapes.length - 1]];
      });
    }
  }, [drawShapes.length, previousShapes.length, shapes]);

  const handleInputChange = React.useCallback((evt) => {
    const { value } = evt.target;
    const formatted = value
      .toLowerCase()
      .replace(/\s/g, '_')
      .replace(/\.|\$|\[|\]|\//g, '');
    setInputVal(formatted);
  }, []);

  const onSinglePointMoved = React.useCallback((event, shapeIndex, ptIndex) => {
    const { dx, dy } = event;

    setDrawShapes((prev) => {
      return getNextShapesOnPointMove({
        dx,
        dy,
        prev,
        ptIndex,
        shapeIndex,
      });
    });
  }, []);

  const onRectScaled = React.useCallback((event, shapeIndex, ptIndex) => {
    const { dx, dy } = event;

    setDrawShapes((prev) => {
      return getNextShapesOnScale({
        dx,
        dy,
        prev,
        ptIndex,
        shapeIndex,
      });
    });
  }, []);

  const pointMoveHandler = React.useCallback((event) => {
    const {
      dataActive,
      dataPoint,
      dataShape,
    } = getDataAttributesFromTarget(event.target);

    if (dataShape <= savedShapesCount.current - 1) {
      return;
    }

    if (dataActive) {
      onSinglePointMoved(event, dataShape, dataPoint);
    } else {
      onRectScaled(event, dataShape, dataPoint);
    }
  }, [onRectScaled, onSinglePointMoved]);

  const deactivatePoint = React.useCallback(() => {
    setActivePoint({ shape: null, point: null });
  }, []);

  const onPointHeld = React.useCallback((event, shapeIndex, ptIndex, isActive) => {
    if (isActive) {
      deactivatePoint();
    } else {
      setActivePoint({ shape: shapeIndex, point: ptIndex });
    }
  }, [deactivatePoint]);

  const pointHeldHandler = React.useCallback((event) => {
    const {
      dataActive,
      dataPoint,
      dataShape,
    } = getDataAttributesFromTarget(event.target);

    if (dataShape <= savedShapesCount.current - 1) {
      return;
    }

    onPointHeld(event, dataShape, dataPoint, dataActive);
  }, [onPointHeld]);

  const lastShape = drawShapes[drawShapes.length - 1];
  const lastShapeWidth = lastShape
    ? lastShape.points[3].x - lastShape.points[0].x
    : 0;
  const closeBtnX = lastShape
    ? lastShape.points[3].x - (lastShapeWidth / 2) - 25
    : 0;
  const inputWidth = lastShape
    ? Math.max(Math.abs(lastShape.points[1].x - lastShape.points[2].x), 140)
    : 0;
  const inputLeft = lastShape
    ? lastShape.points[3].x - (lastShapeWidth / 2) - (inputWidth / 2)
    : 0;
  const renderTaggingUi = Boolean(lastShape && lastShape.points.length && !lastShape.tag);

  const handleKeyDown = React.useCallback(async (event) => {
    if (event.key === Keys.ESC) {
      if (activePoint.point !== null) {
        deactivatePoint();
      } else if (renderTaggingUi) {
        handleCancelLastBox();
      }
    } else if (event.key === Keys.NEXT) {
      await handleInputEnter(event, nextTagColor);
      setNextTagColor(randomColor());
    }
  }, [
    activePoint.point,
    renderTaggingUi,
    deactivatePoint,
    handleCancelLastBox,
    handleInputEnter,
    nextTagColor,
  ]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <React.Fragment>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width, height, overflow: 'visible' }}
        ref={getRef}
        onDoubleClick={(event) => {
          if (renderTaggingUi) {
            event.stopPropagation();
            event.preventDefault();
          }
        }}
      >
        {drawShapes.map((shape, shapeIndex) => {
          const tag = tags[shape.tag] || {};
          const shapePoints = shape.points;
          const reducer = makeShapePointsStrAccum(shapePoints.length);
          const points = shapePoints.reduce(reducer, '');
          const color = tag.color || nextTagColor;

          return (
            <React.Fragment key={getChildKey(shapeIndex)}>
              <Rect points={points} color={color} />

              {shapePoints.map((pt, ptIndex) => (
                <Point
                  color={color}
                  drawnShapesCount={drawnShapesCount}
                  key={getChildKey(shapeIndex, ptIndex)}
                  onPointMoved={pointMoveHandler}
                  onPointHeld={pointHeldHandler}
                  x={pt.x}
                  y={pt.y}
                  pointIndex={ptIndex}
                  savedShapesCount={savedShapesCount.current}
                  shapeIndex={shapeIndex}
                  isActive={isPtActive(shapeIndex, ptIndex, activePoint)}
                />
              ))}

              {!!tag.text && (
                <Text
                  x={shapePoints[1].x}
                  y={shapePoints[1].y + 20}
                  color={color}
                >
                  {tag.text}
                </Text>
              )}

              {!tag.text && (
                <Text
                  x={shapePoints[1].x}
                  y={shapePoints[1].y + 20}
                  color={tag.color}
                >
                  {tag.text}
                </Text>
              )}
            </React.Fragment>
          )
        })}
      </svg>

      {renderTaggingUi && (
        <React.Fragment>
          <button
            className="tagging-btn close-x"
            onClick={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              handleCancelLastBox();
            }}
            style={{
              left: closeBtnX,
              top: lastShape.points[0].y - 30,
            }}
            type="button"
          >
          <span
            className="material-icons"
            style={{
              fontSize: '20px',
              verticalAlign: 'middle',
            }}
          >
            highlight_off
          </span>
          </button>

          <button
            className="tagging-btn gen-color"
            onClick={(evt) => {
              console.log('redo random color');
            }}
            style={{
              left: closeBtnX + 30,
              top: lastShape.points[0].y - 30,
            }}
            type="button"
          >
          <span
            className="material-icons"
            style={{
              fontSize: '20px',
              verticalAlign: 'middle',
            }}
          >
            invert_colors
          </span>
          </button>

          <Input
            autoFocus={true}
            onChange={handleInputChange}
            onKeyDown={async (evt) => {
              const { key } = evt;
              if (key === Keys.NEXT) {
                await handleInputEnter(evt, nextTagColor);
                setNextTagColor(randomColor());
              } else if (key === Keys.BACK && inputVal === undefined) {
                setInputVal('');
              }
            }}
            ref={inputRef}
            value={inputVal !== undefined ? inputVal : lastTag}
            wrapperStyle={{
              left: `${inputLeft}px`,
              width: `${inputWidth}px`,
              top: lastShape.points[1].y + 5,
            }}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

BaseSvg.propTypes = {
  drawnShapesCount: PT.number.isRequired,
  getRef: PT.shape({}).isRequired,
  handleCancelLastBox: PT.func.isRequired,
  handleInputEnter: PT.func.isRequired,
  height: PT.number,
  initialPoints: PT.arrayOf(PT.shape({
    x: PT.number,
    y: PT.number,
  })),
  lastTag: PT.string,
  shapes: PT.arrayOf(PT.shape({
    points: PT.arrayOf(PT.shape({
      x: PT.number,
      y: PT.number,
    })),
    tag: PT.string,
  })),
  tags: PT.shape({}),
  width: PT.number,
};

BaseSvg.defaultProps = {
  height: 0,
  initialPoints: undefined,
  shapes: [],
  tags: {},
  width: 0,
};

const InteractableSvg = withInteract(BaseSvg);

const TappableSvg = (props) => {
  const {
    drawnShapesCount,
    handleCancelLastBox,
    handleInputEnter,
    height,
    initialPoints,
    lastTag,
    onDoubleTap,
    shapes,
    tags,
    width,
  } = props;

  return (
    <InteractableSvg
      drawnShapesCount={drawnShapesCount}
      gesturable
      handleCancelLastBox={handleCancelLastBox}
      handleInputEnter={handleInputEnter}
      height={height}
      initialPoints={initialPoints}
      lastTag={lastTag}
      onDoubleTap={onDoubleTap}
      shapes={shapes}
      tags={tags}
      width={width}
    />
  );
};

TappableSvg.propTypes = {
  drawnShapesCount: PT.number.isRequired,
  handleCancelLastBox: PT.func.isRequired,
  handleInputEnter: PT.func.isRequired,
  height: PT.number,
  lastTag: PT.string,
  onDoubleTap: PT.func.isRequired,
  width: PT.number,
  shapes: PT.arrayOf(PT.shape({
    points: PT.arrayOf(PT.shape({
      x: PT.number,
      y: PT.number,
    })),
    tag: PT.string,
  })),
  tags: PT.shape({}),
};

TappableSvg.defaultProps = {
  width: 0,
  height: 0,
  shapes: [],
  renderTaggingUi: false,
  tags: {},
};

export { BaseSvg };
export default TappableSvg;
