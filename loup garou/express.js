const path = require('path');
var express = require('express');
const ws = require('ws');
const Sequelize = require('sequelize');
const { json } = require('sequelize');
let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
var bodyParser = require('body-parser');
const { type } = require('os');
var app = express();
var expressWs = require('express-ws')(app);
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});


const Parties = sequelize.define('Parties', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    creator: {
        type: Sequelize.STRING,
        defaultValue: "Error",
        allowNull: false,
    },
    tag: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
    }
});

const Accounts = sequelize.define('Accounts', {
    username: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false,
    },
    userId: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false,
    },
    password: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false,
    },
    login: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
    },
    mailAdress: {
        type: Sequelize.STRING,
        allowNull: false
    }

})

Parties.sync();
Accounts.sync();

app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.render(path.join(__dirname, "/views/html/index.ejs"));
});
app.listen(3000);

app.post('/createGame', async function(req, res) {
    const data = req.body;

    const IdNewParty = await newId()
    console.log("creator:" + data.creator)


    try {
        await Parties.create({
            name: data.name,
            creator: data.creator,
            tag: IdNewParty,
        });
        res.send(`New game created with id: ${IdNewParty}`)
    } catch (e) {
        console.log(e)
    }
});

app.get('/findGame/:idRequest', async function(req, res) {
    console.log(req.params)
    listAll()
    let partiesFound = await findGameById(req.params.idRequest)
    console.log(partiesFound)
    if (partiesFound) {
        console.log("ehfozihf")
        res.send({ found: true })
    } else {
        res.send({ found: false })
    }
})

app.get("/games/:gameId", async function(req, res) {
    let partiesFound = await findGameById(req.params.gameId)
    console.log(partiesFound)

    res.render(path.join(__dirname, "/views/html/party-data.ejs"), { partyCreator: partiesFound.creator })
})

app.get("/login", async function(req, res) {
    res.render(path.join(__dirname, "/views/html/login.ejs"))
})


app.get("/register", async function(req, res) {
    res.render(path.join(__dirname, "/views/html/register.ejs"))
})


app.ws('/echo', function(ws, req) {
    ws.on('message', function(msg) {
        ws.send("msg");
    });
});


async function newId() {
    let mauvais = true;
    while (mauvais) {
        let IdValid = '';
        for (let i = 0; i < 8; i++) {
            IdValid += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const testId = await Parties.findOne({ where: { tag: IdValid } });
        if (!testId) {
            console.log(IdValid)
            mauvais = false
            return IdValid

        }
    }
}

async function findGameById(IdToTest) {

    const PartyFound = await Parties.findOne({ where: { tag: IdToTest } });

    if (PartyFound) {
        console.log(PartyFound.creator)

        return { creator: PartyFound.creator }
    } else {
        console.log("AF")
        return "No parties with the id:" + IdToTest
    }

}

async function listAll() {
    const GameList = await Parties.findAll({ attributes: ['tag'] });
    const GameString = GameList.map(t => t.tag).join(', ') || 'No tags set.';
    console.log(`List of tags: ${GameString}`);
}