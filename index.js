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
var dns = require('dns')
const URL = require('url').URL;
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

app.get("/exercise-tracker", function (req, res) {
  res.sendFile(__dirname + "/views/exercise-tracker.html");
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

{/* app.get("/api/:date_string", function (req, res) {
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
    res.json({ 'error': "Invalid id" });
  } else {
    res.json({
      unix: passedValue.getTime(),
      utc: passedValue.toUTCString(),
    })
  }
}); */}



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
const mongooseURL = mongoose.model('URL', urlSchema);


app.post("/api/shorturl", async function(req, res){
  const clientRequestUrl = req.body.url
  const suffix = shortid.generate()

  const urlObject = new URL(clientRequestUrl)

  dns.lookup(urlObject.hostname, async (err) => { 
    if (err) {
      res.json({
        error: 'Invalid URL'
      })
  } else {
    try {
      let findOne = await mongooseURL.findOne({
        original_url: clientRequestUrl,
        short_url: suffix
      })
      if (findOne) {
        res.json({
          original_url:findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new mongooseURL({
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
});

app.get("/api/shorturl/:suffix?", async (req, res) => {
  try {
  const userGeneretedSuffix = await mongooseURL.findOne({
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
});

//Exercise tracker

const ExerciseUser = mongoose.model('ExerciseUser', new Schema({
  username: { type: String, required: true },
}));

const NewExercise = mongoose.model('NewExercise', new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
}))

const logSchema = mongoose.model('LogUser', new Schema({
  username : String,
  count: Number,
  log: Array
}))

app.post("/api/users", (req, res) => { let exerciseUser = new ExerciseUser({ username: req.body.username });
    exerciseUser.save((err, doc) => {
      if (err || !doc) {
        res.send("there is an error saving the user")
      }
      res.json({
        username: exerciseUser.username,
        _id: exerciseUser._id
      });
    });    
  });

  app.get("/api/users",  (req, res) => {
    ExerciseUser.find({}, (err, exerciseUser) => err ? console.log(err) : res.json(exerciseUser));
  });

  
  app.post("/api/users/:_id/exercises", (req, res) => {
    const idJson = { "_id": req.params._id};
    const idToCheck = idJson._id
    let date = req.body.date
    if (!date ){
      date = new Date().toISOString().substring(0, 10)      
    }   
    

    ExerciseUser.findById(idToCheck, (err, userData) => {
      if (err || !userData){
      res.send("Could not find user");
    } else {
      
        const newExe = new NewExercise({
        username: userData.username,
        description : req.body.description,
        duration: Number(req.body.duration),
        date: new Date(date).toDateString()
      })

      newExe.save((err, data) => {
        if (err) {
          console.log("could not save new exercise")
        } else {          
          res.json({
            username: data.username,
            description: data.description,
            duration: data.duration,
            date: data.date.toDateString(),
            _id: idToCheck
          })
        }
      })
    }
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
 const {from, to, limit} = req.query;
 let userId = req.params._id;

 ExerciseUser.findById(userId, (err, data) => {
   let query = {
     username: data.username
   }

   if (from !== undefined && to === undefined){
     query.date = {$gte: new Date(from)}
   } else if (to !== undefined && from === undefined) {
      query.date = {$lte: new Date(to) }
   } else if (from !== undefined && to !== undefined) {
     query.date = {$gte: new Date(from), $lte: new Date(to)}
   }

   let limitChecker = (limit) => {
     let maxLimit = 100;
     if (limit) {
       return limit;
     } else {
       return maxLimit;
     }
   }

   if (err) {
     console.log(err)
   } else {
     NewExercise.find((query), null, {limit: limitChecker(+limit)}, (err, docs) => {
       let loggedArray = [];
       if (err) {
         console.log("error with query => ", err)
       } else {
         let documents = docs;
         let loggedArray = documents.map((item) => {
           return {
             description: item.description,
             duration: item.duration,
             date: item.date.toDateString()
           }
         });
         
         const test = new logSchema({
           username: data.username,
           count: loggedArray.length,
           log: loggedArray
         })

         test.save((err, save) => {
           if(err) {
             console.log("error saving exercise => ", err);
           } else {
             res.json({
               _id: userId,
               username: save.username,
               count: save.count,
               log: loggedArray
             })
           }
         })
       }
     })
   }
 })
})

// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
