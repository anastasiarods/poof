import React, { useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import analytics from "./analytics";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

console.log("App loaded");

function App() {
  const [cid, setCid] = React.useState("");
  const [step, setStep] = React.useState(0);
  const { address } = useAccount();

  useEffect(() => {
    address && analytics.setUser(address);
  }, [address]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>We'are Gonna Make It</h1>
      </header>
      <div>
        {step === 0 && (
          <button
            onClick={() => {
              setStep((prev) => prev + 1);
              analytics.track("free_money_press", {});
            }}
          >
            Get Free Money
          </button>
        )}
        {step === 1 && (
          <button
            onClick={() => {
              setStep((prev) => prev + 1);

              analytics.track("mint_nft_press", {});
            }}
          >
            Mint NFT
          </button>
        )}
        {step === 2 && (
          <button
            onClick={() => {
              setStep((prev) => prev + 1);

              analytics.track("get_rich_press", {});
            }}
          >
            Get Rich
          </button>
        )}
      </div>
      <ConnectButton />

      <button
        onClick={() => {
          analytics.sync().then((c) => {
            setCid(c);
          });
        }}
      >
        Share Love (Usage Data)
      </button>
      <div>Current CID: {cid}</div>
    </div>
  );
}

export default App;
