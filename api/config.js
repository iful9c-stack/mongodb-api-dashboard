import { getDatabase } from "./lib/mongodb.js";


export default async function handler(req,res){

    try {

        const db =
            await getDatabase();


        const data =
            await db
            .collection("config")
            .find({})
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
