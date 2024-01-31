const express = require("express");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { requireSignin, appCheckPost } = require("./middleware/auth-middleware");

const cors = require("cors");
require("dotenv").config();

const { connectdb } = require("@tablets/express-mongoose-api");
connectdb();

const app = express();
app.use(logger("dev"));

const allowedOrigins = [
  "http://localhost:4000",
  "http://localhost:3000",
  "http://yet-another-origin.com",
];

app.use(cors({
  credentials: true,
  origin: true 
}));
// app.use(cors({
//   origin: function (origin, callback) {
//     // allow requests with no origin (like mobile apps, curl requests)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true
// }));
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

const auth = require("./routes/auth");
const user = require("./routes/user");
const role = require("./routes/role");
const permission = require("./routes/permission");
const branch = require("./routes/branch");

//routes
app.use("/api", auth);
app.use("/api", user);
app.use("/api",role);
// app.use("/api", requireSignin,permission);
app.use("/api", branch);

app.listen(port, () => {
  console.log(
    `App is running:: \naddress: http://localhost:${port}/api \nport: ${port}`
  );
});
