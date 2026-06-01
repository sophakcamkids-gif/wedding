const fs = require("fs");
const lines = fs.readFileSync("src/App.tsx", "utf-8").split("\n");
let depth = 0;
for (let i = 2440; i < 3895; i++) {
  const line = lines[i] || '';
  console.log(`${i+1}: ${line}`);
}
