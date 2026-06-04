# Implementing Passkeys
# Workshop by Maximiliano Firtman @firt (X) - firt.dev - hi@firt.dev

Run `npm install` in this project to get all dependencies. 
Then, you can follow along the workshop with instructions delivered by the trainer.
In the assets folders, you will find a copy of the slides, the final project, and 
two projects to see how to implement Passkeys on iOS and Android native apps for clients.

## Links
- Demo https://demo.authsignal.com/
- Demo https://www.passkeys.io/ 
- Demo https://learnpasskeys.io/demo 
- Demo https://webauthn.io/ 
- API Visual Guide https://webauthn.guide/ 
- Demo with Debugger https://www.webauthn.me/debugger 
- Modern Web Guidance https://developer.chrome.com/docs/modern-web-guidance 
- JSON de AAGUID https://github.com/passkeydeveloper/passkey-authenticator-aaguids 
- Passkey Skills https://github.com/GoogleChrome/modern-web-guidance-src/tree/main/guides/passkeys 
- Modern Authentication https://developer.chrome.com/blog/io26-web-identity 
- Chrome 129 additions https://developer.chrome.com/blog/ passkeys-updates-chrome-129 

## Code Snippets


### 1-Standard Login Services

－ At server.js, add

```js
app.post("/auth/register", (req, res) => {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);

    const user = {
        name: req.body.name,
        email: req.body.email,
        password: hash
    };
    const userFound = findUser(req.body.email);

    if (userFound) {
        // User already registered
        res.send({ok: false, message: 'User already exists'});
    } else {
        // New User
        db.data.users.push(user);
        db.write();
        res.send({ok: true});
    }
});

app.post("/auth/login", (req, res) => {
    const user = findUser(req.body.email);
    if (user) {
        // user exists, check password
        if (bcrypt.compareSync(req.body.password, user.password)) {
            res.send({ok: true, email: user.email, name: user.name});
        } else {
            res.send({ok: false, message: 'Your login credentials are invalid.'});            
        }
    } else {
        // User doesn't exist
        res.send({ok: false, message: 'Your login credentials are invalid.'});
    }
});
```


－ Now in scripts/API.js we need to add the client-side calls
```js
login: async (user) => {
    return await API.makePostRequest(API.endpoint + "login", user);
},
register: async (user) => {
    return await API.makePostRequest(API.endpoint + "register", user);
},
```


### 2-Calling the APIs

－ In scripts/Auth.js we need to add these calls
```js
login: async (event) => {
    if (event) event.preventDefault();
    const user = {
        email: document.getElementById("login_email").value,
        password: document.getElementById("login_password").value

    };
    const response = await API.login(user);
    Auth.postLogin(response, { 
        ...user,
        name: response.name
    });
},
register: async  (event) => {
    event.preventDefault();
    const user = {
        name: document.getElementById("register_name").value,
        email: document.getElementById("register_email").value,
        password: document.getElementById("register_password").value
    }
    const response = await API.register(user);
    Auth.postLogin(response, user);
},
```

－ Also we will create a postLogin and logout methods:
```js
postLogin: (response, user) => {
    if (response.ok) {
        Auth.isLoggedIn = true;
        Auth.account = user;
        Auth.updateStatus();

        Router.go("/account");        
    } else {
        alert(response.message)
    }           
},    
logout: () => {
    Auth.isLoggedIn = false;
    Auth.account = null;
    Auth.updateStatus();
    Router.go("/");
},
```


### 3-Saving Credentials

－ At Auth.js we will update postLogin and logout adding the following algoritms:
```js
// A- At Post-Login
// Credential Management API
if (window.PasswordCredential && user.password) {
    const credential = new PasswordCredential({
        name: user.name,
        id: user.email,
        password: user.password
    });
    navigator.credentials.store(credential);
}

// B- At Logout
if (window.PasswordCredential) {
    navigator.credentials.preventSilentAccess()
}
```


### 4-Recovering Credentials (Auto-login)

－ We will create and autoLogin method in Auth.js to recover credentials. Remember to call this method when the page load:
```js
   autoLogin: async () => {
        if (window.PasswordCredential) {
            const credentials = await navigator.credentials.get({ password: true });
            try {
                document.getElementById("login_email").value = credentials.id;
                document.getElementById("login_password").value = credentials.password;
                Auth.login();
            } catch (e) {}
        }
    },
```


