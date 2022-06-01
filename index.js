// index.js
// where your node app starts

// init project
var express = require("express");
var mongodb = require('mongodb');
var mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
var shortid = require('shortid')
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

var schema = mongoose.Schema 


// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
const { acceptsLanguages } = require("express/lib/request");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use("/public", express.static(__dirname + "/public"));

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


app.get("/url-shortener-microservice", function (req, res) {
  res.sendFile(__dirname + "/views/url-shortener-microservice.html");
});



// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

//Header parser
app.get("/api/whoami", function (req, res) {
  res.json({
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers['accept-language'],
    "software": req.headers['user-agent']
  });
});

//Timestamp project
app.get("/api", (req, res) => {
  let now = new Date();

  res.json({
    unix: now.getTime(),
    utc: now.toUTCString(),
  });
});

app.get("/api/:date_string", function (req, res) {
  let dateString = req.params.date_string;

  if (parseInt(dateString) > 10000) {
    let unixTime = new Date(parseInt(dateString));
    res.json({
      unix: unixTime.getTime(),
      utc: unixTime.toUTCString()
    });
  }

  let passedValue = new Date(dateString);

  if (passedValue == "Invalid Date") {
    res.json({ 'error': "Invalid Date" });
  } else {
    res.json({
      unix: passedValue.getTime(),
      utc: passedValue.toUTCString(),
    })
  }
});



//Url Shortener Service



// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

let dataSchema = new schema({
  short_url: String,
  original_url: String,
  suffix: String
});

const shortURL = mongoose.model('ShortUrl', dataSchema);

app.post("/api/shorturl", function(req, res){

  let clientRequestUrl = req.body.url;
  let suffix = shortid.generate();

  let newUrl = new shortURL({
    short_url: __dirname + "/api/shorturl/" + suffix,
    original_url: clientRequestUrl,
    suffix: suffix
  })

  newUrl.save((err, doc) => {
    if (err) return console.log(err)
    res.json({
      'short_url': newUrl.short_url,
      'original_url': newUrl.original_url,
      'suffix': newUrl.suffix
    });
  });
});

app.get("/api/shorturl/:suffix", (req, res) =>{
  let userGeneratedSuffix = req.params.suffix;

  shortURL.find({suffix: userGeneratedSuffix }).then(foundUrls =>{
    let urlForRedirect = foundUrls[0];
    res.redirect(urlForRedirect.original_url);
  });
});


// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
