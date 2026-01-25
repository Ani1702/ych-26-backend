const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const verifyToken = require('../middleware/verifyToken');

// Helper to generate random alphanumeric code
const generateTeamCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// POST /create-team
router.post('/create-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { teamName } = req.body;

        if (!teamName) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        // Get full user details
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.hasTeam) {
            return res.status(400).json({ error: 'User is already in a team' });
        }

        // Generate unique team code
        let teamId = generateTeamCode();
        let isUnique = false;
        while (!isUnique) {
            const existingTeam = await prisma.team.findUnique({
                where: { teamId }
            });
            if (!existingTeam) isUnique = true;
            else teamId = generateTeamCode();
        }

        // Use transaction to ensure both operations succeed
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
        console.error('Create Team Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /join-team
router.post('/join-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { teamId } = req.body;

        if (!teamId) {
            return res.status(400).json({ error: 'Team code (teamId) is required' });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.hasTeam) {
            return res.status(400).json({ error: 'User is already in a team' });
        }

        // Check if team exists
        const team = await prisma.team.findUnique({
            where: { teamId }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Add member to team and update user
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
        console.error('Join Team Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /leave-team
router.post('/leave-team', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        // Find the team the user belongs to
        const team = await prisma.team.findFirst({
            where: {
                teamMembers: {
                    has: email
                }
            }
        });

        if (!team) {
            // Consistency check: if user hasTeam=true but no team found, fix user
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

        // Case 1: Team becomes empty -> Delete team
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

        // Case 2: Team still has members
        let newLeader = team.teamLeader;
        const transactionOperations = [];

        // Update leaving user
        transactionOperations.push(
            prisma.user.update({
                where: { email },
                data: { hasTeam: false, isTeamLeader: false }
            })
        );

        // Handle Leadership
        if (team.teamLeader === email) {
            newLeader = newMembers[0]; // Assign to first remaining member
            // Update new leader's user profile
            transactionOperations.push(
                prisma.user.update({
                    where: { email: newLeader },
                    data: { isTeamLeader: true }
                })
            );
        }

        // Update Team with new members and potential new leader
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
        console.error('Leave Team Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
