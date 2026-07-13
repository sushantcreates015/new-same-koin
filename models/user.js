const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 12
  },

  password: {
    type: String,
    required: true
  },

  expiresAt: {
    type: Date,
    required: true
  },

  sessionToken: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "active"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);