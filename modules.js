const fs = require('fs');

const file = (callback) => {
    fs.readFile("./sample.json", "utf8", (err, data) => {
        if (err) {
            console.log("Cannot Open File");
            return callback(err);
        }
        const users = JSON.parse(data);
        callback(null, JSON.stringify(users));
    });
};

module.exports = { file };