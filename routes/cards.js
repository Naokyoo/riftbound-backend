const express = require('express');
const router = express.Router();
const { Card } = require('../models');
const { auth, isAdmin } = require('../middleware/auth');

// GET /api/cards - Récupérer toutes les cartes
router.get('/', async (req, res) => {
  try {
    const { faction, rarity, type, search, sort } = req.query;
    
    // Construire les filtres
    let filter = { isPlayable: true };
    
    if (faction) filter.faction = faction;
    if (rarity) filter.rarity = rarity;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Construire le tri
    let sortOption = {};
    if (sort === 'name') sortOption = { name: 1 };
    else if (sort === 'cost') sortOption = { cost: 1, name: 1 };
    else if (sort === 'rarity') sortOption = { rarity: 1, name: 1 };
    else sortOption = { cardId: 1 };
    
    const cards = await Card.find(filter).sort(sortOption);
    
    res.json({
      success: true,
      count: cards.length,
      data: cards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/cards/:cardId - Récupérer une carte spécifique
router.get('/:cardId', async (req, res) => {
  try {
    const card = await Card.findOne({ cardId: req.params.cardId.toUpperCase() });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/cards - Créer une nouvelle carte (Admin uniquement)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const card = new Card(req.body);
    await card.save();
    
    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      data: card
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/cards/:cardId - Mettre à jour une carte (Admin uniquement)
router.put('/:cardId', auth, isAdmin, async (req, res) => {
  try {
    const card = await Card.findOneAndUpdate(
      { cardId: req.params.cardId.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Card updated successfully',
      data: card
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/cards/:cardId - Supprimer une carte (Admin uniquement)
router.delete('/:cardId', auth, isAdmin, async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ cardId: req.params.cardId.toUpperCase() });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/cards/stats/overview - Stats globales des cartes
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCards = await Card.countDocuments({ isPlayable: true });
    
    const byRarity = await Card.aggregate([
      { $match: { isPlayable: true } },
      { $group: { _id: '$rarity', count: { $sum: 1 } } }
    ]);
    
    const byFaction = await Card.aggregate([
      { $match: { isPlayable: true } },
      { $group: { _id: '$faction', count: { $sum: 1 } } }
    ]);
    
    const byType = await Card.aggregate([
      { $match: { isPlayable: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCards,
        byRarity: byRarity.reduce((acc, item) => {
          acc[item._id.toLowerCase()] = item.count;
          return acc;
        }, {}),
        byFaction: byFaction.reduce((acc, item) => {
          acc[item._id.toLowerCase()] = item.count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
          acc[item._id.toLowerCase()] = item.count;
          return acc;
        }, {})
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
