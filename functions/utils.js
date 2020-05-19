module.exports.hasAuth = (auth) => auth && auth.uid && auth.token;

module.exports.valFromQuery = async (query) => {
  const snap = await query.once('value');
  return snap.val();
};

module.exports.makeResponse = (data, meta = {}) => ({
  result: data,
  meta,
});

module.exports.memoize = require("memoizee");
