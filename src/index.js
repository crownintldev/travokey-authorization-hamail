const express = require("express");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const {connectdb} = require("@tablets/express-mongoose-api")
connectdb()


const app = express();
app.use(logger("dev"));

app.use(cors());
app.use(express.json());
app.use(cookieParser()); 

// Enable sessions
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: true,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport");


const port = process.env.PORT || 9000;


const auth = require("./routes/auth")

//routes
app.use("/api", auth);



app.listen(port, () => {
  console.log(`App is running:: \naddress: http://localhost:${port}/api \nport: ${port}`);
});