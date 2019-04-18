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
    console.log(`register`, requestObject);

    let responseObject = { ...defaultResponseObject };

    if(!requestObject.email || !requestObject.password) {
        responseObject.status = 400;
        responseObject.error = 'Email or Password empty';

        response.send(JSON.stringify(responseObject));
        return;
    }

    let sql = `INSERT INTO \`users\` (\`email\`, \`password\`) VALUES (?, MD5(?))`;
    let data = [ `${requestObject.email}`, `${requestObject.password}${process.env.MD5_SALT}` ];
    console.log(sql, data);
    let userId;

    try {
        let result = await db.query(sql, data);
        console.log(`result`, result);
        userId = result.insertId;

        responseObject.status = 200;
    } catch (err) {
        responseObject.status = 400;
        responseObject.error = err;
    }

    if(userId) {
        vehicleAdd({ userId: userId, title: '' });
    }

    response.send(JSON.stringify(responseObject));
};

const login = async (request, response) => {
    let responseObject = { ...defaultResponseObject };

    if(!request || !request.body) {
        return;
    }

    console.log(request.body);
    let requestObject = request.body;
    // requestObject = JSON.parse(req.json);
    // console.log(requestObject.email);


    if(!requestObject.email || !requestObject.password) {
        responseObject.status = 400;
        responseObject.error = `Login or password empty`;
        response.send(JSON.stringify(responseObject));
                
        return;
    }

    let sql = `SELECT * FROM \`users\` WHERE \`email\` = '${requestObject.email}' AND \`password\` = MD5('${requestObject.password}${process.env.MD5_SALT}') LIMIT 1`;
    console.log(sql);
    let results;
    try {
        results = await db.query(sql);
    } catch(err) {
        responseObject.status = 400;
        responseObject.error = err;
        console.log('error: ', err);
        response.send(JSON.stringify(responseObject));
        
        return;
    }
    
    if(results.length === 0) {
        responseObject.status = 400;
        responseObject.error = `Login or password not correct`;
        response.send(JSON.stringify(responseObject));
        
        return;
    }

    console.log('results RowDataPacket: ', results[0].id);

    if(!results || !results[0] || !results[0].id) {
        responseObject.status = 400;
        response.send(JSON.stringify(responseObject));
        return;
    }

    let token = crypto.createHash('md5').update(`${Math.random()}${process.env.MD5_SALT}`).digest("hex");
    sql = `INSERT INTO \`tokens\` (\`user_id\`, \`token\`, \`timestamp\`) VALUES ('${results[0].id}', '${token}', UNIX_TIMESTAMP())`;
    console.log(sql);
    try {
        results = await db.query(sql);
    } catch (err) {
        responseObject.status = 400;
        responseObject.error = err;
        response.send(JSON.stringify(responseObject));

        return;
    }
    
    if(!results || !(typeof results === 'object') || !results.insertId || !(typeof results.insertId === 'number') ) {
        responseObject.status = 400;
        responseObject.error = 'Token not saved';
        response.send(JSON.stringify(responseObject));

        return;
    }

    responseObject.status = 200;
    responseObject.data = { token: token };
    response.send(JSON.stringify(responseObject));    
};

const maintenances = async (request, response) => {
    console.log(request.body);
    let responseObject = { ...defaultResponseObject };

    const userId = await token2userId(request.body.token);
    console.log(`userId`, userId);
    let sql = `SELECT 
                    * 
                FROM
                    \`users\`
                    INNER JOIN \`vehicles\` ON (\`vehicles\`.\`user_id\` = \`users\`.\`id\`)
                    INNER JOIN \`maintenances\` ON (\`maintenances\`.\`vehicle_id\` = \`vehicles\`.\`id\`)
                WHERE \`users\`.\`id\` = ?`;

    let results;
    try {
        results = await db.query(sql, [ userId ]);
    } catch(err) {

        console.log('error: ', err);
        responseObject.error = err;
        response.send(JSON.stringify(responseObject));

        return;
    }

    console.log(`db SELECT - success`, results);
    responseObject.status = 200;
    responseObject.data = results;
    response.send(JSON.stringify(responseObject));
};

const maintenanceAdd = async (request, response) => {
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

    let result;
    try {
        result = await db.query(sql, data);
    } catch(err) {
        console.log('error: ', err);
        responseObject.error = err;
        response.send(JSON.stringify(responseObject));

        return;
    }

    console.log(`db: `, result);

    sql = "UPDATE `vehicles` SET `distance` = ? WHERE `id` = ? AND `distance` < ?";
    data = [
        request.body.distance,
        request.body.vehicleId,
        request.body.distance,
    ];

    try {
        await db.query(sql, data);
    } catch (err) {
        console.log('error: ', err);
    }

    responseObject.status = 200;
    responseObject.data = { id: result.insertId };
    response.send(JSON.stringify(responseObject));
};

const vehicles = async (request, response) => {
    console.log(request.body);
    let responseObject = { ...defaultResponseObject };

    console.log(`post`, request.body.token);
    const userId = await token2userId(request.body.token);

    let sql = "SELECT `id`, `title`, `distance` FROM `vehicles` WHERE `user_id` = ? ;";
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

const vehicleAdd = async (vehicle) => {
    let sql = "INSERT INTO `vehicles` (`user_id`, `title`) VALUES (?,?);";
    let data = [
        vehicle.userId,
        vehicle.title
    ];
    console.log('sql: ', sql);
    console.log('data: ', data);
    let result;

    try {
        result = await db.query(sql, data);
    } catch(err) {
        console.log('error: ', err);
        return -1;
    }

    console.log(`db: `, result);
    return result.id;
}

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