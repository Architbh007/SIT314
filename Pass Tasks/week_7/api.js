require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const Sensor = require('./models/sensor');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is missing. Create a .env file from .env.example.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected successfully to MongoDB Atlas'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

// READ: return all sensor readings
app.get('/', async (req, res) => {
  try {
    const sensors = await Sensor.find({}).sort({ time: -1 });
    res.status(200).json(sensors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sensor readings' });
  }
});

// READ: return one sensor reading by MongoDB _id
app.get('/:id', async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id);

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor reading not found' });
    }

    res.status(200).json(sensor);
  } catch (err) {
    res.status(400).json({ error: 'Invalid sensor ID' });
  }
});

// CREATE: add a new sensor reading
// If no temperature is supplied, a random 10-39 C reading is generated,
// matching the original Week 7 exercise.
app.post('/', async (req, res) => {
  try {
    const generatedTemperature = Math.floor(Math.random() * (40 - 10) + 10);

    const newSensor = new Sensor({
      id: req.body.id,
      name: req.body.name || 'temperaturesensor',
      address: req.body.address || '221 Burwood Hwy, Burwood VIC 3125',
      time: req.body.time || Date.now(),
      temperature:
        req.body.temperature !== undefined
          ? req.body.temperature
          : generatedTemperature
    });

    const savedSensor = await newSensor.save();

    console.log('Saving sensor reading to database');
    console.log(savedSensor);

    res.status(201).json({
      message: 'Added Data!',
      sensor: savedSensor
    });
  } catch (err) {
    res.status(400).json({
      error: 'Failed to create sensor reading',
      details: err.message
    });
  }
});

// UPDATE: replace/update fields on an existing sensor reading
app.put('/:id', async (req, res) => {
  try {
    const updatedSensor = await Sensor.findByIdAndUpdate(
      req.params.id,
      {
        ...(req.body.id !== undefined && { id: req.body.id }),
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.address !== undefined && { address: req.body.address }),
        ...(req.body.time !== undefined && { time: req.body.time }),
        ...(req.body.temperature !== undefined && {
          temperature: req.body.temperature
        })
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedSensor) {
      return res.status(404).json({ error: 'Sensor reading not found' });
    }

    res.status(200).json({
      message: 'Sensor reading updated',
      sensor: updatedSensor
    });
  } catch (err) {
    res.status(400).json({
      error: 'Failed to update sensor reading',
      details: err.message
    });
  }
});

// DELETE: remove an existing sensor reading
app.delete('/:id', async (req, res) => {
  try {
    const deletedSensor = await Sensor.findByIdAndDelete(req.params.id);

    if (!deletedSensor) {
      return res.status(404).json({ error: 'Sensor reading not found' });
    }

    res.status(200).json({
      message: 'Sensor reading deleted',
      sensor: deletedSensor
    });
  } catch (err) {
    res.status(400).json({
      error: 'Failed to delete sensor reading',
      details: err.message
    });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
