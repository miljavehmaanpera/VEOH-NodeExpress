const express = require("express"); //otetaan express käyttöön
//palauttaa funktion jolla voidaan luoda serveriobjekti

const PORT = process.env.PORT || 8080 //jos ympäristömuuttujaan ei ole asetettu porttia, niin se saa meidän kehitysvaiheessa antaman portin

const body_parser = require("body-parser");
const session = require("express-session");

let app = express(); //luodaan objekti

app.use(body_parser.urlencoded({
    extended: true
}));//jos näitä ei laita, post-viestiin ei tule bodya

app.use(session({
    secret: "1234qwerty",
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000000
    }
}));

let users = [];

//kolme erilaista kuuntelijaa:
//app.use()
//app.get()
//app.post()

//kuunnellaan kaikkea sisääntulevaa viestiä. req=pyyntö, res=paluuarvo
// next=jatka seuraavaankin kuuntelijaan
app.use((req, res, next)=>{
    console.log(`PATH: ${req.path}`);
    next();
});//tämä kuuntelee kaikkea riippumatta siitä mikä polku on

const is_logged_handler = (req,res,next) => {
    if(! req.session.user){
        return res.redirect("/login");   
    }
    next();
};

app.get("/", is_logged_handler, (req,res,next)=>{
    const user=req.session.user;
    res.write(`
    <html>
    <body>
        Logged in as user: ${user}
        <form action="/logout" method="POST">
            <button type="submit">Log out</button>
        </form>
        
    </body>
    </html>
    `);
    res.end();
});

app.post("/logout", (req,res,next)=>{
    req.session.destroy();
    res.redirect("/login");
});


app.get('/login', (req, res, next) => {
    console.log("user: ", req.session.user);
    res.write(`
    <html>
    <body>
        <form action="/login" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Log in</button>
        </form>

        <form action="/register" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Register</button>
        </form>
    </body>
    </html>
    `);
    res.end();
});

//nappien käsittelijät
app.post("/login", (req,res,next)=>{
    const user_name=req.body.user_name
    let user = users.find((name)=>{
        return user_name == name;
    });
    if(user){
        console.log("user logged in ", user);
        req.session.user = user;
        return res.redirect("/");
    }
    console.log("user name not registered", user);
    res.redirect("/login");
});

app.post("/register", (req,res,next)=>{
    const user_name=req.body.user_name
    let user = users.find((kissa)=>{
        return user_name == kissa;
    });
    if(user){
        return res.send("User name already registered");
    }
    users.push(user_name);
    console.log("users: ", users);
    res.redirect("/login");//ohjataan takaisin login-sivulle
});


app.use((req, res, next)=>{
    res.status(404);
    res.send(`
    page not found
    `);
});

app.listen(PORT);//porttinumero