'use strict';

require('dotenv').config();

var express = require('express');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

var cors = require('cors');

var app = express();

// Connect to mongodb server
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Create url-shortener schema
const Schema = mongoose.Schema;

const shortenedUrlSchema = new Schema({
  url: String
});

const ShortenedUrl = mongoose.model('ShortenedUrl', shortenedUrlSchema);

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// url shortener POST API
app.post('/api/shorturl/new', function (req, res) {
  if (!isURL(req.body.url)) {
    return res.json({"error":"invalid URL"});
  }
  
  const url = new URL(req.body.url);

  dns.lookup(url.host, (err, address, family) => {
    if (err) return res.json({"error":"invalid URL"});
    
    const shortUrlDocument = new ShortenedUrl({url: req.body.url});

    shortUrlDocument.save(function (err, data) {
      if (err) return console.log(err);
      
      // Well, using the document ID does not make the URL particularly shorter but whatever :-)
      res.json({"original_url": data.url,"short_url": data._id});
    });
  });
});

// shortened url GET API
app.get('/api/shorturl/:id', function (req, res) {
  ShortenedUrl.findById(req.params.id, function (err, data) {
    if (err) return res.json({"error": "invalid short url"});
    
    res.redirect(data.url);
  });
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});

// some helper/validator functions

// https://stackoverflow.com/a/22648406
function isURL(str) {
     var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
     var url = new RegExp(urlRegex, 'i');
     return str.length < 2083 && url.test(str);
}
