const express = require('express');
const router = express.Router();
const {
  getPredictedTime,
  getPredictedSpeed,
  getEngineFault,
} = require('../services/fastapiClient');

const RfidRecord = require('../models/RfidRecord');
const OperatorLog = require('../models/OperatorLog');

// Middleware to check vehicle_id presence
function requireVehicleId(req, res, next) {
  const vehicle_id = req.body.vehicle_id;
  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id is required' });
  }
  next();
}

// ========== Task Time Prediction ==========
router.post('/predict/time', requireVehicleId, async (req, res) => {
  const { vehicle_id, task_data } = req.body;
  try {
    const prediction = await getPredictedTime(task_data);
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id
      },
      $push: {
        task_data: prediction
      },
      $setOnInsert: { timestamp: new Date() }
    };
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    req.io?.emit('task_update', {
      vehicle_id,
      task_data: log.task_data || [],
      logs: log.logs || []
    });
    req.io?.emit('operatorlog_update', { log, event: 'task_data' });
    res.json({ message: '✅ Task prediction saved', prediction, log });
  } catch (err) {
    console.error('❌ Task prediction error:', err);
    res.status(500).json({ error: 'Task prediction failed' });
  }
});

// ========== Speed Prediction ==========
router.post('/predict/speed', requireVehicleId, async (req, res) => {
  const { vehicle_id, accel_data } = req.body;
  try {
    const prediction = await getPredictedSpeed(accel_data);
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id,
        speed_data: prediction
      },
      $setOnInsert: { timestamp: new Date() }
    };
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    req.io?.emit('speed_update', {
      vehicle_id,
      speed_data: log.speed_data || null,
      logs: log.logs || []
    });
    req.io?.emit('operatorlog_update', { log, event: 'speed_data' });
    res.json({ message: '✅ Speed prediction saved', prediction, log });
  } catch (err) {
    console.error('❌ Speed prediction error:', err);
    res.status(500).json({ error: 'Speed prediction failed' });
  }
});

// ========== Engine Fault Detection ==========
router.post('/predict/engine', requireVehicleId, async (req, res) => {
  const { vehicle_id, engine_data } = req.body;
  // Send temperature and humidity to FastAPI and store the full response
  const { engine_temperature, engine_humidity } = engine_data || {};
  try {
    const result = await getEngineFault({ temperature: engine_temperature, humidity: engine_humidity });
    const mappedEngineData = {
      engine_temperature: result.temperature,
      engine_humidity: result.humidity,
      fault_code: result.fault_code,
      fault_status: result.fault_status,
      rule_based: result.rule_based
    };
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id,
        engine_data: mappedEngineData
      },
      $push: {
        logs: {
          timestamp: new Date(),
          event_type: 'engine_fault',
          engine_data: mappedEngineData
        }
      },
      $setOnInsert: { timestamp: new Date() }
    };
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    req.io?.emit('operatorlog_update', { log, event: 'engine_data' });
    res.json({ message: '✅ Engine data saved', engine_data: mappedEngineData, log });
  } catch (err) {
    console.error('❌ Engine data error:', err);
    res.status(500).json({ error: 'Engine data update failed' });
  }
});

// ========== Drowsiness Detection ==========
router.post('/predict/drowsiness', requireVehicleId, async (req, res) => {
  const { vehicle_id, drowsiness_event } = req.body;
  try {
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id,
        drowsiness_event: drowsiness_event
      },
      $push: {
        logs: {
          timestamp: new Date(),
          event_type: 'drowsiness_detected',
          drowsiness_event: drowsiness_event
        }
      },
      $setOnInsert: { timestamp: new Date() }
    };
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    req.io?.emit('operatorlog_update', { log, event: 'drowsiness_event' });
    res.json({ message: '✅ Drowsiness event logged', drowsiness_event, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log drowsiness event' });
  }
});

