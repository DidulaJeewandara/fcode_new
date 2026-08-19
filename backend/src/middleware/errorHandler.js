const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  // Prisma known request errors — translate common ones into sane HTTP codes
  // instead of leaking a raw 500 for what are really client-caused conflicts.
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'A record with these details already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ message: 'Invalid reference to a related record' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
