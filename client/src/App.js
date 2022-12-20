import React, { useEffect, useRef, useState } from "react";
import "./App.scss";

const getTagArray = function (str) {
  const doc = new DOMParser().parseFromString(str, "text/html");
  const arr = [...doc.body.childNodes].map((child) => {
    const headlineItem = {
      content: child.textContent,
      type: child.nodeName,
    };
    return headlineItem;
  });
  return arr;
};

function querySelectorIncludesText(selector, text) {
  return Array.from(document.querySelectorAll(selector)).find((el) =>
    el.textContent.includes(text)
  );
}

function handleLinkClick(e) {
  const content = e.target.dataset.content;
  const selector = e.target.dataset.selector.toLowerCase();

  const $match = querySelectorIncludesText(selector, content);
  console.log($match);
  $match.scrollIntoView({ behavior: "smooth" });
}

function App() {
  const [data, setData] = React.useState(null);
  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = React.useState(null);
  const [headlineArray, setHeadlineArray] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  useEffect(() => {
    if (results?.articleHeadlines) {
      const headlineArray = getTagArray(results.articleHeadlines);
      console.log(headlineArray);
      setHeadlineArray(headlineArray);
    }
  }, [results]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    fetch(`https://7e2c-50-230-40-63.ngrok.io/parseURL?url=${inputVal}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data, "01");
        setIsLoading(false);
        if (data.error) {
          setData(data.error);
          console.log(data.details);
        } else {
          // console.log(data);
          setData("Displaying Results");
          setResults(data);
        }
      });
  };

  return (
    <div className="App">
      <h1>Pocket Summary and Outline Creator</h1>
      <header className="App-header">
        <p>{!data ? "Loading..." : data}</p>
      </header>
      <main>
        <div className="App-form">
          <form onSubmit={handleSubmit}>
            <label htmlFor="inputVal">Enter URL to parse</label>
            <br />
            <input
              type="text"
              className="input"
              id="inputVal"
              placeholder="Enter URL to parse"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="analyze-submit analyze-el">
              Parse
            </button>
          </form>
        </div>
        {results ? (
          <div className="App-results">
            <div className="results-container">
              <div className="results-sidebar">
                <div className="outline-container">
                  <h3>Skip to</h3>
                  <ul>
                    {headlineArray &&
                      headlineArray.map((item, i) => {
                        return (
                          <li key={`outline-${i}`}>
                            <a
                              className="link-outline"
                              onClick={handleLinkClick}
                              data-content={item.content}
                              data-selector={item.type}
                            >
                              {item.content}
                            </a>{" "}
                            ({item.type})
                          </li>
                        );
                      })}
                  </ul>
                </div>
                {results.articleSummaries &&
                  results.articleSummaries.length > 0 && (
                    <div className="summary-container">
                      <h3>Summary</h3>
                      <ul>
                        {results.articleSummaries.map((val, i) => {
                          return <li key={`outline-${i}`}>{val}</li>;
                        })}
                      </ul>
                    </div>
                  )}
              </div>
              <div className="results-main">
                <h2>{results.title}</h2>
                <div
                  className="results-article"
                  dangerouslySetInnerHTML={{ __html: results.article }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>{isLoading && "Loading"}</div>
        )}
      </main>
    </div>
  );
}

export default App;
