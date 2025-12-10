const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

// GET /users/:address/tasks
router.get('/:address/tasks', async (req, res) => {
    try {
        const taskIds = await contractService.getTasksByUser(req.params.address);
        res.json({ taskIds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
