const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const userRoutes = require('./routes/user.routes');
const teamRoutes = require('./routes/team.routes');
const submissionRoutes = require('./routes/submission.routes');
const roundRoutes = require('./routes/round.routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/rounds', roundRoutes);

app.get('/api/v1', (req, res) => {
    res.json({
        message: 'YCH 26 Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;