// ========== Obstacle Detection ==========
router.post('/predict/obstacle', requireVehicleId, async (req, res) => {
  const { vehicle_id, obstacle_data } = req.body;
  // Only use distance_cm and obstacle_detected from obstacle_data
  const { distance_cm, obstacle_detected } = obstacle_data || {};
  try {
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id,
        obstacle_data: { distance_cm, obstacle_detected }
      },
      $push: {
        logs: {
          timestamp: new Date(),
          event_type: 'obstacle_detected',
          obstacle_data: { distance_cm, obstacle_detected }
        }
      },
      $setOnInsert: { timestamp: new Date() }
    };
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    req.io?.emit('obstacle_update', {
      vehicle_id,
      obstacle_data: log.obstacle_data || null,
      logs: log.logs || []
    });
    req.io?.emit('operatorlog_update', { log, event: 'obstacle_data' });
    res.json({ message: '✅ Obstacle detection logged', obstacle_data: { distance_cm, obstacle_detected }, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log obstacle data' });
  }
});

// ========== RFID Only ==========
router.post('/rfid', requireVehicleId, async (req, res) => {
  try {
    const { vehicle_id, rfid_id } = req.body;
    const record = new RfidRecord({ vehicle_id, tag_id: rfid_id });
    await record.save();
    // Also upsert into OperatorLog with rfid_id
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id,
        'rfid.tag_id': rfid_id
      },
      $setOnInsert: { timestamp: new Date() }
    };
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    req.io?.emit('rfid_update', record);
    res.status(201).json({ message: '✅ RFID stored', record, log });
  } catch (err) {
    console.error('❌ RFID error:', err);
    res.status(500).json({ error: 'Failed to store RFID' });
  }
});

// ========== Check if RFID Exists ==========
router.get('/rfid/exists', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) {
    return res.status(400).json({ error: 'Missing vehicle_id in query' });
  }
  try {
    const doc = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
    if (doc) {
      return res.json({ exists: true, log: doc });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to check RFID existence' });
  }
});

// ========== Check if RFID Number Exists ==========
router.get('/rfid/number/exists', async (req, res) => {
  const { rfid_id } = req.query;
  if (!rfid_id) {
    return res.status(400).json({ error: 'Missing rfid_id in query' });
  }
  try {
    const doc = await RfidRecord.findOne({ tag_id: rfid_id });
    if (doc) {
      return res.json({ exists: true, record: doc });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to check RFID number existence' });
  }
});

// ========== GET: Latest Task Data ==========
router.get('/latest/task', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.task_data || log.task_data.length === 0) return res.status(404).json({ error: 'No task data found' });
  res.json({ task_data: log.task_data[log.task_data.length - 1] });
});

// ========== GET: Latest Speed Data ==========
router.get('/latest/speed', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.speed_data) return res.status(404).json({ error: 'No speed data found' });
  res.json({ speed_data: log.speed_data });
});

// ========== GET: Latest Engine Data ==========
router.get('/latest/engine', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.engine_data) return res.status(404).json({ error: 'No engine data found' });
  res.json({ engine_data: log.engine_data });
});

// ========== GET: Latest Obstacle Data ==========
router.get('/latest/obstacle', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.obstacle_data) return res.status(404).json({ error: 'No obstacle data found' });
  res.json({ obstacle_data: log.obstacle_data });
});

// ========== GET: Latest Drowsiness Data ==========
router.get('/latest/drowsiness', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.drowsiness_event) return res.status(404).json({ error: 'No drowsiness data found' });
  res.json({ drowsiness_event: log.drowsiness_event });
});

// ========== GET: All Logs for a Vehicle ========== 
router.get('/latest/logs', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.logs) return res.status(404).json({ error: 'No logs found' });
  res.json({ logs: log.logs });
});

// ========== GET: Dashboard (All Latest Data + Logs) ==========
router.get('/latest/dashboard', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id is required' });
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log) return res.status(404).json({ error: 'No data found for this vehicle' });
  res.json({
    task_data: log.task_data || [],
    speed_data: log.speed_data || null,
    engine_data: log.engine_data || null,
    obstacle_data: log.obstacle_data || null,
    drowsiness_event: log.drowsiness_event || null,
    rfid: log.rfid || null,
    timestamp: log.timestamp,
    logs: log.logs || []
  });
});

