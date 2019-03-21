const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const sqlite3 = require('sqlite3');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors('*'));

const users = require('./users.json');

const db = new sqlite3.Database('./db.sqlite3', (err) => {
    if(err) {
        console.log(err);
    }
    console.log(`connect to db - success`);

    db.run('CREATE TABLE IF NOT EXISTS `tasks` (`title` TEXT, `distance` INTEGER, `price` REAL)', [], (err) => {
        if(err) {
            console.log(err);
        }
        console.log(`db CREATE TABLE - success`);
    });
});

// app.get('/api/hello', (req, res) => {
//   res.send({ express: 'Hello From Express' });
// });

app.post('/api/login', (request, response) => {
    console.log(request.body);
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

app.post('/api/tasks', (request, response) => {
    console.log(request.body);
    responseObject = {
        status: 400
    };

    db.all('SELECT * FROM `tasks`', [],(err, rows) => {
        if(err) {
            console.log(err);
        }
        console.log(`db SELECT - success`, rows);
        responseObject.status = 200;
        responseObject.data = rows;
        response.send(JSON.stringify(responseObject));
    });
});

app.post('/api/task/add', (request, response) => {
    console.log(request.body);
    responseObject = {
        status: 400
    };

    db.run(
        'INSERT INTO `tasks` (`title`, `distance`, `price`) VALUES (?,?,?)',
        [ request.body.title, request.body.distance, request.body.price ],
        (err) => {
            if(err) {
                console.log(err);
            }
            console.log(`db INSERT INTO - success`);

            responseObject.status = 200;
            response.send(JSON.stringify(responseObject));
        }
    );
});

app.listen(port, () => console.log(`Listening on port ${port}`));