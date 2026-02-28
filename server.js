require("dotenv").config()
const express = require("express")
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const db = require("better-sqlite3")("ourApp.db")
db.pragma("journal_mode = WAL")

//db setup
const createTables = db.transaction(() => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username STRING NOT NULL UNIQUE,
        password STRING NOT NULL
        )
        `).run()
    
    db.prepare(`
        CREATE TABLE IF NOT EXISTS quizResults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        score INTEGER NOT NULL,
        timeTaken INTEGER NOT NULL,
        dateCompleted INTEGER NOT NULL
        )
        `).run()
})

createTables()

const app = express()

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: false}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(express.json())

app.use(function (req, res, next) {
    res.locals.errors = []
    res.locals.creation_text = false
    res.locals.showLoginText = false

    //Try to decode incoming cookie
    try {
        const decoded = jwt.verify(req.cookies.ourSimpleApp, process.env.JWTSECRET)
        req.user = decoded
    } catch(err) {
        req.user = false
    }

    res.locals.user = req.user
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
    
    const usernameSelector = db.prepare("SELECT username FROM users")
    const existant_usernames = usernameSelector.all()
    existant_usernames.forEach(username => {
        if(username["username"] == req.body.username) errors.push("You must use a unique username")
    })
    
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
    const salt = bcrypt.genSaltSync(10)
    req.body.password = bcrypt.hashSync(req.body.password, salt)

    const ourStatement = db.prepare("INSERT INTO users (username, password) Values (?, ?)")
    const result = ourStatement.run(req.body.username, req.body.password)

    const lookupStatement = db.prepare("SELECT * FROM users WHERE RowID = ?")
    const ourUser = lookupStatement.get(result.lastInsertRowid)

    //log  user in with cooklies
    const ourTokenValue = jwt.sign({exp: Math.floor(Date.now()/1000 + 60*60*24), userid: ourUser.id}, process.env.JWTSECRET)

    res.cookie("ourSimpleApp", ourTokenValue, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24, //sets max age of cookie to one day
    })

    creation_text = true
    return res.render("make_account", { creation_text })
})

app.post("/login", (req, res) => {
    let errors = []

    if(typeof req.body.username !== "string") req.body.username=""
    if(typeof req.body.password !== "string") req.body.password=""

    if(req.body.username.trim() == "") errors = ["Invalid username / password"]
    if(req.body.password == "" && req.body.username.trim() !== "") errors = ["Invalid username / password"]
    
    if(errors.length) {
        return res.render("login", { errors })
    }

    const userInQuestionStatement = db.prepare("SELECT * FROM users WHERE USERNAME = ?")
    const userInQuestion = userInQuestionStatement.get(req.body.username)

    if(!userInQuestion) {
        errors = ["Invalid username / password"]
        return res.render("login", { errors })
    }
    
    const matchOrNot = bcrypt.compareSync(req.body.password, userInQuestion.password)
    if(!matchOrNot) {
        errors = ["Invalid username / password"]
        return res.render("login", { errors })
    }
    
    //give them a cookie
    const ourTokenValue = jwt.sign({exp: Math.floor(Date.now()/1000 + 60*60*24), userid: userInQuestion.id}, process.env.JWTSECRET)

    res.cookie("ourSimpleApp", ourTokenValue, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24, //sets max age of cookie to one day
    })
    
    showLoginText = true
    return res.render("login", { showLoginText })
})

app.post("/quizData", (req, res) => {
    if(req.user){
        const ourStatement = db.prepare("INSERT INTO quizResults (userId, score, timeTaken, dateCompleted) Values (?, ?, ?, ?)")
        const result = ourStatement.run(req.user.userid, req.body.score, req.body.time_elapsed, req.body.date_of_completion)
    }
})

// get

app.get("/getQuizData", (req, res) => {
    const usernameSelector = db.prepare("SELECT id, score, timeTaken, dateCompleted  FROM quizResults WHERE userId = ?")
    const quizData = usernameSelector.all(req.user.userid)

    res.json(quizData)
})

app.get("/isUserLoggedIn", (req, res) => {
    output = {
        loggedIn: req.user
    }

    res.json(output)
})

app.listen(3000)