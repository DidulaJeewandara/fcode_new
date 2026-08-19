const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
