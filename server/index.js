const path = require("path");
const express = require("express");
let dotenv = require("dotenv").config();
const axios = require("axios");

const PORT = process.env.PORT || 3001;

const app = express();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));

// Handle GET requests to /api route
app.get("/api", (req, res) => {
  res.json({ message: "Connected to Server" });
});

app.get("/parseURL", (req, res) => {
  const data = req.query.url;
  console.log("data", data);
  const requestURL = `${process.env.API_URL}?consumer_key=${process.env.KEY}&url=${data}`;
  console.log("requestURL", requestURL);
  // return res.json({
  //   data: requestURL,
  // });

  axios
    .get(requestURL, {
      headers: {
        Accept: "application/json",
      },
    })
    .then((response) => {
      const { host, title, excerpt, topImageUrl, domainMetadata } =
        response.data;
      const apiResponseObj = {
        host: host,
        title: title,
        excerpt: excerpt,
        topImageUrl: topImageUrl,
        logo: domainMetadata.logo,
      };
      //return any relevant data here
      console.log(apiResponseObj);
      res.json(apiResponseObj);
    })
    .catch((err) => {
      console.error(err);
      res.json({
        error: `there was an error with your request`,
        details: err,
      });
    });
});

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
