import React, { useRef, useState } from "react";
import "./App.scss";

function App() {
  const [data, setData] = React.useState(null);
  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = React.useState(null);

  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`/parseURL?url=${inputVal}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setData(data.error);
          console.log(data.details);
        } else {
          console.log(data);
          setData("Displaying Results");
          setResults(data);
        }
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>{!data ? "Loading..." : data}</p>
      </header>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="inputVal"
          placeholder="Enter URL to parse"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
        />
        <button type="submit" className="analyze-submit analyze-el">
          Parse
        </button>
      </form>
      {results && (
        <div className="results">
          <ul>
            {Object.entries(results).map(([k, v]) => {
              if (k === "topImageUrl" || k === "logo") {
                return (
                  <li>
                    <span className="parsedKey">{k}</span>: <br />
                    <img className="parsedImage" src={v} />
                  </li>
                );
              } else {
                return (
                  <li key={`data-${k}`}>
                    <span className="parsedKey">{k}</span>: {v}
                  </li>
                );
              }
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
