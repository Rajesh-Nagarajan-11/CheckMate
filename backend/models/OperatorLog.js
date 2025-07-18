const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  event_type: { type: String, required: true },
  obstacle_data: {
    distance_cm: Number,
    obstacle_detected: Boolean
  },
  drowsiness_event: {
    detected: Boolean,
    confidence: Number
  },
  engine_data: {
    engine_temperature: Number,
    engine_humidity: Number,
    fault_code: Number,
    fault_status: String,
    rule_based: Boolean
  }
}, { _id: false });

const OperatorLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  rfid: {
    tag_id: String,
    vehicle_id: String
  },
  task_data: [
    {
      task_name: String,
      engine_hours: Number,
      fuel_used: Number,
      load_cycles: Number,
      idling_time: Number,
      predicted_time_minutes: Number,
      task_model_used: String
    }
  ],
  speed_data: {
    accel_x: Number,
    accel_y: Number,
    predicted_speed_kmph: Number,
    speed_model_used: String
  },
  engine_data: {
    engine_temperature: Number,
    engine_humidity: Number,
    fault_code: Number,
    fault_status: String,
    rule_based: Boolean
  },
  drowsiness_event: {
    detected: Boolean,
    confidence: Number
  },
  obstacle_data: {
    distance_cm: Number,
    obstacle_detected: Boolean
  },
  logs: [LogSchema]
});

module.exports = mongoose.model('OperatorLog', OperatorLogSchema);
