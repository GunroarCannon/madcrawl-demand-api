import express from "express";
import nodemailer from "nodemailer";
import "dotenv/config";

import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = process.env.MONGODB_URI;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function runMongoConnection() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await mongoClient.connect();
    // Send a ping to confirm a successful connection
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //await mongoClient.close();
  }
}

process.on("SIGINT", async () => {
  await mongoClient.close();
  console.log("🔒 MongoDB connection closed.");
  process.exit(0);
});

const app = express();
app.use(express.json());


// Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail", // change to your provider if not Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/health", (req, res) =>{
    res.send("Server is doing pretty okay if you ask me.");
    
})
app.post("/demand", async (req, res) => {
    try {

        await mongoClient.connect();
        const {demandText} = req.body;

        const madcrawlDB = mongoClient.db("madcrawl");
        const demands = madcrawlDB.collection("demands");

        await demands.insertOne({ demand: demandText, date: new Date() });

        
        await transporter.sendMail({
            from: `"Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, 
            subject: "Madcrawl New Demand",
            text: `\n\nMessage:\n${demandText}`,
        });
 


         res.json({success:true, message:"Demand added successfully"});


    }
    catch (error) {
        console.error("Error adding demand:", error);
        res.status(500).json({success:false, message:"Internal server error"});
    }
    finally {
        //await mongoClient.close();
    } 

})

app.listen(3000, ()=>{
    console.log("Server started on port 3000");

    runMongoConnection();
})