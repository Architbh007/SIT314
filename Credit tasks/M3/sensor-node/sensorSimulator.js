const sensors = [
  {
    sensorId: "seminar-front-01",
    zone: "FRONT",
    totalChairs: 10,
    temperature: 23.1,
    humidity: 49,
    chairsOccupied: 3
  },
  {
    sensorId: "seminar-middle-01",
    zone: "MIDDLE",
    totalChairs: 10,
    temperature: 23.0,
    humidity: 50,
    chairsOccupied: 3
  },
  {
    sensorId: "seminar-rear-01",
    zone: "REAR",
    totalChairs: 10,
    temperature: 22.9,
    humidity: 51,
    chairsOccupied: 2
  }
];

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function randomBetween(minimum, maximum) {
  return Math.random() * (maximum - minimum) + minimum;
}

function createReading(sensor) {
  return {
    sensorId: sensor.sensorId,
    zone: sensor.zone,
    timestamp: new Date().toISOString(),
    temperature: Number(sensor.temperature.toFixed(1)),
    humidity: Math.round(sensor.humidity),
    chairsOccupied: sensor.chairsOccupied,
    totalChairs: sensor.totalChairs
  };
}

function updateSimulation() {
  for (const sensor of sensors) {
    const occupancyChange = Math.round(
      randomBetween(-2, 2)
    );

    sensor.chairsOccupied = clamp(
      sensor.chairsOccupied + occupancyChange,
      0,
      sensor.totalChairs
    );

    const occupancyRatio =
      sensor.chairsOccupied /
      sensor.totalChairs;

    const occupancyHeat =
      occupancyRatio * 0.16;

    sensor.temperature = clamp(
      sensor.temperature +
        randomBetween(-0.15, 0.15) +
        occupancyHeat,
      17,
      32
    );

    sensor.humidity = clamp(
      sensor.humidity +
        randomBetween(-2, 2),
      30,
      80
    );
  }

  return sensors.map(createReading);
}

function distributeOccupancy(totalOccupied) {
  const total = clamp(
    Math.round(totalOccupied),
    0,
    30
  );

  const baseOccupancy =
    Math.floor(total / sensors.length);

  let remaining =
    total -
    baseOccupancy * sensors.length;

  for (const sensor of sensors) {
    let occupancy = baseOccupancy;

    if (remaining > 0) {
      occupancy += 1;
      remaining -= 1;
    }

    sensor.chairsOccupied = clamp(
      occupancy,
      0,
      sensor.totalChairs
    );
  }
}

function setScenario({
  temperature,
  humidity,
  chairsOccupied
}) {
  for (const sensor of sensors) {
    if (typeof temperature === "number") {
      sensor.temperature = clamp(
        temperature +
          randomBetween(-0.3, 0.3),
        17,
        32
      );
    }

    if (typeof humidity === "number") {
      sensor.humidity = clamp(
        humidity +
          randomBetween(-2, 2),
        30,
        80
      );
    }
  }

  if (typeof chairsOccupied === "number") {
    distributeOccupancy(
      chairsOccupied
    );
  }

  return sensors.map(createReading);
}

function getCurrentState() {
  return sensors.map(createReading);
}

module.exports = {
  updateSimulation,
  setScenario,
  getCurrentState
};