// require all specs so that only a single entry point is created for performance
// and avoids spurious "entry point dependency" errors
// @see: https://github.com/webpack/karma-webpack#alternative-usage
var testsContext = require.context('./specs', true);
testsContext.keys().forEach(testsContext);
