require("dotenv").config();
const express = require("express");
const app = express();

app.use(require("cors")());
app.use(express.json());

// Routes
app.use("/api/skus", require("./routes/skus"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));

app.get("/", (req, res) => res.json({ message: "Inventory API" }));

app.listen(3001, () => console.log("Server: http://localhost:3001"));
