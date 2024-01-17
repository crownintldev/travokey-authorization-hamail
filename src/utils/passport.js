const User = require("../models/user");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const userModel = User;

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await userModel.findOne({ email: email });
        if (!user) {
          console.log("passport: User not found");
          return done(null, false, { message: "Incorrect email." });
        }
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (error) {
        console.log(error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
