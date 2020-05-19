import React from 'react';
import PropTypes from 'prop-types';


const Marquee = (props) => {
  const {
    data,
    transform,
  } = props;

  return (
    <ul className="marquee">
      {Object.entries(data).map(([label, value], idx) => {
        return (
          <li
            className="marquee-item"
            key={label}
          >
            {transform(label, value)}
          </li>
        );
      })}
    </ul>
  );
};

Marquee.propTypes = {
  data: PropTypes.shape(),
  transform: PropTypes.func,
};

Marquee.defaultProps = {
  data: {},
  transform: (label, value) => (
    <>
      <span>{label}</span> <span>({value})</span>
    </>
  ),
};


export default Marquee;