### 5-Move to Identifier-First flow

－ It's time to update the HTML to change the flow, in the Login form:     
```js
    <section hidden id="login_section_password">              
        <label for="login_password">Password</label>
        <input type="password" id="login_password"
            autocomplete="webauthn current-password">
    </section>                                      
```


－ Also, in Auth.js we will add a new top-level property and change the logic of init.
```js
loginStep: 1,
init: () => {
    Auth.loginStep = 1;
    document.getElementById("login_section_password").hidden = true;
    document.getElementById("login_section_webauthn").hidden = true;
},
```


### 6-Finish the Identifier-First Flow

－ In server.js we need to add a new endpoint
```js
app.post("/auth/auth-options", (req, res) => {
    const user = findUser(req.body.email);    

    if (user) {
        res.send({
            password: true,
            webauthn: user.webauthn
        })
    } else {
        res.send({
            password: true
        })
    }
});
```

－ Then on API.js
```js
checkAuthOptions:  async (user) => {
    return await API.makePostRequest(API.endpoint + "auth-options", user);
},
```

－ And finally, on Auth.js we change login while adding a new checkAuthOptions method:
```js
login: async (event) => {
    if (event) event.preventDefault();
    if (Auth.loginStep==1) {
        Auth.checkAuthOptions();
    } else {
        const user = {
            email: document.getElementById("login_email").value,
            password: document.getElementById("login_password").value

        };
        const response = await API.login(user);
        Auth.postLogin(response, { 
            ...user,
            name: response.name
        });
    }
},
checkAuthOptions: async (event) => {
    const response = await API.checkAuthOptions({
        email: document.getElementById("login_email").value
    });
    if (response.password) {
        document.getElementById("login_section_password").hidden = false;
    }
    if (response.webauthn) {
        document.getElementById("login_section_webauthn").hidden = false;
    }
    Auth.challenge = response.challenge;
    Auth.loginStep = 2;
},
```


### 7-Add WebAuthn Registration endpoints

－ In server.js add
```js
app.post("/auth/webauth-registration-options", async (req, res) =>{
   try {
       const user = findUser(req.body.email);

       const options = {
           rpName,
           rpID,
           userName: user.name,
           attestationType: 'none', // Better UX, Don't prompt users for additional information about the authenticato

           // Optional, Prevent users from re-registering existing authenticators
           // excludeCredentials: user.passkeys ? user.passkeys.map(pk => ({
           //     id: pk.credentialID,
           //     transports: pk.transports,
           // })) : [],

           authenticatorSelection: {
               // Defaults
               residentKey: 'preferred',
               userVerification: 'preferred',
               // Optional
               // authenticatorAttachment: 'platform', // platform or cross-platform
               // Optional
               // preferredAuthenticatorType: '', // securityKey, localDevice, remoteDevice
           },
       };

       /**
        * The server needs to temporarily remember this value for verification, so don't lose it until
        * after you verify an authenticator response.
        */
       const regOptions = await SimpleWebAuthnServer.generateRegistrationOptions(options)
       user.currentChallenge = regOptions.challenge;
       db.write();  
      
       // Send response to the client
       res.send(regOptions);
   } catch (e) {
       res.status(500);
   }
});

app.post("/auth/webauth-registration-verification", async (req, res) => {
   const user = findUser(req.body.user.email);
   const data = req.body.data;
  
   let verification;
   try {
     const options = {
       response: data,
       expectedChallenge: user.currentChallenge,
       expectedOrigin,
       expectedRPID: rpID,
       requireUserVerification: true,
     };
     verification = await SimpleWebAuthnServer.verifyRegistrationResponse(options);
   } catch (error) {
       console.log(error);
     return res.status(400).send({ error: error.toString() });
   }
    const { verified, registrationInfo } = verification; 

   if (verified && registrationInfo) {    
      const existingPasskey = user.passkeys ? user.passkeys.find(
       passkey => passkey.id == registrationInfo.credential.id
     ) : false;
      if (!existingPasskey) {
       const newPasskey = registrationInfo.credential;
       if (user.passkeys==undefined) {
           user.passkeys = [];
       }
       user.webauthn = true;
       user.passkeys.push(newPasskey);
       db.write();
     }
   } else {
       console.log("Passkey already stored.")
   }
    res.send({ ok: true });
});
```


