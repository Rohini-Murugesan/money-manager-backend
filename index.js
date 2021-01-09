const express = require("express")
const mongodb = require("mongodb");
const app = express()
app.use(express.json())
const bcrypt = require("bcryptjs");
const mongoClient = mongodb.MongoClient;
const port = process.env.PORT || 3000;
const dburl = "mongodb://127.0.0.1:27017/" || process.env.DB_URL; // local db url


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


app.post("/income/add", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["income_category", "income_amt","income_description"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            const currentDate = new Date();
            request.body["Date"] = currentDate.getTime();
            let total = await db.collection("income").find().toArray();
            let Analytics = await db.collection("Analytics").find({},{projection: {"income_count":1}}).toArray();
            await db.collection("Analytics").findOneAndUpdate({},{ $inc: {income_count : 1}});
            console.log(Analytics)
            request.body["Income_ID"] = Analytics[0].income_count + 1;
            let result = await db.collection("income").insertOne(request.body);      
            response
                .status(202)
                .json({
                    msg: "Income added successfully",
                    ID: request.body.Income_ID
                });

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

app.post("/income/delete", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["Income_ID"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let result = await db.collection("income").deleteOne({Income_ID: request.body.Income_ID})
            await db.collection("Analytics").findOneAndUpdate({},{ $inc: {income_deleted : 1}});
            if(!result.deletedCount){ // returns 0 or deleted count
                response.status(404).json({'msg':'ID is not found'})
            }else{
                response.status(200).json({'msg':'Record Deleted'})
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


app.post("/income/deleteAll", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        // requiredKeys = ["Income_ID"];
        Keys = Object.keys(request.body)
        db.collection("income").deleteMany({Income_ID:{$gt:0}});
        response.sendStatus(202);
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/income/allDetails", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        let result = await db
        .collection("income")
        .find().toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});


app.listen(port,()=>{
    console.log(`YOUR APPLICATION IS RUNNING IN PORT ${port}`)
})