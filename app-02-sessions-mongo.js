const express = require("express"); //otetaan express käyttöön
//palauttaa funktion jolla voidaan luoda serveriobjekti

const PORT = process.env.PORT || 8080 //jos ympäristömuuttujaan ei ole asetettu porttia, niin se saa meidän kehitysvaiheessa antaman portin

const body_parser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const user_schema = new Schema({
    name: {
        type: String,
        required: true
    }
});
const user_model = mongoose.model("user", user_schema);

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
        Logged in as user: ${user.name}
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
    
    user_model.findOne({
        name: user_name
    }).then((user)=>{
        if(user){
            req.session.user = user;
            return res.redirect("/");
        }

        let new_user= new user_model({
            name: user_name
        });

        res.redirect("/login");

    });
});

app.post("/register", (req,res,next)=>{
    const user_name=req.body.user_name
    
    user_model.findOne({
        name: user_name
    }).then((user)=>{
        if(user){
            console.log("user name already registered");
            return res.redirect("/login");
        }

        let new_user= new user_model({
            name: user_name
        });

        new_user.save().then(()=>{
            return res.redirect("/login");
        });

    });
    
});


app.use((req, res, next)=>{
    res.status(404);
    res.send(`
    page not found
    `);
});

//otetaan ensin yhteys tietokantaan ja käynnistetään vasta sitten serveri
const mongoose_url="mongodb+srv://db-user:ybqf2URNTojOwE4S@cluster0-qyghw.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(mongoose_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log("mongoose connected");
    console.log("start express server");
    app.listen(PORT);//porttinumero
});

// mongo db-user salasana ybqf2URNTojOwE4S
