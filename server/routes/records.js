const express = require('express');
const store = require('../data/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const records = store.getUserGameRecords(req.user.id);
  res.json({ records });
});

router.get('/:recordId', (req, res) => {
  const { recordId } = req.params;
  const record = store.getGameRecord(req.user.id, recordId);

  if (!record) {
    return res.status(404).json({ error: '游戏记录不存在' });
  }

  res.json({ record });
});

router.delete('/:recordId', (req, res) => {
  const { recordId } = req.params;
  
  if (store.deleteGameRecord(req.user.id, recordId)) {
    res.json({ success: true, message: '游戏记录已删除' });
  } else {
    res.status(404).json({ error: '游戏记录不存在' });
  }
});

module.exports = router;
