import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import * as url from 'url';
import bcrypt from 'bcryptjs';
import * as SimpleWebAuthnServer from '@simplewebauthn/server';
import session from 'express-session';


/****************
 * WEBAUTH CONFIG RELYING PARTY (RP) VARIABLES
 ****************/
const rpName = "Coffee Masters"
const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;
// Note: it's now possible to have an array of rpIDs and expected origins following multi-origin specs

/****************
 * DATA STORAGE SET UP
 ****************/
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const adapter = new JSONFile(__dirname + '/auth.json');
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] }

/****************
 * EXPRESSJS SERVER SETUP
 ****************/
const app = express()
app.use(express.json())

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(session({
    secret: "a very strong secret key",  // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }   // Set true if using HTTPS
}));


/****************
 * STANDARD LOGIN SERVICES 
 ****************/

function findUser(email) {
    const results = db.data.users.filter(u=>u.email==email);
    if (results.length==0) return undefined;
    return results[0];
}

// TODO: Step 1

// TODO: Step 6

/****************
 * WEBAUTH PASSKEY REGISTRATION SERVICES
 ****************/

// TODO: Step 7


/****************
 * WEBAUTH PASSKEY AUTHENTICATION (LOGIN) SERVICES
 ****************/

// TODO: Step 8


/****************
 * EXPRESS JS SET UP
 ****************/

app.get("*", (req, res) => {
    res.sendFile(__dirname + "public/index.html"); 
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

