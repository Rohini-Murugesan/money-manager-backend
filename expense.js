
module.exports = function(app,mongoClient,dburl) {
    app.post("/expense/add", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["expense_category", "expense_amt","expense_description","userId","Date","expense_division"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            const currentDate = new Date();
            request.body["Date"] = new Date(request.body.Date);
            //console.log(request.body.Date);
            request.body["Time"] = currentDate.getTime();
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

app.get("/expense/allDetails/:userId", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        let result = await db
        .collection("expense")
        .find({userId:+request.params.userId}).toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/expense/filter/fromDate/:fromDate/toDate/:toDate", async (request, response) => {
    try {
        let fromDate = new Date(request.params.fromDate);
        let toDate = new Date(request.params.toDate)
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        let result = await db
        .collection("expense")
        .find({userId:request.body.userId,Date:{$gte:fromDate,$lt:toDate}}).toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/expense/filter/category/:category", async (request, response) => {
    try {
        let category = request.params.category
        // console.log(category)
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        let result = await db
        .collection("expense")
        .find({userId:request.body.userId,expense_category:category}).toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});


app.get("/expense/filter/division/:division", async (request, response) => {
    try {
        let division = request.params.division
        // console.log(division)
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        let result = await db
        .collection("expense")
        .find({userId:request.body.userId,expense_division:division}).toArray();
        response.status(202).json({"data":result});
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});



app.post("/expense/edit", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("money_manager");
        requiredKeys = ["expense_category", "expense_amt","expense_description","userId","Date","Expense_ID","expense_division"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let isPresent = await db
            .collection("expense")
            .findOne({userId :  request.body.userId,
                Expense_ID: request.body.Expense_ID
            });
            if (!isPresent) {
                response.status(404).json({
                    msg: "Expense Id is not found for this user"
                });
            } else {
            const currentDate = new Date();
            let curr_time = currentDate.getTime();
            if(curr_time - isPresent.Time > 120000 ){
                response
                .status(406)
                .json({
                    msg: "Edit can be done only within 2mins",
                    ID: request.body.Expense_ID
                });
            }else{
                response
                    .status(202)
                    .json({
                        msg: "Expense updated successfully",
                        ID: request.body.Expense_ID
                    });            let result = await db.collection("expense").findOneAndUpdate({"userId":request.body.userId,Expense_ID: request.body.Expense_ID},{ $set: request.body});;      
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