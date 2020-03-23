import React from 'react'
import interact from 'interactjs'

const options = [
  'draggable',
  'resizable',
  'gesturable',
  'dropzone',
];

const events = [
  // Interact Events
  'DragStart',
  'DragMove',
  'DragInertiaStart',
  'DragEnd',
  'ResizeStart',
  'ResizeMove',
  'ResizeInertiaStart',
  'ResizeEnd',
  'GestureStart',
  'GestureMove',
  'GestureEnd',
  // Drop Events
  'DropActivate',
  'DropdEactivate',
  'DragEnter',
  'DragLeave',
  'DropMove',
  'Drop',
  // Pointer Events
  'Down',
  'Move',
  'Up',
  'Cancel',
  'Tap',
  'DoubleTap',
  'Hold',
];

const getDisplayName = (BaseComponent) => BaseComponent.displayName || 'Component';

const withInteract = (BaseComponent) => {
  return class Reactable extends React.Component {
    static displayName = `reactable(${getDisplayName(BaseComponent)})`;

    interactable;
    node = React.createRef();

    // componentDidMount of parent is called after all its children is mounted
    componentDidMount() {
      if (!this.node.current) {
        console.error(' you should apply getRef props in the dom element');
        return;
      }
      this.interactable = interact(this.node.current);
      options.forEach((option) => {
        if (option in this.props) {
          this.interactable[option](this.props[option]);
        }
      });
      events.forEach((event) => {
        const handler = this.props[`on${event}`];
        if (typeof handler === 'function') {
          this.interactable.on(event.toLowerCase(), handler)
        }
      });
    }

    componentWillUnmount() {
      this.interactable.unset()
    }

    baseProps(props) {
      const baseProps = { ...props };
      options.forEach(option => delete baseProps[option]);
      events.forEach(event => delete baseProps[`on${event}`]);
      return baseProps;
    }

    render() {
      return <BaseComponent {...this.baseProps(this.props)} getRef={this.node} />;
    }
  }
};

export default withInteract
