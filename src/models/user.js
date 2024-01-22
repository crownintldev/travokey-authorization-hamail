"use strict";
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// const secretKey = process.env.SECRET_KEY;

var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email address is required"],
      validate: [validateEmail, "Please fill a valid email address"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    profileImageUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "active", "block", "deleted", "rejected"],
      default: "pending",
    },
    forgetPasswordAuthToken: {
      type: String,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    branch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    // accountSetupStatus: {
    //   type: String,
    //   enum: ["pending", "completed"],
    //   default: "pending",
    // },

    // accountType: {
    //   type: String,
    //   enum: ["administrative", "staff"],
    //   required: [true, "Account Type is required"],
    // },
    // dbConfig: {
    //   type: String,
    //   enum: ["desktopSynchronize", "cloudBase", "desktopApp"],
    //   default: "cloudBase",
    // },
    // dbAccess: {
    //   type: String,
    //   enum: ["allowed", "denied"],
    //   default: "denied",
    // },
    // dbEngine: {
    //   type: String,
    //   enum: ["mongodb"],
    //   default: "mongodb",
    // },
    // paymentDetails: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "PaymentDetail",
    // },

    lastLogin: {
      type: Date,
    },
    accountActivationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

//===================== Password hash middleware =================//
UserSchema.methods.hashing = async function () {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
  } catch (err) {
    // Handle the error appropriately, e.g., log or throw an error
    throw err;
  }
};

//===================== Helper method for validating user's password =================//
UserSchema.methods.comparePassword = async function comparePassword(
  plaintextPassword
) {
  try {
    const isMatch = await bcrypt.compare(plaintextPassword, this.password);
    return isMatch;
  } catch (error) {
    console.log("=========== Error in Comparing Password", error);
    return false;
  }
};

UserSchema.methods.generateAuthToken = async function () {
  let user = this;
  let access = "auth";

  try {
    let token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.authTokenExpiresIn || "9d",
    });
    this.tokens = this.tokens.concat({ token });
    return token;
  } catch (error) {
    console.log("error on token assign", error);
    // res.send("error on token assign", error);
  }
};

// Export the User model
module.exports = mongoose.model("User", UserSchema);
