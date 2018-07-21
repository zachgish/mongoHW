var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;


var app = express();

var port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static("public"));


mongoose.connect("mongodb://heroku_rrj9mlws:hqtd47rrelr7d7srn9hpdpa0bj@ds163721.mlab.com:63721/heroku_rrj9mlws");
var db = mongoose.connection;


db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});


db.once("open", function () {
    console.log("Mongoose connection successful.");
});



app.get("/scrape", function (req, res) {
    request("http://www.espn.com", function (error, response, html) {
        var $ = cheerio.load(html);

        $("ul.headlineStack__list li").each(function (i, element) {


            var result = {};


            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");

            var entry = new Article(result);


            entry.save(function (err, doc) {
                if (err) {
                    console.log(err);
                }

                else {
                    console.log(doc);
                }
            });

        });
    });

    res.send("Scrape Complete");
});

app.get("/articles", function (req, res) {

    Article.find({}, function (error, doc) {

        if (error) {
            console.log(error);
        }

        else {
            res.json(doc);
        }
    });
});


app.get("/articles/:id", function (req, res) {

    Article.findOne({ "_id": req.params.id })

        .populate("note")

        .exec(function (error, doc) {

            if (error) {
                console.log(error);
            }

            else {
                res.json(doc);
            }
        });
});



app.post("/articles/:id", function (req, res) {

    var newNote = new Note(req.body);


    newNote.save(function (error, doc) {

        if (error) {
            console.log(error);
        }

        else {

            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })

                .exec(function (err, doc) {

                    if (err) {
                        console.log(err);
                    }
                    else {

                        res.send(doc);
                    }
                });
        }
    });
});


app.listen(port, function () {
    console.log("App running on " + port + "!");
});