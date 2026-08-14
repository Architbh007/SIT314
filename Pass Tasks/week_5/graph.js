const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 600;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
s
const writeTimes = [42, 21,];
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
