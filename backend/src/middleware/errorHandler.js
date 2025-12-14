const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Données invalides' });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  res.status(500).json({ error: 'Erreur serveur' });
};

module.exports = errorHandler;

