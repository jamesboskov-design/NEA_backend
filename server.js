const express = require("express")
const db = require("better-sqlite3")("ourApp.db")
db.pragma("journal_mode = WAL")

//db setup
const createTables = db.transaction(() => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username STRING NOT NULL UNIQUE,
        password STRING NOT NULL
        )
        `).run()
})

createTables()

const app = express()

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: false}))
app.use(express.static("public"))

app.use(function (req, res, next) {
    res.locals.errors = []
    next()
})

// making links between websites work

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/index", (req, res) => {
    res.render("index")
})

app.get("/game", (req, res) => {
    res.render("game")
})

app.get("/end", (req, res) => {
    res.render("end")
})

app.get("/end.html", (req, res) => {
    res.render("end")
})

app.get("/account", (req, res) => {
    res.render("login")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/make_account", (req, res) => {
    res.render("make_account")
})

// post

app.post("/register", (req, res) => {
    const errors = []

    if(typeof req.body.username !== "string") req.body.username=""
    if(typeof req.body.password !== "string") req.body.password=""

    if(!req.body.username) errors.push("You must provide a username")
    if(req.body.password.length < 7) errors.push("Passwords must be longer than 6 letters")
    
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const specials = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "{", "}", "|", ":", "<", ">", "?", "~", "£"]

    let includes_numbers = false
    let includes_specials = false

    numbers.forEach(number => {
        if(req.body.password.includes(number)) includes_numbers = true
    });
    
    specials.forEach(special => {
        if(req.body.password.includes(special)) includes_specials = true
    });

    if(!includes_numbers) errors.push("Password must include numbers")
    if(!includes_specials) errors.push("Password must include special characters")

    if(errors.length) {
        return res.render("make_account", { errors })
    } 
    
    //save new user into db



    //log  user in with cooklies
})

app.listen(3000)