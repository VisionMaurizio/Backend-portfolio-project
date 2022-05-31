// index.js
// where your node app starts

// init project
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
const { acceptsLanguages } = require("express/lib/request");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + "/views/timestamp.html");
});

app.get("/request-header-parser", function (req, res) {
  res.sendFile(__dirname + "/views/request-header-parser.html");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api", (req, res) => {
  let now = new Date();

  res.json({
    unix: now.getTime(),
    utc: now.toUTCString(),
  });
});

app.get("/api/whoami", function (req, res) {
  res.json({
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers['accept-language'],
    "software": req.headers['user-agent']
  });
});

app.get("/api/:date_string", function (req, res) {
  let dateString = req.params.date_string;

  if (parseInt(dateString) > 10000) {
    let unixTime = new Date(parseInt(dateString));
    res.json({
      unix: unixTime.getTime(),
      utc: unixTime.toUTCString(),
    });
  }

  let passedValue = new Date(dateString);

  if (passedValue == "Invalid Date") {
    res.json({ error: "Invalid Date" });
  } else {
    res.json({
      unix: passedValue.getTime(),
      utc: passedValue.toUTCString(),
    });
  }
});



// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
