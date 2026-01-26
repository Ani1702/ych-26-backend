const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const verifyToken = require('../middleware/verifyToken');
const generateTeamCode = require('../utils/generateTeamCode');

router.post('/create-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { teamName } = req.body;

        if (!teamName) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        if (user.hasTeam) {
            return res.status(400).json({ error: 'User is already in a team' });
        }

        // Check if team name is unique
        const existingTeamWithName = await prisma.team.findUnique({
            where: { teamName }
        });

        if (existingTeamWithName) {
            return res.status(400).json({ error: 'Team name already exists. Please choose a different name.' });
        }

        let teamId = generateTeamCode();
        let isUnique = false;
        while (!isUnique) {
            const existingTeam = await prisma.team.findUnique({
                where: { teamId }
            });
            if (!existingTeam) isUnique = true;
            else teamId = generateTeamCode();
        }

        const [newTeam, updatedUser] = await prisma.$transaction([
            prisma.team.create({
                data: {
                    teamId,
                    teamName,
                    teamLeader: email,
                    teamMembers: [email]
                }
            }),
            prisma.user.update({
                where: { email },
                data: {
                    hasTeam: true,
                    isTeamLeader: true
                }
            })
        ]);

        res.status(201).json({
            message: 'Team created successfully',
            team: newTeam,
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
});

router.post('/join-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { teamId } = req.body;

        if (!teamId) {
            return res.status(400).json({ error: 'Team code (teamId) is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.hasTeam) {
            return res.status(400).json({ error: 'User is already in a team' });
        }

        const team = await prisma.team.findUnique({
            where: { teamId }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const MAX_TEAM_SIZE = parseInt(process.env.MAX_TEAM_SIZE) || 6;
        if (team.teamMembers.length >= MAX_TEAM_SIZE) {
            return res.status(400).json({ error: 'Team is full' });
        }

        const [updatedTeam, updatedUser] = await prisma.$transaction([
            prisma.team.update({
                where: { teamId },
                data: {
                    teamMembers: {
                        push: email
                    }
                }
            }),
            prisma.user.update({
                where: { email },
                data: {
                    hasTeam: true
                }
            })
        ]);

        res.json({
            message: 'Joined team successfully',
            team: updatedTeam,
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/leave-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const team = await prisma.team.findFirst({
            where: {
                teamMembers: {
                    has: email
                }
            }
        });

        if (!team) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user && user.hasTeam) {
                await prisma.user.update({
                    where: { email },
                    data: { hasTeam: false, isTeamLeader: false }
                });
            }
            return res.status(400).json({ error: 'User is not in any team' });
        }

        const newMembers = team.teamMembers.filter(member => member !== email);

        if (newMembers.length === 0) {
            await prisma.$transaction([
                prisma.team.delete({
                    where: { teamId: team.teamId }
                }),
                prisma.user.update({
                    where: { email },
                    data: { hasTeam: false, isTeamLeader: false }
                })
            ]);
            return res.json({ message: 'Left team successfully. Team deleted as it became empty.' });
        }

        let newLeader = team.teamLeader;
        const transactionOperations = [];

        transactionOperations.push(
            prisma.user.update({
                where: { email },
                data: { hasTeam: false, isTeamLeader: false }
            })
        );

        if (team.teamLeader === email) {
            newLeader = newMembers[0];
            transactionOperations.push(
                prisma.user.update({
                    where: { email: newLeader },
                    data: { isTeamLeader: true }
                })
            );
        }

        transactionOperations.push(
            prisma.team.update({
                where: { teamId: team.teamId },
                data: {
                    teamMembers: newMembers,
                    teamLeader: newLeader
                }
            })
        );

        await prisma.$transaction(transactionOperations);

        res.json({
            message: 'Left team successfully',
            newLeader: team.teamLeader === email ? newLeader : undefined
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/get-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.hasTeam) {
            return res.status(404).json({ error: 'User is not in a team' });
        }

        const team = await prisma.team.findFirst({
            where: {
                teamMembers: {
                    has: email
                }
            }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const members = await prisma.user.findMany({
            where: {
                email: {
                    in: team.teamMembers
                }
            },
            select: {
                email: true,
                name: true,
                regNo: true
            }
        });

        // Replace teamMembers array of strings with array of objects
        const teamWithMembers = {
            ...team,
            teamMembers: members
        };

        res.json({ team: teamWithMembers });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/submit-ps', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { problemStatementId } = req.body;

        if (!problemStatementId) {
            return res.status(400).json({ error: 'Problem Statement ID is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.hasTeam || !user.isTeamLeader) {
            return res.status(403).json({ error: 'Only team leader can submit/update problem statement' });
        }

        const team = await prisma.team.findFirst({
            where: {
                teamMembers: {
                    has: email
                }
            }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const updatedTeam = await prisma.team.update({
            where: { teamId: team.teamId },
            data: { problemStatementId }
        });

        res.json({
            message: 'Problem statement submitted successfully',
            team: updatedTeam
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