### 8-Add WebAuthn Login endpoints

－ In server.js add
```js
app.post("/auth/webauth-login-options", async (req, res) =>{
   const user = findUser(req.body.email);
   if (user==null) {
       res.sendStatus(404);
       return;
   }
   const options = {
       allowCredentials: user && user.passkeys ? user.passkeys.map(passkey => ({
         id: passkey.id,
         transports: passkey.transports,
       })) : [],
       userVerification: 'required',
       rpID,
   };
   const loginOpts = await SimpleWebAuthnServer.generateAuthenticationOptions(options);
   user.currentChallenge = loginOpts.challenge;
   db.write();
   res.send(loginOpts);
});

app.post("/auth/webauth-login-verification", async (req, res) => {
   const data = req.body.data;
   let user = findUser(req.body.email);
   if (user==null) {
       res.sendStatus(400).send({ok: false});
       return;       
   }
    const expectedChallenge = user.currentChallenge;
    let registeredPasskey;
   const { id } = data;

   let candidates;
   if (user) {
       candidates = [user]; // Just the current user
   } else {
       candidates = db.data.users;
   }

   // Find passkeys on candidate users        
   for (const candidate of candidates) {
       for (const passkey of candidate.passkeys) {
           if (passkey.id == id) {
               registeredPasskey = passkey;
               user = candidate;
               break;
           }
       }
   }

   if (!registeredPasskey) {
     return res.status(400).send({ ok: false, message: 'Passkey is not registered with this site' });
   }
    // Verifies the passkey
   let verification;
   try {
     const options  = {
       response: data,
       expectedChallenge: expectedChallenge,
       expectedOrigin,
       expectedRPID: rpID,
       credential: {
           id: registeredPasskey.id,
           publicKey: Buffer.from(Object.values(registeredPasskey.publicKey)), // converts it back into a Buffer
           counter: registeredPasskey.counter,
           transports: registeredPasskey.transports,
       },       
       requireUserVerification: true,
     };
     verification = await SimpleWebAuthnServer.verifyAuthenticationResponse(options);
   } catch (error) {
     console.log(error);
     return res.status(400).send({ ok: false, message: error.toString() });
   }
    const { verified, authenticationInfo } = verification;
    if (verified) {
     registeredPasskey.counter = authenticationInfo.newCounter;
     db.write();
   }
    // Send response to the client
   res.send({
       ok: true,
       user: {
           name: user.name,
           email: user.email
       }
   });
});
```


### 9-Add WebAuthn endpoints to the client

－ Finally, we add these endpoints to API.js
```js
   webAuthn: {
       loginOptions: async (email="") => {
           return await API.makePostRequest(API.endpoint + "webauth-login-options", { email });
       },
       loginVerification: async (email, data) => {
           return await API.makePostRequest(API.endpoint + "webauth-login-verification", {
               email,
               data
           });                      
       },
       registrationOptions: async () => {
           return await API.makePostRequest(API.endpoint + "webauth-registration-options", Auth.account);          
       },
       registrationVerification: async (data) => {
           return await API.makePostRequest(API.endpoint + "webauth-registration-verification", {
               user: Auth.account,
               data
           });                      
       }
   },
```


### 10-Registering a Passkey

－ In our HTML, let's add some code in the account view
```html
<section id="webauthn">
    <button onclick="Auth.addWebAuthn()">Register a New Passkey</button>
</section>
```

－ Then, in Auth.js
```js
    addWebAuthn: async () => {          
       const options = await API.webAuthn.registrationOptions();       
       options.authenticatorSelection.residentKey = 'required';
       options.authenticatorSelection.requireResidentKey = true;
       options.extensions = {
         credProps: true,
       };
       const authRes = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options });
       const verificationRes = await API.webAuthn.registrationVerification(authRes);
       if (verificationRes.ok) {
           alert("You can now login using the registered method!");
       } else {
           alert(verificationRes.message)
       }
   },
```


