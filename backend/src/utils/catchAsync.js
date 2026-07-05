/**
 * Catch Async Wrapper
 * Resolves async handler promises and forwards rejections to next()
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
