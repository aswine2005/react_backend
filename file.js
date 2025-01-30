// const fs = require('fs');

// const file = () => {
//     const data = fs.readFileSync("./sample.json", "utf8");
//     const users = JSON.parse(data);
//     return JSON.stringify(users);
// };

const fs = require("fs"); 
const http = require("http"); 

fs.readFile("./sample.json", "utf8", (err, data) => { 
    if (err) { 
        console.log("Cannot Open File"); 
        return; 
    }
    const jsonData = JSON.parse(data); 
    const filteredData = jsonData.filter((user) => user.amount > 1500); 
    fs.writeFile("./data.json", JSON.stringify(filteredData), (err) => {
        if (err) { 
            console.log("Error Writing File"); 
            return; 
        }
    });
});

const create = (student) => { 
    let students = []; 
    fs.readFile('./student.json', 'utf8', (error, data) => { 
        let ac = data ? JSON.parse(data) : []; 
        if (ac.length > 0) { 
            students = [...ac, student]; 
        } else { 
            students = [student]; 
        }
        fs.writeFile("./student.json", JSON.stringify(students), (err) => { 
            if (err) { 
                console.log("ERROR Occurred");
            } else {
                console.log("Data is Created");
            }
        });
    });
};

module.exports = { create };