const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

// POST /tasks
router.post('/', async (req, res) => {
    try {
        const { ipfsUri, reward } = req.body;
        if (!ipfsUri || reward === undefined) {
            return res.status(400).json({ error: 'Missing ipfsUri or reward' });
        }
        const result = await contractService.createTask(ipfsUri, reward);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /tasks/:id
router.get('/:id', async (req, res) => {
    try {
        const task = await contractService.getTask(req.params.id);
        // Here we could also fetch the IPFS content if needed
        // task.ipfsData = await fetch(task.ipfsUri)... 
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /users/:address/tasks
// Note: This matches the requirement "GET /users/:address/tasks" but route mounting might differ.
// If mounted at /tasks, this would be /tasks/users/:address/tasks which is weird.
// We will mount this router at /api or similar, or split routes. 
// For now, let's keep it here and assume meaningful mounting or separate router.
// User asked for "GET /users/:address/tasks", likely implies a separate user router or a root router.
// I will move this to a separate router or handle it in index.js to map properly.
// Let's keep /tasks/:id here.
module.exports = router;
