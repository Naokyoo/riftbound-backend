const express = require('express');
const router = express.Router();
const { Collection, Card, User } = require('../models');
const { auth } = require('../middleware/auth');

// GET /api/collections/me - Ma collection
router.get('/me', auth, async (req, res) => {
  try {
    let collection = await Collection.findOne({ userId: req.userId });

    // Créer une collection vide si elle n'existe pas
    if (!collection) {
      collection = new Collection({
        userId: req.userId,
        cards: []
      });
      await collection.save();
    }

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/collections/me/detailed - Ma collection avec les détails des cartes
router.get('/me/detailed', auth, async (req, res) => {
  try {
    const collection = await Collection.findOne({ userId: req.userId });

    if (!collection) {
      return res.json({
        success: true,
        data: {
          cards: [],
          stats: {
            totalCards: 0,
            uniqueCards: 0,
            byRarity: {},
            byFaction: {}
          }
        }
      });
    }

    // Récupérer les détails de chaque carte
    const cardIds = collection.cards.map(c => c.cardId);
    const cardDetails = await Card.find({ cardId: { $in: cardIds } });

    // Créer une map des cartes pour un accès rapide
    const cardMap = {};
    cardDetails.forEach(card => {
      cardMap[card.cardId] = card;
    });

    // Enrichir les cartes de la collection avec leurs détails
    const enrichedCards = collection.cards.map(collectionCard => ({
      ...collectionCard.toObject(),
      details: cardMap[collectionCard.cardId] || null
    }));

    res.json({
      success: true,
      data: {
        cards: enrichedCards,
        stats: collection.stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/collections/cards - Ajouter une carte à ma collection
router.post('/cards', auth, async (req, res) => {
  try {
    const { cardId, quantity = 1, source = 'Pack' } = req.body;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        error: 'cardId is required'
      });
    }

    // Récupérer ou créer la collection
    let collection = await Collection.findOne({ userId: req.userId });
    if (!collection) {
      collection = new Collection({ userId: req.userId });
    }

    // Ajouter la carte (pas besoin de vérifier si elle existe dans la DB car les cartes sont dans le JSON frontend)
    collection.addCard(cardId.toUpperCase(), quantity, source);
    await collection.save();

    // Mettre à jour les stats du joueur
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalCardsCollected': quantity }
    });

    res.json({
      success: true,
      message: `Added ${quantity}x card to collection`,
      data: collection
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/collections/cards/:cardId - Retirer une carte de ma collection
router.delete('/cards/:cardId', auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const cardId = req.params.cardId.toUpperCase();

    const collection = await Collection.findOne({ userId: req.userId });
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    // Retirer la carte
    collection.removeCard(cardId, quantity);
    await collection.save();

    res.json({
      success: true,
      message: `Removed ${quantity}x card from collection`,
      data: collection
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/collections/cards/:cardId/favorite - Marquer/démarquer comme favori
router.put('/cards/:cardId/favorite', auth, async (req, res) => {
  try {
    const cardId = req.params.cardId.toUpperCase();
    const { isFavorite } = req.body;

    const collection = await Collection.findOne({ userId: req.userId });
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    const card = collection.cards.find(c => c.cardId === cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found in collection'
      });
    }

    card.isFavorite = isFavorite !== undefined ? isFavorite : !card.isFavorite;
    await collection.save();

    res.json({
      success: true,
      message: card.isFavorite ? 'Card marked as favorite' : 'Card unmarked as favorite',
      data: collection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/collections/me/stats - Statistiques de ma collection
router.get('/me/stats', auth, async (req, res) => {
  try {
    const collection = await Collection.findOne({ userId: req.userId });

    if (!collection) {
      return res.json({
        success: true,
        data: {
          totalCards: 0,
          uniqueCards: 0,
          byRarity: {},
          byFaction: {}
        }
      });
    }

    // Récupérer toutes les cartes pour calculer les stats
    const cardIds = collection.cards.map(c => c.cardId);
    const cards = await Card.find({ cardId: { $in: cardIds } });

    // Calculer les stats par rareté et faction
    const byRarity = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    const byFaction = { fire: 0, water: 0, earth: 0, air: 0, dark: 0, light: 0, neutral: 0 };

    collection.cards.forEach(collectionCard => {
      const card = cards.find(c => c.cardId === collectionCard.cardId);
      if (card) {
        const rarity = card.rarity.toLowerCase();
        const faction = card.faction.toLowerCase();
        byRarity[rarity] = (byRarity[rarity] || 0) + collectionCard.quantity;
        byFaction[faction] = (byFaction[faction] || 0) + collectionCard.quantity;
      }
    });

    // Mettre à jour les stats dans la collection
    collection.stats.byRarity = byRarity;
    collection.stats.byFaction = byFaction;
    await collection.save();

    res.json({
      success: true,
      data: collection.stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/collections/:userId - Collection d'un autre utilisateur (public)
router.get('/:userId', async (req, res) => {
  try {
    const collection = await Collection.findOne({ userId: req.params.userId });

    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    res.json({
      success: true,
      data: {
        stats: collection.stats
        // On ne renvoie pas les cartes pour des raisons de confidentialité
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
