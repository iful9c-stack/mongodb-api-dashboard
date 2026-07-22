import { MongoClient } from "mongodb";


let client;


export async function getDatabase(){

    if(!client){

        client = new MongoClient(
            process.env.MONGODB_URI
        );

        await client.connect();

    }


    return client.db("dashboard_fo");

}
