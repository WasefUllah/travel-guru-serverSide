require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r0tlims.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("travel-guru");
    const userCollection = database.collection("users");
    const destinationCollection = database.collection("destinations");
    const packageCollection = database.collection("packages");

    // POST APIs

    app.post("/users", async (req, res) => {
      const user = await userCollection.insertOne(req.body);
      res.send(user);
    });

    app.post("/destinations", async (req, res) => {
      const destination = await destinationCollection.insertOne(req.body);
      res.send(destination);
    });

    app.post("/packages", async (req, res) => {
      console.log(req.body);
      const package = await packageCollection.insertOne(req.body);
      res.send(package);
    });

    // GET APIs

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).json({ error: "Email query param is required" });
      }
      try {
        const user = await userCollection.findOne({ email });

        if (user) {
          res.status(200).json({ exists: true, user });
        } else {
          res.status(404).json({ exists: false, user: null });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/destinations", async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.send(result);
    });

    app.get("/packages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
