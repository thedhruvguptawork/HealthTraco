const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password for login
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Document Schema
const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  filetype: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model('User', UserSchema);
const Document = mongoose.model('Document', DocumentSchema);

// Export both models
module.exports = { User, Document };
