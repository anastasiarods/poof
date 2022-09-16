import { create } from 'ipfs-http-client'
import { nanoid } from 'nanoid'

export class Analytics {
  private storage = localStorage;
  private __key = "events";
  private __session = nanoid();

  private ipfsClient;

  constructor() {
    this.ipfsClient = create({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https",
    });
  }

  setUser(userId: string): void {
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

  getState(): any[] {
    const state = this.storage.getItem(this.__key)
    if (state) {
      return JSON.parse(state);
    }
    return []
  }

  setState(state) {
    this.storage.setItem(this.__key, JSON.stringify(state));
  }

  clearState() {
    this.storage.getItem(JSON.stringify([]))
  }

  async sync() {
    const state = this.getState();
    const uid = this.storage.getItem("userId");
    const batch = JSON.stringify({
      uid,
      events: state,
    });
    const { cid } = await this.ipfsClient.add(batch);
    console.log(cid);
  }
}
