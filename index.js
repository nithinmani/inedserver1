const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const UserModel = require("./models/user.model");
const StockModel = require("./models/stock");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.2",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.post("/api/register", async (req, res) => {
  console.log(req.body);
  try {
    const newPassword = await bcrypt.hash(req.body.password, 10);
    await UserModel.create({
      name: req.body.name,
      email: req.body.email,
      password: newPassword,
    });
    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "error", error: "Duplicate email" });
  }
});

app.post("/api/login", async (req, res) => {
  const token = req.headers["x-access-token"];
  const user = await UserModel.findOne({
    email: req.body.email,
  });

  if (!user) {
    return { status: "error", error: "Invalid login" };
  }

  const isPasswordValid = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (isPasswordValid) {
    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
      },
      "secret123"
    );

    return res.json({ status: "ok", user: token });
  } else {
    return res.json({ status: "error", user: false });
  }
});

app.post("/api/add-stock", async (req, res) => {
  const token = req.headers["x-access-token"];

  try {
    // verify the JWT token
    const decodedToken = jwt.verify(token, "secret123");
    const email = decodedToken.email;

    console.log(decodedToken);
    console.log(email);

    console.log(req.body.DOP);

    const user = await UserModel.findOne({ email: email });
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.stock) {
      user.stock = { items: [] };
    }

    await user.addStock(
      req.body.company,
      req.body.DOP,
      req.body.VOP,
      req.body.stockVolume
    );

    // return success response
    return res.json({ status: "ok" });
  } catch (error) {
    console.log(error);

    res.json(error);
  }
});

app.get("/api/get-user", async (req, res) => {
  const token = req.headers["x-access-token"];

  try {
    // verify the JWT token
    const decodedToken = jwt.verify(token, "secret123");
    const email = decodedToken.email;

    console.log(decodedToken);
    console.log(email);

    const user = await UserModel.findOne({ email: email });
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stockDetails = await UserModel.aggregate([
      { $match: { email: email } }, // Match user's email
      { $unwind: "$stock.items" }, // Unwind the stock array
      {
        $lookup: {
          from: "stocks", // Specify the name of the stock collection
          localField: "stock.items.stockId",
          foreignField: "_id",
          as: "stockDetails",
        },
      },
      { $unwind: "$stockDetails" },
      // {
      //   $group: {
      //     _id: "$stockDetails.company",
      //     stocks: {
      //       $push: {
      //         stockId: "$stock.items.stockId",
      //         DOP: "$stockDetails.DOP",
      //         VOP: "$stockDetails.VOP",
      //         stockVolume: "$stock.items.stockVolume",
      //       },
      //     },
      //   },
      // },
      // {
      //   $project: {
      //     _id: 0,
      //     company: "$_id",
      //     DOP: "$stockDetails.DOP",
      //     VOP: "$stockDetails.VOP",
      //     stockVolume: "$stock.items.stockVolume",
      //     stocks: 1,
      //   },
      // },
      // Unwind the stockDetails array
      {
        $project: {
          _id: 0,
          stockId: "$stock.items.stockId",
          company: "$stockDetails.company",
          DOP: "$stockDetails.DOP",
          VOP: "$stockDetails.VOP",
          stockVolume: "$stockDetails.stockVolume",
        },
      },
    ]);
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "080d5391a5msh8465fd7b03a93c4p1725e9jsnb512929f94b5",
        "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
      },
    };

    fetch(
      `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${stockDetails.company}/financial-data`,
      options
    )
      .then((response) => response.json())
      .then((response) => console.log(response))
      .catch((err) => console.error(err));
    // return success response
    console.log(stockDetails);
    console.log(typeof stockDetails.details);
    console.log(stockDetails.details);
    return res.status(200).json({ user: user, stocks: stockDetails });
  } catch (error) {
    console.log(error);

    res.json(error);
  }
});

//server starting codeeee......................................................................

app.listen(1337, () => {
  console.log("Server started on 1337");
});
//server started.....................................................................................
