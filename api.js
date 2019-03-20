const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors('*'));

// app.get('/api/hello', (req, res) => {
//   res.send({ express: 'Hello From Express' });
// });

let users = [
    { username: 'admin', password: 'admin' },
    { username: 'user', password: 'user' },
    { username: 'papa', password: 'papa' },
];

app.post('/api/login', (request, response) => {
    //console.log(req.body);
    let requestObject = request.body;
    // requestObject = JSON.parse(req.json);
    console.log(requestObject.username);

    responseObject = {
        status: 400
    };

    if(!requestObject.username || requestObject.password) {
        responseObject.status = 400;
    }

    if(requestObject.username && requestObject.password) {
        let found =  users.filter(user => 
            requestObject.username === user.username && requestObject.password === user.password
        );

        //console.log(`found`, found);
        
        responseObject.status = Array.isArray(found) && found.length ? 200 : 400;
    }

    response.send(JSON.stringify(responseObject));
});

app.listen(port, () => console.log(`Listening on port ${port}`));