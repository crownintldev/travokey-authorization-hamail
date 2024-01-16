// Here's a simple example of how sessions might be used in an Express application:

const express = require('express');
const session = require('express-session');

const app = express();

app.use(
  session({
    secret: 'your-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/setSession', (req, res) => {
  req.session.username = 'example_user';
  res.send('Session set');
});

app.get('/getSession', (req, res) => {
  const username = req.session.username || 'No session data';
  res.send(`Session username: ${username}`);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