// ========== RFID Verification ========== 
router.post('/rfid/verify', async (req, res) => {
  const { vehicle_id, rfid_id } = req.body;
  let status = 'not_found';
  if (!vehicle_id || !rfid_id) {
    req.io?.emit('rfid_auth_result', { vehicle_id, rfid_id, status });
    return res.status(400).json({ status, message: 'vehicle_id and rfid_id are required.' });
  }
  const log = await OperatorLog.findOne({ 'rfid.vehicle_id': vehicle_id });
  if (!log || !log.rfid || !log.rfid.tag_id) {
    req.io?.emit('rfid_auth_result', { vehicle_id, rfid_id, status });
    return res.status(404).json({ status, message: 'Vehicle or RFID not found.' });
  }
  if (log.rfid.tag_id === rfid_id) {
    status = 'allow';
    req.io?.emit('rfid_auth_result', { vehicle_id, rfid_id, status });
    return res.json({ status, message: 'RFID matches. Access granted.' });
  } else {
    status = 'restrict';
    req.io?.emit('rfid_auth_result', { vehicle_id, rfid_id, status });
    return res.json({ status, message: 'RFID does not match. Access denied.' });
  }
});

// ========== Populate Dummy Task Data ==========
router.post('/populate/dummy-tasks', requireVehicleId, async (req, res) => {
  const { vehicle_id } = req.body;
  
  const dummyTasks = [
    {
      task_name: "Boulder Clearing",
      predicted_time_minutes: 128.5,
      priority: "high",
      location: "Site A - North Section",
      equipment_required: "Excavator, Rock Breaker",
      safety_notes: "Wear hard hat, safety glasses, and high-vis vest"
    },
    {
      task_name: "Road Repair",
      predicted_time_minutes: 56.0,
      priority: "medium",
      location: "Main Access Road",
      equipment_required: "Grader, Compactor",
      safety_notes: "Set up traffic cones and warning signs"
    },
    {
      task_name: "Foundation Excavation",
      predicted_time_minutes: 180.0,
      priority: "high",
      location: "Building Site B",
      equipment_required: "Excavator, Dump Truck",
      safety_notes: "Check for underground utilities before starting"
    },
    {
      task_name: "Material Transport",
      predicted_time_minutes: 45.0,
      priority: "low",
      location: "Warehouse to Site C",
      equipment_required: "Dump Truck, Loader",
      safety_notes: "Secure load properly and check tire pressure"
    },
    {
      task_name: "Site Grading",
      predicted_time_minutes: 95.0,
      priority: "medium",
      location: "Site D - Parking Area",
      equipment_required: "Bulldozer, Grader",
      safety_notes: "Maintain proper slope for drainage"
    },
    {
      task_name: "Equipment Maintenance",
      predicted_time_minutes: 30.0,
      priority: "high",
      location: "Maintenance Bay",
      equipment_required: "Service Tools",
      safety_notes: "Follow lockout/tagout procedures"
    },
    {
      task_name: "Debris Removal",
      predicted_time_minutes: 75.0,
      priority: "medium",
      location: "Site A - South Section",
      equipment_required: "Excavator, Dump Truck",
      safety_notes: "Sort materials for recycling when possible"
    },
    {
      task_name: "Safety Inspection",
      predicted_time_minutes: 20.0,
      priority: "high",
      location: "All Sites",
      equipment_required: "Inspection Checklist",
      safety_notes: "Document all findings and report issues"
    }
  ];

  try {
    const filter = { 'rfid.vehicle_id': vehicle_id };
    const update = {
      $set: {
        'rfid.vehicle_id': vehicle_id,
        task_data: dummyTasks
      },
      $setOnInsert: { timestamp: new Date() }
    };
    
    const log = await OperatorLog.findOneAndUpdate(filter, update, { new: true, upsert: true });
    
    // Emit real-time update
    req.io?.emit('task_update', {
      vehicle_id,
      task_data: log.task_data || [],
      logs: log.logs || []
    });
    
    res.json({ 
      message: '✅ Dummy task data populated successfully', 
      task_count: dummyTasks.length,
      tasks: dummyTasks,
      log 
    });
  } catch (err) {
    console.error('❌ Error populating dummy tasks:', err);
    res.status(500).json({ error: 'Failed to populate dummy task data' });
  }
});

module.exports = router;
