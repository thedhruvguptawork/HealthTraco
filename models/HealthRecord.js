const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    documentName: { type: String, required: true }, // Add document name field
    uploadedAt: { type: Date, default: Date.now },
});


const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
