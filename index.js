const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r0tlims.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const SSLCommerzPayment = require("sslcommerz-lts");
// sslcommerz
const serverUrl = "https://travel-guru-server-coral.vercel.app";
const clientUrl = "https://travel-guru-795b7.web.app";
const store_id = process.env.STORE_ID;
const store_password = process.env.STORE_PASS;
const is_live = false;

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
    const bookingCollection = database.collection("bookings");
    const faqCollection = database.collection("faqs");

    // POST APIs

    app.post("/faq", async (req, res) => {
      const { question, answer } = req.body;
      const result = await faqCollection.insertOne({ question, answer });
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const selectedPackage = await packageCollection.findOne({
        _id: new ObjectId(booking.packageId),
      });
      const name = booking.firstName + " " + booking.lastName;
      const tran_id = new ObjectId().toString();
      const pendingBooking = {
        ...booking,
        tran_id,
        status: "failed",
      };
      const result = await bookingCollection.insertOne(pendingBooking);

      const data = {
        total_amount: parseInt(booking.fee),
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `${serverUrl}/success/${tran_id}`,
        fail_url: `${serverUrl}/failed`,
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: name,
        cus_email: booking.userEmail,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: booking.phone,
        cus_fax: "01711111111",
        ship_name: name,
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const sslcz = new SSLCommerzPayment(store_id, store_password, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway

        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);
      });
    });

    app.post("/success/:tranId", async (req, res) => {
      const tranId = req.params.tranId;

      const result = await bookingCollection.updateOne(
        { tran_id: tranId },
        { $set: { status: "paid" } }
      );

      if (result.modifiedCount > 0) {
        // res.send(result);
        console.log(`Transaction ${tranId} marked as paid`);
        const booking = await bookingCollection.findOne({
          tran_id: tranId,
        });
        console.log();
        const result = await packageCollection.updateOne(
          { _id: new ObjectId(booking.packageId) },
          { $inc: { booked: 1 } }
        );

        res.redirect(`${clientUrl}/success/${tranId}`);
      } else {
        res.redirect(`${clientUrl}/failed`);
      }
    });

    app.post("/failed", (req, res) => {
      res.redirect(`${clientUrl}/failed`);
    });

    app.post("/users", async (req, res) => {
      const user = await userCollection.insertOne(req.body);
      res.send(user);
    });

    app.post("/destinations", async (req, res) => {
      const destination = await destinationCollection.insertOne(req.body);
      res.send(destination);
    });

    app.post("/packages", async (req, res) => {
      const package = await packageCollection.insertOne(req.body);
      res.send(package);
    });

    // GET APIs
    app.get("/faq", async (req, res) => {
      const result = await faqCollection.find().toArray();
      res.send(result);
    });

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
      const email = req.query.email;

      if (email) {
        query = { userEmail: email };
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/allPackages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });

    app.get("/popularDestination", async (req, res) => {
      const result = await destinationCollection
        .find({ popular: true })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/popularPackage", async (req, res) => {
      const result = await packageCollection
        .find({ popular: true })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/package/:id", async (req, res) => {
      const result = await packageCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    app.get("/approvedPackage", async (req, res) => {
      const result = await packageCollection
        .find({ approved: false })
        .toArray();
      res.send(result);
    });

    app.get("/packagesList", async (req, res) => {
      const email = req.query.email;
      const result = await packageCollection.find({ email: email }).toArray();
      res.send(result);
    });

    app.get("/viewPackages/:id", async (req, res) => {
      const result = await packageCollection
        .find({ destinationId: req.params.id, approved: true })
        .toArray();

      res.send(result);
    });

    app.get("/relatedPackages/:id", async (req, res) => {
      const relatedPackages = await packageCollection
        .find({ destinationId: req.params.id })
        .toArray();
      res.send(relatedPackages);
    });

    app.get("/relatedBookings/:id", async (req, res) => {
      const relatedBookings = await bookingCollection
        .find({ packageId: req.params.id })
        .toArray();
      res.send(relatedBookings);
    });

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const filter = req.query.filter;
      const role = req.query.role;
      let query = {};
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      try {
        if (role == "manager") {
          query = {
            status: "paid",
            managerEmail: email,
          };
        } else if (role == "customer") {
          query = {
            status: "paid",
            userEmail: email,
          };
        }
        if (filter) {
          query.packageId = filter;
        }
        const bookings = await bookingCollection.find(query).toArray();
        res.status(200).json(bookings);
      } catch (error) {
        console.error("Error fetching bookings for manager:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/paymentHistory", async (req, res) => {
      const result = await bookingCollection
        .find({ userEmail: req.query.email })
        .toArray();
      res.send(result);
    });

    // PUT APIs

    // PATCH APIs

    app.patch("/package/:id", async (req, res) => {
      const updatedFields = req.body;
      if (!updatedFields) {
        const existingResult = await packageCollection.findOne({
          _id: new ObjectId(req.params.id),
        });

        const updated = await packageCollection.updateOne(
          { _id: existingResult._id },
          { $set: { popular: !existingResult.popular } }
        );
        res.send(updated);
      } else {
        const result = await packageCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updatedFields }
        );
        res.send(result);
      }
    });

    app.patch("/booking/:id", async (req, res) => {
      const updatedFields = req.body;
      if (!updatedFields) {
        const existingResult = await destinationCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        const updated = await destinationCollection.updateOne(
          { _id: existingResult._id },
          { $set: { popular: !existingResult.popular } }
        );
        res.send(updated);
      } else {
        const result = await destinationCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updatedFields }
        );
        res.send(result);
      }
    });

    // DELETE APIs

    app.delete("/destinations/:id", async (req, res) => {
      const result = await destinationCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    app.delete("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const result = await packageCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(id),
      });
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
