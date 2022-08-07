const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/howOld/:dob", (req, res) => {
  const birthday = req.params.dob;
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  // validate date
  if (birthday.match(regex) === null) {
    return res.status(400).json({
      success: false,
      message: "There was an error, pls enter the correct format(YYYY-MM-DD)",
    });
  }

  const getAge = Math.floor(
    (new Date() - new Date(birthday).getTime()) / 3.15576e10
  );

  if (getAge) {
    return res.status(200).json({
      success: true,
      age: getAge,
      message: "Age calculated successfully",
    });
  }

  if (!getAge) {
    res.status(400).json({
      success: false,
      message: "There was an error, pls enter the correct format(YYYY-MM-DD)",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
