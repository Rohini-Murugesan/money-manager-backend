module.exports = (app,mongoClient,dburl)=>{
app.post("/income/add", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["income_category", "income_amt","income_description","userId","Date","income_division"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            const currentDate = new Date();
            request.body["Time"] = currentDate.getTime();
            let Analytics = await db.collection("Analytics").find({"userId":request.body.userId},{projection: {"income_count":1}}).toArray();
            await db.collection("Analytics").findOneAndUpdate({"userId":request.body.userId},{ $inc: {income_count : 1}});
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
        requiredKeys = ["Income_ID","userId"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let result = await db.collection("income").deleteOne({Income_ID: request.body.Income_ID, userId:request.body.userId})
            await db.collection("Analytics").findOneAndUpdate({userId:request.body.userId},{ $inc: {income_deleted : 1}});
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
        db.collection("income").deleteMany({Income_ID:{$gt:0},userId:request.body.userId});
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
        .find({userId:request.body.userId}).toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.post("/income/edit", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["income_category", "income_amt","income_description","userId","Date","Income_ID","income_division"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let isPresent = await db
            .collection("income")
            .findOne({userId :  request.body.userId,
                Income_ID: request.body.Income_ID
            });
            if (!isPresent) {
                response.status(404).json({
                    msg: "Income Id is not found for this user"
                });
            } else {
            const currentDate = new Date();
            let curr_time = currentDate.getTime();
            if(curr_time - isPresent.Time > 120000 ){
                response
                .status(406)
                .json({
                    msg: "Edit can be done only within 2mins",
                    ID: request.body.Income_ID
                });
            }else{
                response
                    .status(202)
                    .json({
                        msg: "Income updated successfully",
                        ID: request.body.Income_ID
                    });            let result = await db.collection("income").findOneAndUpdate({"userId":request.body.userId,Income_ID: request.body.Income_ID},{ $set: request.body});;      
            }
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

}

