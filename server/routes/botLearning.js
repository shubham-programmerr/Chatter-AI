const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAllLearningFacts, deleteLearnedFact } = require('../utils/botLearning');
const BotLearning = require('../models/BotLearning');

// Get all learned facts in a room (admin only)
router.get('/room/:roomId', authMiddleware, async (req, res) => {
  try {
    console.log('📚 Fetching bot learned facts for room:', req.params.roomId);
    
    const facts = await getAllLearningFacts(req.params.roomId);
    
    console.log('✅ Retrieved', facts.length, 'learned facts');
    res.json(facts);
  } catch (error) {
    console.error('❌ Error fetching learned facts:', error);
    res.status(500).json({ error: 'Failed to fetch learned facts' });
  }
});

// Delete a learned fact (admin only)
router.delete('/:factId', adminMiddleware, async (req, res) => {
  try {
    console.log('🗑️ Deleting learned fact:', req.params.factId);
    
    const fact = await BotLearning.findById(req.params.factId);
    if (!fact) {
      return res.status(404).json({ error: 'Fact not found' });
    }

    await deleteLearnedFact(req.params.factId);
    
    console.log('✅ Learned fact deleted');
    res.json({ message: 'Fact deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting fact:', error);
    res.status(500).json({ error: 'Failed to delete fact' });
  }
});

// Get bot learning statistics
router.get('/stats/:roomId', authMiddleware, async (req, res) => {
  try {
    console.log('📊 Getting bot learning stats for room:', req.params.roomId);
    
    const stats = await BotLearning.aggregate([
      { $match: { room: require('mongoose').Types.ObjectId(req.params.roomId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgImportance: { $avg: '$importance' },
          totalUsage: { $sum: '$usageCount' }
        }
      }
    ]);

    const totalFacts = await BotLearning.countDocuments({ room: req.params.roomId });
    
    res.json({
      totalFacts,
      byCategory: stats
    });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
