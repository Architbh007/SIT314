const net = require("net");
const port = 6000;

// Store the latest readings for each CFA area separately
const areaData = {};

function getArea(area) {
    if (!areaData[area]) {
        areaData[area] = { temp: null, wind: null, rain: null, fire: "NO RATING" };
    }
    return areaData[area];
}

const server = net.createServer((socket) => {
    console.log("Client connected");

    socket.on("data", (data) => {
        const strData = data.toString();
        console.log(`Received: ${strData}`);

        const command = strData.split(",");
        const type = command[0];
        const area = command[1];
        const rawValue = command[2];
        let result;

        const a = getArea(area);

        switch (type) {
            case "temp":
                a.temp = parseFloat(rawValue);
                result = "ok";
                break;
            case "rain":
                a.rain = parseFloat(rawValue);
                result = "ok";
                break;
            case "wind":
                a.wind = parseFloat(rawValue);
                result = "ok";
                break;
            case "fire":
                a.fire = rawValue;
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

        console.log(`Result: ${result}`);
        socket.write(result.toString());
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