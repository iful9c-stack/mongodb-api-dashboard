import { MongoClient } from "mongodb";


let client;


async function connectDB(){

    if(!client){

        client = new MongoClient(
            process.env.MONGODB_URI
        );

        await client.connect();
    }

    return client;

}



export default async function handler(req,res){

    try {


        const client =
            await connectDB();


        const db =
            client.db("dashboard_fo");


        const data =
            await db
            .collection("list_mitra")
            .find({})
            .limit(1000)
            .toArray();


        res.status(200).json({
            total:data.length,
            data
        });


    } catch(error){

        res.status(500).json({
            error:error.message
        });

    }

}
