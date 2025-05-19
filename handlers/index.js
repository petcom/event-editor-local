module.exports = function registerAllHandlers() {
  require('./events')();
  require('./images')();
  require('./s3')();
  require('./utilities')();
};
