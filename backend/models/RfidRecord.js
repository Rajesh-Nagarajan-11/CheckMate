const mongoose = require('mongoose');

const RfidSchema = new mongoose.Schema({
  tag_id: String,
  vehicle_id: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RfidRecord', RfidSchema);
