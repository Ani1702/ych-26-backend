const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

const userRoutes = require('./routes/user.routes');
const teamRoutes = require('./routes/team.routes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'YCH 26 Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
