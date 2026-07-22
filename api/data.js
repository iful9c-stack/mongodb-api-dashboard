import { getDatabase } from "./lib/mongodb.js";


export default async function handler(req,res){

    try {

        const db =
            await getDatabase();


        const collectionName =
            req.query.collection;


        if(!collectionName){

            return res.status(400).json({
                error:"collection is required"
            });

        }


        const collection =
            db.collection(collectionName);



        /*
        ==========================
        GET DATA
        ==========================
        */


        if(req.method === "GET"){


            const page =
            Number(req.query.page || 1);


            const limit =
            Number(req.query.limit || 100);


            const skip =
            (page-1)*limit;



            const exclude=[
                "collection",
                "page",
                "limit",
                "sort",
                "order"
            ];



            const filter={};



            Object.keys(req.query)
            .forEach(key=>{

                if(!exclude.includes(key)){


                    filter[key]={
                        $regex:req.query[key],
                        $options:"i"
                    };


                }

            });



            const total =
            await collection
            .countDocuments(filter);



            let query =
            collection.find(filter);



            if(req.query.sort){


                query =
                query.sort({

                    [req.query.sort]:
                    req.query.order==="desc"
                    ? -1
                    : 1

                });


            }



            const data =
            await query
            .skip(skip)
            .limit(limit)
            .toArray();



            return res.json({

                total,
                page,
                limit,
                data

            });


        }





        /*
        ==========================
        POST INSERT
        ==========================
        */


        if(req.method === "POST"){


            const body =
            req.body;



            if(!body){

                return res.status(400).json({
                    error:"body required"
                });

            }



            const result =
            await collection.insertOne(body);



            return res.json({

                message:"insert success",

                id:
                result.insertedId

            });


        }





        /*
        ==========================
        PUT UPDATE
        ==========================
        */


        if(req.method === "PUT"){



            const {
                id,
                data
            } = req.body;



            if(!id){

                return res.status(400).json({
                    error:"id required"
                });

            }



            const result =
            await collection.updateOne(

                {
                    _id:id
                },

                {
                    $set:data
                }

            );



            return res.json({

                message:"update success",

                modified:
                result.modifiedCount

            });


        }





        /*
        ==========================
        DELETE
        ==========================
        */


        if(req.method === "DELETE"){



            const {
                id
            } = req.body;



            if(!id){

                return res.status(400).json({
                    error:"id required"
                });

            }



            const result =
            await collection.deleteOne({

                _id:id

            });



            return res.json({

                message:"delete success",

                deleted:
                result.deletedCount

            });


        }




        return res.status(405).json({

            error:
            "method not allowed"

        });



    }
    catch(error){


        return res.status(500).json({

            error:error.message

        });


    }

}
