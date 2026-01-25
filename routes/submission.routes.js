const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const verifyToken = require('../middleware/verifyToken');

router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { round, links } = req.body;

        if (round === undefined || !links || !Array.isArray(links)) {
            return res.status(400).json({ error: 'Invalid submission data' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.isTeamLeader) {
            return res.status(403).json({ error: 'Only team leader can submit' });
        }

        const team = await prisma.team.findFirst({ where: { teamMembers: { has: email } } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        if (team.teamMembers.length < 3) {
            return res.status(400).json({ error: 'Team must have at least 3 members to submit' });
        }

        const validRounds = [0, 1, 2, 3];
        if (!validRounds.includes(Number(round))) {
            return res.status(400).json({ error: 'Invalid round number' });
        }

        let submission = await prisma.submission.findFirst({ where: { teamId: team.teamId } });

        if (!submission) {
            submission = await prisma.submission.create({
                data: {
                    teamId: team.teamId,
                    teamName: team.teamName,
                    [`round${round}Submission`]: links
                }
            });
        } else {
            submission = await prisma.submission.update({
                where: { id: submission.id },
                data: {
                    [`round${round}Submission`]: links
                }
            });
        }

        res.json({ message: 'Submission successful', submission });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
