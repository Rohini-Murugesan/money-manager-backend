const express = require("express")
const mongodb = require("mongodb");
const dotenv = require('dotenv').config();
const app = express()
const cors = require("cors")
app.use(express.json())
app.use(cors())
const bcrypt = require("bcryptjs");
const mongoClient = mongodb.MongoClient;
const port = process.env.PORT || 3000;
const dburl =   process.env.DB_URL || "mongodb://127.0.0.1:27017/" ; // local db url

require('./expense')(app,mongoClient,dburl);
require('./income')(app,mongoClient,dburl);

app.post("/register", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        if (request.body.email && request.body.name && request.body.password) {
            let isPresent = await db
                .collection("users_details")
                .findOne({
                    email: request.body.email
                });
            let total = await db.collection("users_details").find().toArray();
            if (isPresent) {
                response.status(406).json({
                    msg: "User already registered"
                });
            } else {
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(request.body.password, salt);
                request.body.password = hash;
                request.body["ID"] = total.length + 1;
                let result = await db.collection("users_details").insertOne(request.body);
                let Analytics = db.collection("Analytics").insertOne({"income_count":0,"income_deleted":0,"expense_count":0,"expense_deleted":0,"userId":total.length + 1})
                response
                    .status(202)
                    .json({
                        msg: "User registered successfully",
                        ID: request.body.ID
                    });
                    
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});


app.post("/login", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["email", "password"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let isPresent = await db
                .collection("users_details")
                .findOne({
                    email: request.body.email
                });
            if (isPresent && bcrypt.compareSync(request.body.password, isPresent.password)) {
                response.status(202).json({
                    msg: "Login success"
                });
            } else if ((isPresent && !bcrypt.compareSync(request.body.password, isPresent.password))) {
                response.status(401).json({
                    msg: "Wrong Password"
                });
            } else {
                response.status(404).json({
                    msg: "User Not Found"
                });
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});



app.listen(port,()=>{
    console.log(`YOUR APPLICATION IS RUNNING IN PORT ${port}`)
})