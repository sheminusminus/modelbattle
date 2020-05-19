import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { getTagCounts } from 'selectors';


const mapStateToProps = createStructuredSelector({
  data: getTagCounts,
});


export default connect(mapStateToProps);
