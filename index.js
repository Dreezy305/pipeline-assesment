const express = require("express");
const app = express();
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const redis = require("redis");
const redisClient = redis.createClient();
const port = process.env.PORT || 5000;

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const WINDOW_SIZE_IN_HOURS = 24;
const MAX_WINDOW_REQUEST_COUNT = 100;
const WINDOW_LOG_INTERVAL_IN_HOURS = 1;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const Limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many calls",
  standardHeaders: true,
  legacyHeaders: false,
});

const customRedisRateLimiter = async (req, res, next) => {
  await redisClient.connect();
  try {
    // check that redis client exists
    if (!redisClient) {
      throw new Error("Redis client does not exist!");
    }
    // fetch records of current user using IP address, returns null when no record is found
    const record = await redisClient.get(req.ip);
    const currentRequestTime = moment();
    console.log(record);
    //  if no record is found , create a new record for user and store to redis
    if (record == null) {
      let newRecord = [];
      let requestLog = {
        requestTimeStamp: currentRequestTime.unix(),
        requestCount: 1,
      };
      newRecord.push(requestLog);
      await redisClient.set(req.ip, JSON.stringify(newRecord));
      next();
    }
    // if record is found, parse it's value and calculate number of requests users has made within the last window
    let data = JSON.parse(record);
    let windowStartTimestamp = moment()
      .subtract(WINDOW_SIZE_IN_HOURS, "hours")
      .unix();
    let requestsWithinWindow = data.filter((entry) => {
      return entry.requestTimeStamp > windowStartTimestamp;
    });
    console.log("requestsWithinWindow", requestsWithinWindow);
    let totalWindowRequestsCount = requestsWithinWindow.reduce(
      (accumulator, entry) => {
        return accumulator + entry.requestCount;
      },
      0
    );
    // if number of requests made is greater than or equal to the desired maximum, return error
    if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
      res
        .status(429)
        .jsend.error(
          `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_HOURS} hrs limit!`
        );
    } else {
      // if number of requests made is less than allowed maximum, log new entry
      let lastRequestLog = data[data.length - 1];
      let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
        .subtract(WINDOW_LOG_INTERVAL_IN_HOURS, "hours")
        .unix();
      //  if interval has not passed since last request log, increment counter
      if (
        lastRequestLog.requestTimeStamp >
        potentialCurrentWindowIntervalStartTimeStamp
      ) {
        lastRequestLog.requestCount++;
        data[data.length - 1] = lastRequestLog;
      } else {
        //  if interval has passed, log new entry for current user and timestamp
        data.push({
          requestTimeStamp: currentRequestTime.unix(),
          requestCount: 1,
        });
      }
      await redisClient.set(req.ip, JSON.stringify(data));
      next();
    }
  } catch (error) {
    next(error);
  }
};

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

app.use(Limiter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
