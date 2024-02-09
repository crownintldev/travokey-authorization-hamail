const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "disable"],
    default: "active",
  },
  // added soft deleted field but its not applying due to security reason
  deleted:{
    type: String,
    enum: ['false','true','permanent'],
    default: "false"
  },
});

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
