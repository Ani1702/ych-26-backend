const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const verifyToken = require('../middleware/verifyToken');

// router.post('/create-profile', verifyToken, async (req, res) => {
//     try {
//         const { email } = req.user;
//         const {
//             name,
//             regNo,
//             gender,
//             school,
//             branch,
//             hostelBlock,
//             roomNo,
//             mobileNo
//         } = req.body;

//         if (!name || !regNo || !gender || !school || !branch || !hostelBlock || !mobileNo) {
//             return res.status(400).json({
//                 error: 'Missing required fields',
//                 required: ['name', 'regNo', 'gender', 'school', 'branch', 'hostelBlock', 'mobileNo']
//             });
//         }

//         const existingUser = await prisma.user.findUnique({
//             where: { email }
//         });

//         if (existingUser) {
//             return res.status(400).json({ error: 'User already exists' });
//         }

//         const newUser = await prisma.user.create({
//             data: {
//                 email,
//                 name,
//                 regNo,
//                 gender,
//                 school,
//                 branch,
//                 hostelBlock,
//                 roomNo,
//                 mobileNo,
//                 hasTeam: false,
//                 isTeamLeader: false
//             }
//         });

//         res.status(201).json({
//             message: 'User created successfully',
//             user: newUser
//         });

//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//         console.log(error);
//     }
// });

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
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
});

module.exports = router;