### 11-Authorizing with a Passkey

－ Let's first change index.html in the login form
```html
<section hidden id="login_section_webauthn">
    <a href="#" class="navlink" onclick="Auth.webAuthnLogin(); event.preventDefault">Log in with a Passkey</a> 
</section>                                      
```

－ And finally on Auth.js we add:
```js
webAuthnLogin: async () => {
       const email = document.getElementById("login_email").value;
       const options = await API.webAuthn.loginOptions(email);       
       const loginRes = await SimpleWebAuthnBrowser.startAuthentication({
           optionsJSON: options,
        });
       const verificationRes = await API.webAuthn.loginVerification(email, loginRes);
       if (verificationRes) {
           Auth.postLogin(verificationRes, verificationRes.user);
       } else {
           alert(verificationRes.message)
       }
   },
```


### 12-Conditional UI for Passkeys

－ A- Let's first change index.html in the login form and add webauthn to the email input
```html
<input placeholder="email" id="login_email"
       required autocomplete="username webauthn">  
```


－ B-Now, in Auth.js we add:
```js
  webAuthnAutofill: async () => {
       const options = await API.webAuthn.loginOptions();       
       const loginRes = await SimpleWebAuthnBrowser.startAuthentication({
           optionsJSON: options,
           useBrowserAutofill: true
        });
       const verificationRes = await API.webAuthn.loginVerification(null, loginRes);
       if (verificationRes) {
           Auth.postLogin(verificationRes, verificationRes.user);
       } else {
           alert(verificationRes.message)
       }
   }
```

－ C-And in the same file, add this call within init:
```js
Auth.webAuthnAutofill();
```


### 13-Update endpoints to support conditional UI

－ Within server.js update these two services
```js
app.post("/auth/webauth-login-options", async (req, res) =>{
   const user = findUser(req.body.email);
   const options = {
       allowCredentials: user && user.passkeys ? user.passkeys.map(passkey => ({
         id: passkey.id,
         transports: passkey.transports,
       })) : [],
       userVerification: 'required',
       rpID,
   };
   const loginOpts = await SimpleWebAuthnServer.generateAuthenticationOptions(options);
   if (user) {
       user.currentChallenge = loginOpts.challenge;
       db.write();
   } else {
       req.session.webauthnChallenge = loginOpts.challenge;;
   }
   res.send(loginOpts);
});


app.post("/auth/webauth-login-verification", async (req, res) => {
   const data = req.body.data;
   let user = findUser(req.body.email);
   const expectedChallenge = user ? user.currentChallenge : req.session.webauthnChallenge;
    let registeredPasskey;
   const { id } = data;

   let candidates;
   if (user) {
       candidates = [user]; // Just the current user
   } else {
       candidates = db.data.users;
   }

   // Find passkeys on candidate users        
   for (const candidate of candidates) {
       for (const passkey of candidate.passkeys) {
           if (passkey.id == id) {
               registeredPasskey = passkey;
               user = candidate;
               break;
           }
       }
   }

   if (!registeredPasskey) {
     return res.status(400).send({ ok: false, message: 'Passkey is not registered with this site' });
   }
    // Verifies the passkey
   let verification;
   try {
     const options  = {
       response: data,
       expectedChallenge: expectedChallenge,
       expectedOrigin,
       expectedRPID: rpID,
       credential: {
           id: registeredPasskey.id,
           publicKey: Buffer.from(Object.values(registeredPasskey.publicKey)), // converts it back into a Buffer
           counter: registeredPasskey.counter,
           transports: registeredPasskey.transports,
       },       
       requireUserVerification: true,
     };
     verification = await SimpleWebAuthnServer.verifyAuthenticationResponse(options);
   } catch (error) {
     console.log(error);
     return res.status(400).send({ ok: false, message: error.toString() });
   }
    const { verified, authenticationInfo } = verification;
    if (verified) {
     registeredPasskey.counter = authenticationInfo.newCounter;
     db.write();
   }
    // Send response to the client
   res.send({
       ok: true,
       user: {
           name: user.name,
           email: user.email
       }
   });
});
```

