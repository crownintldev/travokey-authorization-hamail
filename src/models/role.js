const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    title:{
      type: String,
      unique: true,
      required: [true,"role title is missing"],
    },
    list: {
      type: Array,
      required: true,
    },
    chooseApp: {
      type: String,
      enum: ["administrator", "account"],
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.pre("save", function (next) {
  // Ensure uniqueness at the element level
  const uniqueValues = new Set(this.list);
  this.list = Array.from(uniqueValues);

  next();
});


const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
