const express = require("express"); //otetaan express käyttöön
//palauttaa funktion jolla voidaan luoda serveriobjekti

const PORT = process.env.PORT || 8080 //jos ympäristömuuttujaan ei ole asetettu porttia, niin se saa meidän kehitysvaiheessa antaman portin

const body_parser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const note_schema = new Schema({
    text: {
        type: String,
        required: true
    }
});
const note_model = new mongoose.model('note', note_schema);

const user_schema = new Schema({
    name: {
        type: String,
        required: true
    },
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'note',
        req: true
    }]
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

//haetaan käyttäjän tietokantaobjekti
app.use((req,res,next) =>{
    if(! req.session.user){
        return next();
    }
    user_model.findById(req.session.user._id).then((user)=>{
        req.user = user; //tietokantaobjekti
        next();
    }).catch((err) => {
        console.log(err);
        res.redirect('/login');
    });
});

app.get("/", is_logged_handler, (req,res,next)=>{
    const user=req.user;
    user.populate('notes').execPopulate().then(()=>{
        console.log('user: ', user);
        res.write(`
        <html>
        <body>
            Logged in as user: ${user.name}
            <form action="/logout" method="POST">
                <button type="submit">Log out</button>
            </form>`);
            user.notes.forEach((note) => {
                res.write(note.text);
                res.write(`
                <form action="delete-note" method="POST">
                    <input type="hidden" name="note_id" value="${note._id}">
                    <button type="submit">Delete note </button>
                </form>
                `);
            });
    
            res.write(`
            <form action="/add-note" method="POST">
                <input type="text" name="note">
                <button type="submit">Add note</button>
            </form>
    
            
        </body>
        </html>
        `);
        res.end();

    });
    
});

app.post("/delete-note", (req,res,next)=>{
    const user = req.user;
    const note_id_to_delete = req.body.note_id;

    //käyttäjän listalta poistaminen (säilyy vielä tietokannassa)
    const updated_notes = user.notes.filter((note_id)=>{
        return note_id != note_id_to_delete; //palauttaa true jos sama
    });
    user.notes = updated_notes;

    //päivitetään käyttäjä ja poistetaan tietokannasta
    user.save().then(()=>{
        note_model.findByIdAndRemove(note_id_to_delete).then(()=> {
            res.redirect("/");
        });


    });

});

app.get("/note/:id", (req,res,next)=>{
    const note_id = req.params.id;
    note_model.findOne({
        _id: note_id
    }).then((note)=>{
        res.send(note.text);
    });
});

app.post("/add-note", (req,res,next)=>{
    const user = req.user;

    let new_note = note_model({
        text: req.body.note
    });
    new_note.save().then(()=>{
        console.log("note saved");
        user.notes.push(new_note);
        user.save().then(()=>{
            return res.redirect("/");
        });      
    });
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
            name: user_name,
            notes: []
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
