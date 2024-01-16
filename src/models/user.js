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
    status: {
      type: String,
      enum: ["pending", "active", "block", "delete", "rejected"],
      default: "pending",
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
    tokenVersion: {
      type: Number,
      default: 0,
    },
    forgetPasswordAuthToken: {
      type: String,
    },
    token: {
      type: String,
    },
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
    // role: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Role",
    //   required: [true, "Role is required"],
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
UserSchema.pre("save", async function save(next) {
  const user = this;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    next();
  } catch (err) {
    return next(err);
  }
});

//===================== Helper method for validating user's password =================//
UserSchema.methods.comparePassword = async function comparePassword(
  plaintextPassword
) {
  try {
    const isMatch = await bcrypt.compare(plaintextPassword, this.password);
    return isMatch;
  } catch (error) {
    console.log("=========== Error in Comparing Password", error);
  }
};

UserSchema.methods.generateAuthToken = async function (extra = "") {
  let user = this;
  let access = "auth";

  let token = jwt
    .sign(
      {
        _id: user._id.toHexString(),
        access,
        email: user.email,
      },
      secretKey,
      {
        expiresIn: process.env.authTokenExpiresIn,
      }
    )
    .toString();
  user.token = token;
  user.lastLogin = new Date();
  return user.save().then(() => {
    return token;
  });
};

UserSchema.statics.findByToken = function (token) {
  let User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return Promise.reject(error);
  }

  return User.findOne({
    _id: decoded._id,
    token: token,
  });
};

// Export the User model
module.exports = mongoose.model("User", UserSchema);

