const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file
const Document = require('../models/HealthRecord'); // Import Document model (adjust path if necessary)

// MongoDB connection function
const connectDB = async () => {
    try {
        // Use the URI from the .env file
        const MONGO_URI = process.env.MONGO_URI;

        // Connect to MongoDB
        const conn = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`Connected to MongoDB successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1); // Exit the process with failure
    }
};

// Example function for testing document upload logic
const testDocumentUpload = async () => {
    try {
        // Create a sample document for testing purposes
        const sampleDocument = new Document({
            userId: mongoose.Types.ObjectId(), // Dummy user ID for testing
            filename: 'example.pdf',
            filepath: 'uploads/example.pdf',
            filetype: 'application/pdf',
        });

        // Save the document to the database
        await sampleDocument.save();
        console.log('Sample document uploaded successfully:', sampleDocument);
    } catch (error) {
        console.error('Error uploading sample document:', error.message);
    }
};

// Call the test function only if required (commented out by default)
// Uncomment the below lines for testing purposes
// connectDB().then(() => {
//     testDocumentUpload();
// });

module.exports = connectDB;
