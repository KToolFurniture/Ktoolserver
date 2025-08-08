const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Webhook từ SePay:", req.body);

  if (req.body.status === "SUCCESS") {
    const cpuId = req.body.cpuId;
    console.log("Kích hoạt license cho CPU ID:", cpuId);

    return res.status(200).json({ result: "License activated" });
  }

  return res.status(400).json({ error: "Payment not successful" });
});

app.get("/", (req, res) => {
  res.send("Webhook server is running!");
});

app.listen(PORT, () => {
  console.log(`Server đang chạy ở cổng ${PORT}`);
});
