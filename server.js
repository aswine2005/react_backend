const http = require("http");
const modules = require("./modules");

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    modules.file((err, usersData) => {
        if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Error reading file" }));
            return;
        }
        res.write(usersData);
        res.end();
    });
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});