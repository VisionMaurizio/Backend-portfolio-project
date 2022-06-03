// index.js
// where your node app starts

// init project
'use strict'
var express = require("express");
var mongodb = require('mongodb');
var mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
var shortid = require('shortid')
var bodyParser = require('body-parser');
var validUrl = require('valid-url')
var app = express();
var port = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error'));
connection.once('open',() => {
  console.log("mongoDB database connection enstablished successfully")
})

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
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

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
}) 
const URL = mongoose.model('URL', urlSchema);


app.post("/api/shorturl", async function(req, res){
  let clientRequestUrl = req.body.url_input
  let suffix = shortid.generate()

  if (!validUrl.isWebUri(clientRequestUrl)){
    res.status(401).json({
      error: 'Invalid URL'
    })
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: clientRequestUrl,
        short_url: suffix
      })
      if (findOne) {
        res.json({
          original_url:findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: clientRequestUrl,
          short_url: suffix
        })
       await findOne.save()
       res.json({
         original_url: findOne.original_url,
         short_url: findOne.short_url
       }) 
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server error...')
    }
  }
});

app.get("/api/shorturl/:suffix?", async (req, res) => {
  try {
  const userGeneretedSuffix = await URL.findOne({
    short_url: req.params.suffix
  })
  if (userGeneretedSuffix) {
    return res.redirect(userGeneretedSuffix.original_url)
  } else {
    return res.status(404).json('No URL found')
  }
} catch (err) {
  console.log(err)
  res.status(500).json('Server error')
}
})


// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
