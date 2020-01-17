const express = require("express"); //otetaan express käyttöön
//palauttaa funktion jolla voidaan luoda serveriobjekti

const PORT = process.env.PORT || 8080 //jos ympäristömuuttujaan ei ole asetettu porttia, niin se saa meidän kehitysvaiheessa antaman portin


let app = express(); //luodaan objekti

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


app.get('/', (req, res, next)=>{
    res.send('hello 2');
});//toimii silloin kun tulee get-pyyntö

app.get('/TEST', (req, res, next)=>{
    console.log('post /TEST');
    next();
});//toimii silloin kun tulee post-pyyntö


app.use((req, res, next)=>{
    res.status(404);
    res.send(`
    page not found
    `);
});

app.listen(PORT);//porttinumero