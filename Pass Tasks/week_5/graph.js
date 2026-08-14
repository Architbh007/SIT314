const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 900;
const height = 500;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

// Replace this array with your own timing values from running iotsensor.js
const writeTimes = [42, 28, 28, 24, 30, 30, 29, 29, 32, 29, 27, 92, 33, 36, 120, 25, 25];
const labels = writeTimes.map((_, i) => (i + 1).toString());

const configuration = {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: 'Write time (ms)',
      data: writeTimes,
      backgroundColor: '#2a78d6'
    }]
  },
  options: {
    responsive: false,
    plugins: {
      title: {
        display: true,
        text: 'MongoDB Atlas Write Performance per Sensor Reading'
      },
      legend: { display: false }
    },
    scales: {
      x: { title: { display: true, text: 'Reading number' } },
      y: { title: { display: true, text: 'Write time (ms)' }, beginAtZero: true }
    }
  }
};

(async () => {
  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync('write_performance_graph.png', imageBuffer);
  console.log('Graph saved as write_performance_graph.png');
})();
