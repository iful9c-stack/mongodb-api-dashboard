import { getDatabase } from "./lib/mongodb.js";


export default async function handler(req,res){

    try {

        const db =
            await getDatabase();


        const page =
            Number(req.query.page || 1);


        const limit =
            Number(req.query.limit || 100);


        const skip =
            (page-1) * limit;


        const collection =
            db.collection("list_mitra");


        const total =
            await collection.countDocuments();


        const data =
            await collection
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();


        res.status(200).json({

            page,
            limit,
            total,
            data

        });


    } catch(error){

        res.status(500).json({
            error:error.message
        });

    }

}
