const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "disable"],
    default: "active",
  },
  ownUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
