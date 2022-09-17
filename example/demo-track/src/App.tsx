import React, { useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import analytics from "./analytics";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

console.log("App loaded");

analytics.track("screenView", { routeName: "wagmi_home" });

function App() {
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
              analytics.track("button_press", { action: "Free Money" });
            }}
          >
            Get Free Money
          </button>
        )}
        {step === 1 && (
          <button
            onClick={() => {
              setStep((prev) => prev + 1);

              analytics.track("button_press", { action: "Mint NFT" });
            }}
          >
            Mint NFT
          </button>
        )}
        {step === 2 && (
          <button
            onClick={() => {
              setStep((prev) => prev + 1);

              analytics.track("button_press", { action: "Get RICH" });
            }}
          >
            Get Rich
          </button>
        )}
      </div>
      <ConnectButton />

      <button
        onClick={() => {
          analytics.sync();
        }}
      >
        Share Love (Usage Data)
      </button>
    </div>
  );
}

export default App;
