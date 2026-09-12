const net = require("net");
const port = 6000;

const areaData = {};

function getArea(area) {
    if (!areaData[area]) {
        areaData[area] = { temp: null, wind: null, rain: null, fire: "NO RATING" };
    }
    return areaData[area];
}

const server = net.createServer((socket) => {
    console.log("Client connected");

    // Buffer incoming bytes per-connection and only process complete,
    // newline-delimited messages. This prevents rapid back-to-back writes
    // from being merged together in a single "data" event and corrupting
    // the comma-split parsing under load.
    let buffer = "";

    socket.on("data", (chunk) => {
        buffer += chunk.toString();
        let newlineIndex;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const strData = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (strData.length === 0) continue;

            console.log(`Received: ${strData}`);

            const command = strData.split(",");
            const name = command[0];
            const area = command[1];
            const value = command[2];
            let result;

            const a = getArea(area);

            switch (name) {
                case "temp":
                    a.temp = parseFloat(value);
                    result = "ok";
                    break;
                case "rain":
                    a.rain = parseFloat(value);
                    result = "ok";
                    break;
                case "wind":
                    a.wind = parseFloat(value);
                    result = "ok";
                    break;
                case "fire":
                    a.fire = value;
                    result = "ok";
                    break;
                case "request":
                    let weatherResult;
                    if (a.temp > 20 && a.rain < 50 && a.wind > 30) {
                        weatherResult = "Weather Warning";
                    } else {
                        weatherResult = "Everything fine";
                    }
                    result = `${area}: ${weatherResult}. Fire Warning Level: ${a.fire}`;
                    break;
                default:
                    result = "Unknown command";
            }

            socket.write(String(result) + "\n");
        }
    });

    socket.on("end", () => {
        console.log("Client disconnected");
    });

    socket.on("error", (error) => {
        console.log(`Socket Error: ${error.message}`);
    });
});

server.on("error", (error) => {
    console.log(`Server Error: ${error.message}`);
});

server.listen(port, () => {
    console.log(`TCP socket server is running on port: ${port}`);
});