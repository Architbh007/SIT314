const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const area = process.argv[2] || "Central";

const levels = ["NO RATING", "MODERATE", "HIGH", "EXTREME", "CATASTROPHIC"];

const client = net.createConnection(port, host, () => {
    console.log("Connected");
    setInterval(() => {
        const level = levels[Math.floor(Math.random() * levels.length)];
        client.write(`fire,${area},${level}`);
    }, 2000); 
});

client.on("data", (data) => {
    console.log(`Received: ${data}`);
});

client.on("error", (error) => {
    console.log(`Error: ${error.message}`);
});

client.on("close", () => {
    console.log("Connection closed");
});