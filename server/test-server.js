const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

