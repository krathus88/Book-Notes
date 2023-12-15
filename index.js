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

app.get("/", async (req, res) => {
    try {
        activePage = "Home";

        // Retrieve all authors excluding the ID
        const authorsQuery = await db.query("SELECT id, author_name FROM authors");

        // Retrieve all books excluding the ID
        const booksQuery = await db.query("SELECT id, book_value_type, book_value, book_title, book_date_read, book_rating, author_id, user_input FROM books ORDER BY book_rating DESC, book_date_read DESC");

        res.render("index.ejs", { 
            activePage: activePage,
            authors: authorsQuery.rows,
            books: booksQuery.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
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
    const authorValueType = req.body.authorValueType;
    const authorValue = req.body.authorValue;
    const authorName = req.body.authorName;
    const bookValueType = req.body.bookValueType;
    const bookValue = req.body.bookValue;
    const bookTitle = req.body.bookTitle;
    const bookDateRead = req.body.bookDateRead;
    const bookRating = req.body.bookRating;
    const userInput = req.body.userInput;
    
    try {
        // Check if author already exists
        const existingAuthorQuery = await db.query("SELECT id FROM authors WHERE author_value_type = $1 AND author_value = $2", [authorValueType, authorValue]);

        let authorId;

        if (existingAuthorQuery.rows.length > 0) {
            // Author already exists, retrieve the existing author's ID
            authorId = existingAuthorQuery.rows[0].id;
        } else {
            // Author doesn't exist, insert a new author and get the new author's ID
            const newAuthorResult = await db.query("INSERT INTO authors (author_value_type, author_value, author_name) VALUES ($1, $2, $3) RETURNING id",
                [authorValueType, authorValue, authorName]);

            authorId = newAuthorResult.rows[0].id;
        }
        
        // Check if the book already exists
        const existingBookQuery = await db.query("SELECT id FROM books WHERE book_value_type = $1 AND book_value = $2 AND author_id = $3", [bookValueType, bookValue, authorId]);

        if (existingBookQuery.rows.length > 0) {
            // Book already exists
            console.log("Book already registered, please edit instead.");
        } else {
            // Book doesn't exist, insert a new book and get the new book's ID
            await db.query("INSERT INTO books (book_value_type, book_value, book_title, book_date_read, book_rating, author_id, user_input) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [bookValueType, bookValue, bookTitle, bookDateRead, bookRating, authorId, userInput]);
        }
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.post("/savePost", async (req, res) => {
    const id = req.body.id;
    const editedContent = req.body.editedContent.trim();
    const editedDate = req.body.editedDate.trim();
    const editedRecommended = req.body.editedRecommended.trim();
    try {
        const data = await db.query(
            "UPDATE books SET book_date_read = $1, book_rating = $2, user_input = $3 WHERE id = $4 RETURNING book_date_read",
            [editedDate, editedRecommended, editedContent, id]
        );
        const updatedDate = data.rows[0].book_date_read;
        const formattedDate = new Date(updatedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        res.json({ success: true, updatedTextBody: editedContent, updatedDate: formattedDate, updatedRecommended: editedRecommended });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error updating the database" });
    }
});

app.post("/deletePost", async (req, res) => {
    const id = req.body.id;

    try {
        // Retrieve author_id before deleting
        const authorId = await db.query("SELECT author_id FROM books WHERE id = $1", [id]);
        
        // Delete Post
        await db.query("DELETE FROM books WHERE id = $1", [id]);
        
        // Count the remaining records with the same author_id
        const countResult = await db.query("SELECT COUNT(*) FROM books WHERE author_id = $1", [authorId]);
        const remainingRecords = parseInt(countResult.rows[0].count);

        if (remainingRecords === 0) {
            // Deletes author record if there's no more book entries from that author
            await db.query("DELETE FROM authors WHERE id = $1", [authorId]);
        }

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Close the database connection when the server is shutting down
process.on('SIGINT', async () => {
    await db.end(); // Close the database connection
    console.log('Database connection closed');
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
