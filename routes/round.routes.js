const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

router.get('/status', async (req, res) => {
    try {
        const rounds = await prisma.round.findMany({
            orderBy: {
                roundId: 'asc'
            }
        });

        const roundsMap = rounds.reduce((acc, round) => {
            acc[round.roundId] = round.status;
            return acc;
        }, {});

        res.json({ rounds: roundsMap });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
