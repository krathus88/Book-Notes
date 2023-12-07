import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org";
/* 
https://covers.openlibrary.org/b/$key/$value-$size.jpg  || Book Covers
    key | can be any one of ISBN, OCLC, LCCN, OLID and ID (case-insensitive)
    value | is the value of the chosen key
    size | can be one of S, M and L for small, medium and large respectively.
https://covers.openlibrary.org/a/$key/$value-$size.jpg  || Author Photos
    key | can be accessed using OLID and ID only.
*/

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Handles the selected active page displayed on the header
let activePage = "Home";
const textTitle = [];
const textBody = [];

app.get("/", (req, res) => {
    activePage = "Home";
    res.render("index.ejs", { 
        activePage: activePage,
        textTitle: textTitle,
        textBody: textBody,
    });
});

app.get("/create-new-post", (req, res) => {
    activePage = "CreateNewPost";
    res.render("create-new-post.ejs", { activePage });
});

app.get("/about", (req, res) => {
    activePage = "About";
    res.render("about.ejs", { activePage });
});

app.post("/publish-thoughts", async (req, res) => {
    const authorID = req.body.authorId;
    const authorValue = req.body.authorValue;
    const authorName = req.body.authorName;
    const bookId = req.body.bookId;
    const bookValue = req.body.bookValue;
    const bookDateRead = req.body.bookDateRead;
    const bookRating = req.body.bookRating;
    const bookTitle = req.body.bookTitle;
    const userInput = req.body.userInput;

    
    res.redirect("/");
});

app.post("/savePost", (req, res) => {
    const index = req.body.index;
    const editedContent = req.body.editedContent;
    textBody[index] = editedContent.trim();
    res.json({ success: true, updatedTextBody: textBody });
});

app.post("/deletePost", (req, res) => {
    const index = req.body['index'];
    textTitle.splice(index, 1);
    textBody.splice(index, 1);
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
