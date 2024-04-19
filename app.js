const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();

const username = process.env.DB_USER;
const password = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.cwfhadh.mongodb.net/noteDB`);
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(express.json())

// Using Session to store data
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "stickynotes"
}))

// Schemas
const noteSchema = new mongoose.Schema({
    title: String,
    description: String,
    color: String
})
const binSchema = new mongoose.Schema({
    title: String,
    description: String,
    route: String,
    color: String
})

// Models
const Note = mongoose.model("Note", noteSchema);
const Archive = mongoose.model("Archive", noteSchema);
const Bin = mongoose.model("Bin", binSchema);


// -----------: Note or Home route :------------

app.get("/", (req,res)=> {
    Note.find({})
            .then(function(result) {
                res.render("index", {notes: result})
            })
            .catch(function(err) {
                console.log(err);
            })
})

// Addind new note
app.post("/", (req,res)=> {
    const noteTitle = req.body.title;
    const noteDesc = req.body.description;
    const noteColor = req.body.notecolor;
    
    const note = new Note({
        title: noteTitle,
        description: noteDesc,
        color: noteColor
    })

    Note.insertMany(note)
            .then(function() {
                console.log("Saved a new note");
            })
            .catch(function(err) {
                console.log(err);
            })
    res.redirect("/");
})

// --------------: Archive Route :------------------

app.get("/archive", (req, res)=> {
    Archive.find({})
            .then(function(result) {
                res.render("archive", {notes: result})
            })
            .catch(function(err) {
                console.log(err);
            })
})

// Archive a note
app.post("/archive", (req, res)=> {
    noteId = req.body.archiveNote;

    Note.findByIdAndDelete(noteId)
            .then(function(result) {    
                Archive.insertMany(result)
                        .then(function() {
                            console.log("Note archived");
                            res.redirect("/");
                        })
                        .catch(function(err) {
                            console.log(err);
                        })
            })
            .catch(function(err) {
                console.log(err);
            })

})

// Unarchive a note
app.post("/unarchive", (req, res)=> {
    noteId = req.body.unArchiveNote;

    Archive.findByIdAndDelete(noteId)
    .then(function(result) {
        Note.insertMany(result)
                .then(function() {
                    console.log("Note archived");
                    res.redirect("/archive")
                })
                .catch(function(err) {
                    console.log(err);
                })
    })
    .catch(function(err) {
        console.log(err);
    })

})


// -------: Move a Note to Trash from any route :-----------

app.post("/bin", (req, res)=> {
    const noteId = req.body.trashNote;
    const routeName = req.body.route;

    if(routeName == "Note") {
        Note.findByIdAndDelete(noteId)
                .then(function(result) {    // Here result is an object (findById returns object)

                    // Saving note in bin the route name
                    const binNote = new Bin({
                        title: result.title,
                        description: result.description,
                        route: routeName,
                        color: result.color
                    })
                    Bin.insertMany(binNote)
                        .then(function() {
                            console.log("Note trashed");
                            res.redirect("/");
                        })
                        .catch(function(err) {
                            console.log(err);
                        })
                })
                .catch(function(err) {
                    console.log(err);
                })
    } 
    else {
        Archive.findByIdAndDelete(noteId)
                .then(function(result) {

                    // Saving note in bin the route name
                    const binNote = new Bin({
                        title: result.title,
                        description: result.description,
                        route: routeName,
                        color: result.color
                    })
                    Bin.insertMany(binNote)
                        .then(function() {
                            console.log("Note trashed");
                            res.redirect("/archive");
                        })
                        .catch(function(err) {
                            console.log(err);
                        })
                })
                .catch(function(err) {
                    console.log(err);
                })         
    }
})


// --------------: Bin route :-----------------

app.get("/bin", (req,res)=> {
    Bin.find({})
        .then(function(result) {
            res.render("bin", {notes: result});
        })
        .catch(function(err) {
            console.log(err);
        })
})

app.post("/deletebin", (req, res)=> {
    const noteId = req.body.deleteNote;
    Bin.findByIdAndDelete(noteId)
            .then(function() {
                console.log("Trash deleted");
                res.redirect("/bin");
            })
            .catch(function(err) {
                console.log(err);
            })
})

app.post("/restore", (req, res)=> {
    const noteId = req.body.restoreNote;

    // Delete from Bin and Move back to its original route
    Bin.findByIdAndDelete(noteId)
            .then(function(result) {

                if(result.route == "Note") {
                    Note.insertMany(result)
                            .then(function() {
                                console.log("Restored to note route");
                            })
                            .catch(function(err) {
                                console.log(err)
                            })
                }
                else {
                    Archive.insertMany(result)
                            .then(function() {
                                console.log("Restored to note route");
                            })
                            .catch(function(err) {
                                console.log(err)
                            })
                }

                res.redirect("/bin");
            })
            .catch(function(err) {
                console.log(err);
            })
})


// -----------: Search route :--------------

app.post("/search", (req, res)=> {

    const noteSearch = req.body.searchText.toLowerCase();
    const route = req.body.route;
    let newResult = [];     // Storing the searching note in a new array

    // Promise chain
    if(route == "Bin") {
        Bin.find({})
            .then(function(result) {

                for(let i=0;i<result.length;i++) {
                    let title = result[i].title.toLowerCase();
                    let description = result[i].description.toLowerCase();
                    
                    if(title.includes(noteSearch) || description.includes(noteSearch)) {  // if noteSearch is a subtring of note title/description or not
                        newResult.push(result[i]);  // pushing the found note in newResult array
                    }        
                }
                
                res.render("search", {notes: newResult});
            })
    }
    else {
        Note.find({})
            .then(function(result) {

                for(let i=0;i<result.length;i++) {
                    let title = result[i].title.toLowerCase();
                    let description = result[i].description.toLowerCase();
                    
                    if(title.includes(noteSearch) || description.includes(noteSearch)) {  // if noteSearch is a subtring of note title/description or not
                        newResult.push(result[i]);  // pushing the found note in newResult array
                    }        
                }
            })
            .then(function() {
                Archive.find({})
                    .then(function(result) {

                        for(let i=0;i<result.length;i++) {
                            let title = result[i].title.toLowerCase();
                            let description = result[i].description.toLowerCase();
                            
                            if( title.includes(noteSearch) || description.includes(noteSearch) ) {  
                                newResult.push(result[i]);  
                            }          
                        }
                        res.render("search", {notes: newResult});
                    })
                    .catch(function(err) {
                        console.log(err);
                    })
            })
            .catch(function(err) {
                console.log(err);
            })
    }
    
})


// -----------: Edit Note :------------

app.post("/edit", (req, res)=> {
    const noteId = req.body.editNote;
    const routeName = req.body.route;

    req.session.noteid = noteId;
    req.session.routename = routeName;

    res.redirect(`/editnote:${noteId}`);
})

app.get("/editnote:note", (req,res)=> {
    
    const noteId = req.session.noteid;
    const routeName =  req.session.routename;

    if(routeName == "Note") {
        Note.findById(noteId)
            .then(function(result) {
                res.render("edit", {note: result})
            })
            .catch(function(err) {
                console.log(err);
            })
    }
    else {
        Archive.findById(noteId)
            .then(function(result) {
                res.render("edit", {note: result})
            })
            .catch(function(err) {
                console.log(err);
            })
    }
})

app.post("/save", function(req, res) {
    const noteTitle = req.body.title;
    const noteDesc = req.body.description;
    const noteColor = req.body.notecolor;

    const noteId = req.session.noteid;
    const routeName =  req.session.routename;

    if(routeName == "Note") {
        Note.findByIdAndUpdate(noteId, {title: noteTitle, description: noteDesc, color: noteColor})
            .then(function() {
                console.log("Note edited");
                res.redirect("/");
            })
            .catch(function(err) {
                console.log(err);
            })
    }
    else {
        Archive.findByIdAndUpdate(noteId, {title: noteTitle, description: noteDesc, color: noteColor})
            .then(function() {
                console.log("Note edited");
                res.redirect("/archive")
            })
            .catch(function(err) {
                console.log(err);
            })
    }

    
})




app.listen(port, (req,res)=> {
    console.log(`Server is running on port ${port}`);
})
