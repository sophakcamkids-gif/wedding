const fs = require("fs");
const content = fs.readFileSync("src/App.tsx", "utf-8");
const lines = content.split("\n");

let adminStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('2. ADMIN VIEW')) {
    adminStart = i - 1;
    break;
  }
}

let dashboardStart = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('3. DASHBOARD VIEW')) {
    dashboardStart = i - 1;
    break;
  }
}

if (adminStart !== -1 && dashboardStart !== -1 && dashboardStart > adminStart) {
  const newLines = [...lines.slice(0, adminStart), ...lines.slice(dashboardStart)];
  fs.writeFileSync("src/App.tsx", newLines.join("\n"));
  console.log("Successfully cleaned up orphaned code!");
} else {
  console.log("Could not find the bounds.", adminStart, dashboardStart);
}
