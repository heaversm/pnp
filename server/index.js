const path = require("path");
const express = require("express");
let dotenv = require("dotenv").config();
const axios = require("axios");
const { convert } = require("html-to-text");

const cheerio = require("cheerio");

const NUM_PARAGRAPHS_PER_SUMMARY = 5;
const PORT = process.env.PORT || 3001;
const NLP_API_KEY = process.env.NLP_API_KEY;

let numGroupsSummarized = 0;

const app = express();

const NLPCloudClient = require("nlpcloud");
const client = new NLPCloudClient("bart-large-cnn", NLP_API_KEY);

const buildParagraphs = function (str) {
  const doc = cheerio.load(str, null, false);

  let arr = [];
  doc._root.children.forEach((child, i) => {
    let childStr = `${child.children[0].data}`.replace(/(\r\n|\n|\r)/gm, " ");
    childStr.trim();
    arr.push(childStr);
  });
  return arr;
};

const summarize = async function (text) {
  const summaryPromise = new Promise((resolve, reject) => {
    client
      .summarization(`${text}`)
      .then(async function (response) {
        //console.log("async summary response:");
        //console.log(response.data);
        resolve(response.data?.summary_text || "");
      })
      .catch(function (err) {
        console.error(err.response.status);
        console.error(err.response.data);
        resolve("error");
      });
  });
  return summaryPromise;
};

const summarizeParagraphs = async function (parsedParagraphs) {
  const paragraphSummaries = [];
  const numGroupsToSummarize = Math.floor(
    parsedParagraphs.length / NUM_PARAGRAPHS_PER_SUMMARY
  );

  const paragraphGroupings = [];

  for (let i = 0; i < numGroupsToSummarize; i++) {
    const textToSummarize = parsedParagraphs
      .slice(
        i * NUM_PARAGRAPHS_PER_SUMMARY,
        (i + 1) * NUM_PARAGRAPHS_PER_SUMMARY
      )
      .join(" ");
    paragraphGroupings.push(textToSummarize);
  }

  const summarizeAllPromise = new Promise((resolve, reject) => {
    paragraphGroupings.forEach(async (paragraphGrouping) => {
      const summary = await summarize(paragraphGrouping);
      numGroupsSummarized++;
      console.log(
        "num groups summarized",
        numGroupsSummarized,
        numGroupsToSummarize
      );
      console.log("summarized (should not come before async summary response)");
      console.log(summary);
      if (summary !== "error") {
        paragraphSummaries.push(summary);
      }

      if (numGroupsSummarized === numGroupsToSummarize) {
        console.log("finished summarizing");
        console.log(paragraphSummaries);
        resolve(paragraphSummaries);
      }
    });
  });
  return summarizeAllPromise;
};

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
  axios
    .get(requestURL, {
      headers: {
        Accept: "application/json",
      },
    })
    .then(async (response) => {
      //destructure response into items you want to use
      const { title, article } = response.data;

      const articleHeadlines = convert(article, {
        baseElements: {
          selectors: ["h1", "h2", "h3", "h4", "h5", "h6"],
        },
        selectors: [
          {
            selector: "h1",
            format: "inlineTag",
          },
          {
            selector: "h2",
            format: "inlineTag",
          },
          {
            selector: "h3",
            format: "inlineTag",
          },
          {
            selector: "h4",
            format: "inlineTag",
          },
          {
            selector: "h5",
            format: "inlineTag",
          },
          {
            selector: "h6",
            format: "inlineTag",
          },
        ],
      });

      const articleParagraphs = convert(article, {
        baseElements: {
          selectors: ["p"],
        },
        selectors: [
          {
            selector: "p",
            format: "inlineTag",
            options: {
              ignoreHref: true,
              ignoreImage: true,
              noAnchorUrl: true,
              noLinkBrackets: true,
              limits: {
                maxChildNodes: 5,
              },
            },
          },
        ],
      });

      const parsedParagraphs = buildParagraphs(articleParagraphs);
      const summarizedParagraphs = await summarizeParagraphs(parsedParagraphs);
      const apiResponseObj = {
        title: title,
        article: article,
        articleHeadlines: articleHeadlines,
        articleSummaries: summarizedParagraphs,
      };

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
