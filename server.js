const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv')

// Charger les variables d'environnement
    .then(() => console.log('✅ Connecté à MongoDB'))
    .catch(err => console.error('❌ Erreur MongoDB:', err));

// Importer les routes
const authRoutes = require('./routes/auth');
const cardsRoutes = require('./routes/cards');
const collectionsRoutes = require('./routes/collections');
const decksRoutes = require('./routes/decks');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/decks', decksRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: '🎴 Riftbound API is running!' });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}`);
});
