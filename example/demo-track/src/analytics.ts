import { nanoid } from "nanoid";
import { create } from "ipfs-http-client";

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
      protocol: "https",
    });;
  }
  static init() {
    instance = new Analytics();
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

  async sync() {
    const state = this.getState();
    const uid = this.storage.getItem("userId");
    const batch = JSON.stringify({
      uid,
      events: state,
    });
    const { cid } = await this.ipfsClient.add(batch);

    const previusSync = this.storage.getItem(this.__syncs)
    const syncs = previusSync ? JSON.parse(previusSync) : []
    this.storage.setItem(this.__syncs, JSON.stringify([...syncs, cid]));

    console.log(cid);
  }
}

let instance = new Analytics()

export default instance