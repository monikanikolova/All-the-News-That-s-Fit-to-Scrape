const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./model");

const PORT = process.env.PORT || 3000;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);


// Routes

app.get("/", function (req, res) {
  res.json(path.join(__dirname, "/index.html"));
});

// A GET route for scraping the Wall street journal website
app.get("/scrape", (req, res) => {
  // First, we grab the body of the html with axios
  axios.get("https://www.wsj.com/").then((response) => {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    // console.log(response.data);
    const $ = cheerio.load(response.data);


    // Now, we grab every h3 within an article tag, and do the following:
    $("h3.wsj-headline").each((i, element) => {
      // Save an empty result object

      // console.log(i)
      // console.log(element)
      const result = {};


      // Add the text and href of every link, and save them as properties of the result object
      result.headline = $(element)
        .children("a")
        .text();
      result.summary = $(element)
        .children("a")
        .text();
      result.URL = $(element)
        .children("a")
        .attr("href");

      console.log(result)

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then((dbArticle) => {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch((err) => {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.redirect("/");
    // res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", (req, res) => {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then((dbArticle) => {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch((err) => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", (req, res) => {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comment")
    .then((dbArticle) => {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch((err) => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// save an article
app.post('/save/:id', function (req, res) {
  Article.findByIdAndUpdate(req.params.id, {
    $set: { saved: true }
  },
    { new: true },
    function (error, doc) {
      if (error) {
        console.log(error);
        res.status(500);
      } else {
        res.redirect('/');
      }
    });
});
// get all saved articles
app.get('/saved', function (req, res) {
  var html = "";
  db.Article
    .find({})
    .where('saved').equals(true)
    .where('deleted').equals(false)
    .populate('notes')
    .exec(function (error, docs) {
      if (error) {
        console.log(error);
        res.status(500);
      } else {
        for (var i = 0; i < docs.length; i++) {
          html += `<div class="card text-white bg-info mb-3">
              <div class="card-header">
                  <h3 class="title">${docs[i].headline}</h3>
                  <a class="link" href="${docs[i].URL}">View Full Article</a>
                  <button class="btn btn-secondary saveArticle data-id='${data[i]._id}'">Save Article</button>
              </div>
          </div>`
        }
        res.status(200).json(html);
      }
    });
});


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
