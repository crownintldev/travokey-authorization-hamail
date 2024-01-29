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
    username: {
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
        device: {
          type: String,
        },
      },
    ],
    roles: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    // permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    appPermissions: {
      type: [String],
      enum: ["administrator", "account"],
    },
    // "evisa","flight","hotel booking"
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
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

UserSchema.statics.hashing = async function (data) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);
    data.password = hash;
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

UserSchema.methods.generateAuthToken = async function (req,res) {
  let user = this;
  const device = req.headers["user-agent"] + req.ip;
  try {
    let token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.authTokenExpiresIn || "9d",
    });
    // this.tokens = this.tokens.concat({ token });

    // Check if a token for this device already exists
    let existingTokenIndex = user.tokens.findIndex((t) => t.device === device);
    if (existingTokenIndex !== -1) {
      // Update existing token
      user.tokens[existingTokenIndex].token = token;
    } else {
      // Add new token
      user.tokens.push({ token, device });
    }
    // set jwt cookie
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      // secure: true, // Recommended for production (requires HTTPS)
      // sameSite: 'lax' // Adjust according to your needs
    });
    return token;
  } catch (error) {
    console.log("error on token assign", error);
    // res.send("error on token assign", error);
  }
};

// Export the User model
module.exports = mongoose.model("User", UserSchema);
