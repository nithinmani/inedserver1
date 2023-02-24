const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  company: { type: String, required: true },
  DOP: { type: String, required: true },
  VOP: { type: String, required: true },
  stockVolume: { type: Number },
});

module.exports = mongoose.model("Stock", stockSchema);
