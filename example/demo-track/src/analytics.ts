import { nanoid } from "nanoid";
import { CID, create } from "ipfs-http-client";
const PROJECT_ID = '2EtVI8QW4DHHHd90PklGDcaQFh7'
const PROJECT_SECRET = '1a98d06970bb1224fdeffece180644a6'

function autotrack(cb: (a: string, b: Record<string, unknown>) => void) {
  // Track Press
  document.addEventListener('click', function (event) {
    if (event.target) {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON') {
        cb(target.innerText, {
          type: 'button',
        })
      } else if (target.tagName === 'A') {
        cb(target.innerText, {
          type: 'link',
        })
      }
    }

  }, false);
}

export class Analytics {
  storage = localStorage;
  __key = "events";
  __syncs = "syncs";
  __session = nanoid();

  ipfsClient;

  constructor() {
    this.ipfsClient = create({
      host: "ipfs.infura.io",
      port: 5001,
      headers: {
        Authorization: `Basic ${btoa(PROJECT_ID + ":" + PROJECT_SECRET)}`,
      },
      protocol: "https",
    });;
  }

  static init() {
    instance = new Analytics();
    instance.attachWidget()
    instance.enableAutotrack()
  }

  attachWidget() {
    const btn = document.createElement("button");
    btn.style.background = "rgb(14, 118, 253)";
    btn.style.color = "rgb(255, 255, 255)";
    btn.style.boxShadow = "rgba(0, 0, 0, 0.1) 0px 4px 12px 0px"
    btn.style.position = "absolute";
    btn.style.bottom = "24px";
    btn.style.right = "24px";
    btn.style.paddingLeft = "16px";
    btn.style.paddingRight = "16px";
    btn.style.paddingTop = "12px";
    btn.style.paddingBottom = "12px";
    btn.style.borderRadius = "16px";
    btn.style.cursor = "pointer";
    btn.style.border = "none";
    btn.style.fontFamily = 'var(--rk-fonts-body)'
    btn.style.fontSize = '16px'
    btn.style.fontWeight = '700'
    btn.innerHTML = "Share Love (Analytics)";
    btn.onclick = async () => {
      btn.innerHTML = "Syncing...";
      await this.sync();
      btn.innerHTML = "Synced!";
      setTimeout(() => {
        btn.innerHTML = "Share Love (Analytics)";
      }, 1500);
    };

    document.getElementsByTagName("body")[0].appendChild(btn);
  }

  enableAutotrack() {
    autotrack((eventName, context) => {
      this.track(eventName, context);
    })
  }

  setUser(userId: string) {
    console.log(`Set user ${userId}`);
    this.storage.setItem(`userId`, userId);
  }

  logScreenView(routeName: string) {
    console.log(`Set current route ${routeName}`);
    this.track("screenView", { routeName });
  }

  track(eventName: string, context: Record<string, unknown>) {
    console.log(
      `Track event ${eventName} with params ${JSON.stringify(context)}`
    );
    const state = this.getState();
    this.setState([
      ...state,
      {
        name: eventName,
        session: this.__session,
        date: Date.now(),
        ...context,
      },
    ]);
  }

  getState() {
    const state = this.storage.getItem(this.__key);
    if (state) {
      return JSON.parse(state);
    }
    return [];
  }

  setState(state: unknown) {
    this.storage.setItem(this.__key, JSON.stringify(state));
  }

  clearState() {
    this.storage.getItem(JSON.stringify([]));
  }

  async sync(): Promise<string> {
    const state = this.getState();
    const uid = this.storage.getItem("userId");
    const batch = JSON.stringify({
      uid,
      events: state,
    });
    const { cid } = await this.ipfsClient.add(batch);

    const previusSync = this.storage.getItem(this.__syncs)
    const syncs = previusSync ? JSON.parse(previusSync) : []
    this.storage.setItem(this.__syncs, JSON.stringify([...syncs, cid.toString()]));

    return cid.toString();
  }
}

let instance = new Analytics()

export default instance