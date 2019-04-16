const crypto = require('crypto');

const mysql = require('mysql');
const util = require('util');

const db = mysql.createPool({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    connectionLimit: process.env.DB_CONNECTION_LIMIT
});

db.query = util.promisify(db.query);

const defaultResponseObject = {
    status: 400, 
    error: "",
    data: null
};

async function token2userId(token) {
    let sql = "SELECT `user_id` FROM `tokens` WHERE `token` = ? ;";
    let data = [ token ];
    let result;
    let userId;

    try {
        result = await db.query(sql, data);
        console.log(`result:`, result);
    } catch(err) {
        console.log(`error:`, err);
    }

    userId = result && result[0] && result[0].user_id ? result[0].user_id : -1;

    return userId;
}

const hello = (req, res) => {
    res.send({ hello: 'Welcome to API' });
};

const register = async (request, response) => {
    let requestObject = request.body;
    // requestObject = JSON.parse(req.json);
    console.log(requestObject.email);

    let responseObject = { ...defaultResponseObject };

    if(!requestObject.email || requestObject.password) {
        responseObject.status = 400;
    }

    let sql = `INSERT INTO \`users\` (\`email\`, \`password\`) VALUES ('${requestObject.email}', MD5('${requestObject.password}${process.env.MD5_SALT}'))`;
    console.log(sql);

    try {
        let result = await db.query(sql);
        console.log(`result`, result);

        responseObject.status = 200;
    } catch (err) {
        responseObject.status = 400;
        responseObject.error = err;
    }

    response.send(JSON.stringify(responseObject));    
};

const login = (request, response) => {
    console.log(request.body);
    let requestObject = request.body;
    // requestObject = JSON.parse(req.json);
    console.log(requestObject.email);

    let responseObject = { ...defaultResponseObject };

    if(!requestObject.email || !requestObject.password) {
        responseObject.status = 400;
        responseObject.error = `Login or password empty`;
        response.send(JSON.stringify(responseObject));
                
        return;
    }

    // let found =  users.filter(user => 
    //     requestObject.email === user.email && requestObject.password === user.password
    // );

    let sql = `SELECT * FROM \`users\` WHERE \`email\` = '${requestObject.email}' AND \`password\` = MD5('${requestObject.password}${process.env.MD5_SALT}') LIMIT 1`;
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

            let token = crypto.createHash('md5').update(`${Math.random()}${process.env.MD5_SALT}`).digest("hex");
            let sql = `INSERT INTO \`tokens\` (\`user_id\`, \`token\`, \`timestamp\`) VALUES ('${results[0].id}', '${token}', UNIX_TIMESTAMP())`;
            console.log(sql);
            db.query(sql, (error, results) => {
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
};

const maintenances = async(request, response) => {
    console.log(request.body);
    let responseObject = { ...defaultResponseObject };

    const userId = await token2userId(request.body.token);

    db.query(`SELECT 
                * 
                FROM
                    \`users\`
                    INNER JOIN \`vehicles\` ON (\`vehicles\`.\`user_id\` = \`users\`.\`id\`)
                    INNER JOIN \`maintenances\` ON (\`maintenances\`.\`vehicle_id\` = \`vehicles\`.\`id\`)
                WHERE \`users\`.\`id\` = ?`, [ userId ],(err, rows) => {
        if(err) {
            console.log('error: ', err);
            responseObject.error = err;
            response.send(JSON.stringify(responseObject));

            return;
        }
        console.log(`db SELECT - success`, rows);
        responseObject.status = 200;
        responseObject.data = rows;
        response.send(JSON.stringify(responseObject));
    });
};

const maintenanceAdd = (request, response) => {
    console.log(request.body);
    let responseObject = { ...defaultResponseObject };

    let sql = "INSERT INTO `maintenances` (`vehicle_id`, `title`, `date`, `distance`, `price`, `notes`) VALUES (?,?,?,?,?,?)";
    let data = [
        request.body.vehicleId,
        request.body.title,
        request.body.date,
        request.body.distance,
        request.body.price,
        request.body.notes,
    ];
    db.query(sql, data,(err, rows) => {
        if(err) {
            console.log('error: ', err);
            responseObject.error = err;
            response.send(JSON.stringify(responseObject));

            return;
        }
        console.log(`db: `, rows);

        responseObject.status = 200;
        responseObject.data = { id: rows.insertId };
        response.send(JSON.stringify(responseObject));
    });
};

const vehicles = async (request, response) => {
    console.log(request.body);
    let responseObject = { ...defaultResponseObject };

    console.log(`post`, request.body.token);
    const userId = await token2userId(request.body.token);

    let sql = "SELECT `id`, `title` FROM `vehicles` WHERE `user_id` = ? ;";
    let data = [ userId ];
    console.log(`data`, data);

    let rows;

    try {
        rows = await db.query(sql, data);
    } catch(err) {
        console.log('error: ', err);
        responseObject.error = err;
        response.send(JSON.stringify(responseObject));

        return;        
    }
    console.log(rows);

    responseObject.status = 200;
    responseObject.data = rows;
    response.send(JSON.stringify(responseObject));
};

const dbDisconnect = () => {
    db.end();
};

module.exports = {
    hello: hello,

    register: register,
    login: login,
    maintenances: maintenances,
    maintenanceAdd: maintenanceAdd,
    vehicles: vehicles,

    dbDisconnect: dbDisconnect,
};