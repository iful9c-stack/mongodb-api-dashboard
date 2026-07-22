import { getDatabase } from "./lib/mongodb.js";


export default async function handler(req,res){

    try {


        const db =
            await getDatabase();



        /*
            Contoh:

            /api/data?collection=list_mitra

            /api/data?
            collection=list_mitra
            &branch=Lamongan
            &status=ACTIVE
            &page=1
            &limit=100
        */


        const collectionName =
            req.query.collection;



        if(!collectionName){

            return res.status(400).json({

                error:
                "collection is required"

            });

        }



        const collection =
            db.collection(collectionName);



        const page =
            Number(req.query.page || 1);



        const limit =
            Number(req.query.limit || 100);



        const skip =
            (page - 1) * limit;



        /*
          Buat filter otomatis

          Semua parameter selain:
          collection,page,limit,sort,order
          dianggap filter
        */


        const exclude = [
            "collection",
            "page",
            "limit",
            "sort",
            "order"
        ];



        const filter = {};



        Object.keys(req.query)
        .forEach(key=>{


            if(!exclude.includes(key)){


                filter[key] = {

                    $regex:
                    req.query[key],

                    $options:"i"

                };


            }


        });



        const total =
            await collection
            .countDocuments(filter);



        let query =
            collection
            .find(filter);



        // sorting

        if(req.query.sort){


            const order =
            req.query.order === "desc"
            ? -1
            : 1;


            query =
            query.sort({

                [req.query.sort]:
                order

            });


        }



        const data =
            await query
            .skip(skip)
            .limit(limit)
            .toArray();



        res.status(200).json({

            collection:
            collectionName,


            page,

            limit,

            total,


            filter,


            data


        });



    } catch(error){


        res.status(500).json({

            error:
            error.message

        });


    }

}
