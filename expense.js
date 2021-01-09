
module.exports = function(app,mongoClient,dburl) {
    app.post("/expense/add", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["expense_category", "expense_amt","expense_description","userId"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            const currentDate = new Date();
            request.body["Date"] = currentDate.getTime();
            let Analytics = await db.collection("Analytics").find({"userId":request.body.userId},{projection: {"expense_count":1}}).toArray();
            await db.collection("Analytics").findOneAndUpdate({"userId":request.body.userId},{ $inc: {expense_count : 1}});
            console.log(Analytics)
            request.body["Expense_ID"] = Analytics[0].expense_count + 1;
            let result = await db.collection("expense").insertOne(request.body);      
            response
                .status(202)
                .json({
                    msg: "Expense added successfully",
                    ID: request.body.Expense_ID
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

app.post("/expense/delete", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["Expense_ID","userId"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let result = await db.collection("expense").deleteOne({Expense_ID: request.body.Expense_ID, userId:request.body.userId})
            await db.collection("Analytics").findOneAndUpdate({userId:request.body.userId},{ $inc: {expense_deleted : 1}});
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


app.post("/expense/deleteAll", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        Keys = Object.keys(request.body)
        db.collection("expense").deleteMany({Expense_ID:{$gt:0},userId:request.body.userId});
        response.sendStatus(202);
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/expense/allDetails", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        let result = await db
        .collection("expense")
        .find({userId:request.body.userId}).toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

}