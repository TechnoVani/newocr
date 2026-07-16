import mysql from "mysql2/promise";


const pool = mysql.createPool({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT,

    waitForConnections:true,

    connectionLimit:10,

    queueLimit:0

});



const connectDatabase = async()=>{

    try{

        const connection = await pool.getConnection();


        console.log(
            "MySQL Database Connected Successfully"
        );


        connection.release();


    }
    catch(error){

        console.error(
            "Database Connection Failed:",
            error.message
        );


        process.exit(1);

    }

};



export {
    pool
};


export default connectDatabase;