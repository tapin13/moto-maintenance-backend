const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const mysql = require('mysql');
const crypto = require('crypto');

const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'moto'
});
db.connect();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors('*'));

app.get('/', (req, res) => {
  res.send({ hello: 'Welcome to API' });
});

app.post('/api/register/', (request, response) => {
    let requestObject = request.body;
    // requestObject = JSON.parse(req.json);
    console.log(requestObject.email);

    responseObject = {
        status: 400,
        error: "",
        data: null        
    };

    if(!requestObject.email || requestObject.password) {
        responseObject.status = 400;
    }

    let sql = `INSERT INTO \`users\` (\`email\`, \`password\`) VALUES ('${requestObject.email}', MD5('${requestObject.password}${process.env.SALT}'))`;
    console.log(sql);
    db.query(sql, (error, results, fields) => {
        if (error) {
            //throw error;
            responseObject.status = 400;
            responseObject.error = error;
        }
        //console.log('The solution is: ', results);

        responseObject.status = 200;
        response.send(JSON.stringify(responseObject));    
    });
});

app.post('/api/login', (request, response) => {
    console.log(request.body);
    let requestObject = request.body;
    // requestObject = JSON.parse(req.json);
    console.log(requestObject.email);

    responseObject = {
        status: 400,
        error: '',
        data: null
    };

    if(!requestObject.email || requestObject.password) {
        responseObject.status = 400;
    }

    if(requestObject.email && requestObject.password) {
        // let found =  users.filter(user => 
        //     requestObject.email === user.email && requestObject.password === user.password
        // );

        let sql = `SELECT * FROM \`users\` WHERE \`email\` = '${requestObject.email}' AND \`password\` = MD5('${requestObject.password}${process.env.SALT}') LIMIT 1`;
        console.log(sql);
        db.query(sql, (error, results) => {
            if (error) {
                //throw error;
                responseObject.status = 400;
                responseObject.error = error;
                console.log('error: ', error);
            }
            //console.log('results: ', results);

            if(results.length === 0) {
                responseObject.status = 400;
                responseObject.error = `Login or password not correct`;
                response.send(JSON.stringify(responseObject));
                
                return;
            }

            console.log('results RowDataPacket: ', results[0].id);
            //console.log('results RowDataPacket id: ', results[0]['RowDataPacket']['id']);

            if(results && results[0] && results[0].id) {
                //responseObject.data = results[0].id;

                let token = crypto.createHash('md5').update(`${Math.random()}${process.env.SALT}`).digest("hex");
                let sql = `INSERT INTO \`tokens\` (\`user_id\`, \`token\`, \`timestamp\`) VALUES ('${results[0].id}', '${token}', UNIX_TIMESTAMP())`;
                console.log(sql);
                db.query(sql, (error, results, fields) => {
                    if (error) {
                        //throw error;
                        responseObject.status = 400;
                        responseObject.error = error;
                        response.send(JSON.stringify(responseObject));

                        return;
                    }
                    //console.log('The solution is: ', results);

                    
                    responseObject.status = 200;
                    responseObject.data = { token: token };
                    response.send(JSON.stringify(responseObject));    
                });
                
            } else {
                responseObject.status = 400;
                response.send(JSON.stringify(responseObject));    
            }
        });

        //console.log(`found`, found);
        
        //responseObject.status = Array.isArray(found) && found.length ? 200 : 400;
    }

    //response.send(JSON.stringify(responseObject));
});

app.post('/api/maintenances/', (request, response) => {
    console.log(request.body);
    responseObject = {
        status: 400
    };

    db.query('SELECT * FROM `maintenances`', [],(err, rows) => {
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
        'INSERT INTO `maintenances` (`title`, `distance`, `price`) VALUES (?,?,?)',
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

process.on('exit', function(code) {  
    db.end();
    return console.log(`About to exit with code ${code}`);
});
