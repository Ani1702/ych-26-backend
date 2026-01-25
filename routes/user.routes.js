const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const verifyToken = require('../middleware/verifyToken');

router.post('/create-user', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const {
            name,
            regNo,
            gender,
            hostelBlock,
            roomNo,
            mobileNo
        } = req.body;

        // Basic validation
        if (!name || !regNo || !gender || !hostelBlock || !roomNo || !mobileNo) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'regNo', 'gender', 'hostelBlock', 'roomNo', 'mobileNo']
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                regNo,
                gender,
                hostelBlock,
                roomNo,
                mobileNo,
                hasTeam: false,
                isTeamLeader: false
            }
        });

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /profile
// Check if user profile is completed/exists
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            return res.json({ profileCompleted: true, user });
        } else {
            return res.json({ profileCompleted: false });
        }
    } catch (error) {
        console.error('Profile Check Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
