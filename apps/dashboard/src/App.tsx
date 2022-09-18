import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';
import Funnel from "./charts/funnel";
import Path from "./charts/path";
import { useQuery } from "@tanstack/react-query"

const ds = "https://cloudflare-ipfs.com/ipfs/QmVygzNgHQnNwj5WZkrWdY2fqSaYgYXVfUZvBQMpquDYap"

const API_KEY = ''

function App() {
  const { data } = useQuery(["chart"], async () => {
    const data = await fetch(ds)
    const resp = await data.json()
    return resp
  })

  const { data: duneData } = useQuery(["dune"], async () => {
    const meta = {
      "x-dune-api-key": API_KEY
    };
    const header = new Headers(meta);
    const response = await fetch('https://api.dune.com/api/v1/query/1278771/execute', {
      method: 'POST',
      headers: header
    });

    const body = await response.json();
    const execID = body.execution_id

    var status = false;

    while (!status) {
      const st = await fetch(`https://api.dune.com/api/v1/execution/${execID}/status`, {
        method: 'GET',
        headers: header
      });

      const stJS = await st.json()
      if (stJS.state === "QUERY_STATE_COMPLETED") {
        status = true
      } else {
        status = false
      }

    }

    const res = await fetch(`https://api.dune.com/api/v1/execution/${execID}/results`, {
      method: 'GET',
      headers: header
    });

    const jsonRes = await res.json()
    return jsonRes
  })
const [tab, setTab] = useState<'funnel'|'path'>('funnel')
  return (
    <div className="App">
      <h1>User Analytics</h1>
      <div>
        <button onClick={() => setTab('funnel')}>Funnel</button>
        <button onClick={() => setTab('path')}>Path</button>
      </div>
      {tab === 'funnel' && <Funnel data={data} />}
      {tab === 'path' && <Path dune={duneData} data={data} />}
    </div>
  );
}

export default App;
