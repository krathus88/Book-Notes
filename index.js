import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

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

app.post("/", (req, res) => {
    textTitle.push(req.body['tTitle']);
    // Trim empty spaces at the start and end of string
    textBody.push(req.body['tBody'].trim());
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
