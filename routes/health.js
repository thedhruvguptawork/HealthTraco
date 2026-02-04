const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcrypt');

// Home Page
router.get('/', (req, res) => {
    res.render('index');
});

// Dashboard Page
router.get('/dashboard', async (req, res) => {
    const records = await HealthRecord.find({});
    res.render('dashboard', { records });
});

// Upload Page
router.get('/upload', (req, res) => {
    res.render('upload');
});

// Handle Upload
router.post('/upload', async (req, res) => {
    const { name, age, email, document } = req.body;
    const newRecord = new HealthRecord({ name, age, email, document });
    await newRecord.save();
    res.redirect('/dashboard');
});

// Signup Page
router.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validate input
        if (!username || !password || !email) {
            return res.status(400).send('All fields are required');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Redirect to dashboard or login page after successful signup
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
