import React from 'react';
import PropTypes from 'prop-types';


const Marquee = (props) => {
  const {
    data,
    transform,
  } = props;

  return (
    <datalist className="marquee" id="marquee">
      {Object.entries(data).map(([label, value], idx) => {
        return (
        <React.Fragment key={label + "_frag"}>
          <option value={label} key={label + "_label"} />
          <a
            className="marquee-item"
            key={label}
          >
            {transform(label, value)}
          </a>
        </React.Fragment>
        );
      })}
    </datalist>
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
