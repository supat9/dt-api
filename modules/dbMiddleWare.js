const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.connect();

exports.query = async function (queryStr) {
    let data =await pool.query(queryStr).then(res => {        // query start unit
        // console.log(strStartUnit)
        return res;
    })
    return data;
}


exports.queryWithValue = async function (queryStr,value) {
    let data =await pool.query(queryStr,value).then(res => {        // query start unit
        // console.log(strStartUnit)
        return res;
    })
    return data;
}