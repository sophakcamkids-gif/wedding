const fs = require("fs");
const lines = fs.readFileSync("src/App.tsx", "utf-8").split("\n");

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('2. ADMIN VIEW (Wedding Coordinator)')) {
    startIdx = i - 1; // start at the first ============ line
  }
  if (lines[i].includes('3. DASHBOARD VIEW (Wedding Owner/Bride & Groom)')) {
    endIdx = i - 1;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const newLines = [...lines.slice(0, startIdx), ...lines.slice(endIdx)];
  fs.writeFileSync("src/App.tsx", newLines.join("\n"));
  console.log("Deleted old ADMIN view successfully");
} else {
  console.log("Could not find boundaries", startIdx, endIdx);
}
