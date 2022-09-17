import { nanoid } from "nanoid";
const PROJECT_ID = ''
const PROJECT_SECRET = ''

export interface Resolver<R = void, E = unknown> {
  promise: Promise<R>
  resolve: (res: R) => void
  reject: (err: E) => void
}

export function resolver<R = void, E = unknown>(): Resolver<R, E> {
  let resolve!: (res: R) => void
  let reject!: (err: E) => void
  const promise = new Promise<R>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export class Lock {
  private _lockP: Promise<void> | null = null

  async lock(): Promise<() => void> {
    const previous = this._lockP
    const { promise, resolve } = resolver()
    this._lockP = promise
    await previous
    return resolve
  }

  withLock<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.lock(), f)
  }
}

export class RWLock {
  private _lock = new Lock()
  private _writeP: Promise<void> | null = null
  private _readP: Promise<void>[] = []

  read(): Promise<() => void> {
    return this._lock.withLock(async () => {
      await this._writeP
      const { promise, resolve } = resolver()
      this._readP.push(promise)
      return resolve
    })
  }

  withRead<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.read(), f)
  }

  write(): Promise<() => void> {
    return this._lock.withLock(async () => {
      await this._writeP
      await Promise.all(this._readP)
      const { promise, resolve } = resolver()
      this._writeP = promise
      this._readP = []
      return resolve
    })
  }

  withWrite<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.write(), f)
  }
}

async function run<R>(p: Promise<() => void>, f: () => R | Promise<R>): Promise<R> {
  const release = await p
  try {
    return await f()
  } finally {
    release()
  }
}

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
      } else if (target.innerText && target.innerText.length > 0) {
        cb(target.innerText, {
          type: 'element',
        })
      }
    }

  }, false);
}

export class Analytics {
  storage = localStorage
  __key = '--poof-events'
  __syncs = '--poof-syncs'
  __usersID = '--poof-uid'
  __session = nanoid()
  __syncLock = new RWLock()
  events: unknown[] = []
  ipfsClient;

  constructor() {
    this.ipfsClient = {
      add: async (json: string) => {
        const blob = new Blob([json], { type: 'text/json' })

        const data = new FormData()
        data.append('file', blob)

        const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${PROJECT_ID}:${PROJECT_SECRET}`)}`,
          },
          body: data,
        })
        const cid = await response.json()
        return cid.Hash
      }
    }
    this.restore()
    this.attachWidget()
  }

  persist() {
    const json = JSON.stringify(this.events)
    this.storage.setItem(this.__key, json)
  }

  restore() {
    this.__syncLock.withWrite(() => {
      const events = this.storage.getItem(this.__key)
      if (events) {
        this.events = JSON.parse(events)
      }
    })
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
      const cid = await this.sync();
      window.open(`https://cloudflare-ipfs.com/ipfs/${cid}`, '_blank');
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

  async track(eventName: string, context?: Record<string, unknown>) {
    await this.__syncLock.withWrite(() => {
      console.log(`Track event ${eventName} with params ${JSON.stringify(context)}`)

      this.events = [
        ...this.events,
        {
          name: eventName,
          session: this.__session,
          date: Date.now(),
          ...context,
        },
      ]
      this.persist()
    })
  }

  async sync(): Promise<string> {
    const batch = await this.__syncLock.withWrite(async () => {
      const uid = this.storage.getItem(this.__usersID)
      const json = JSON.stringify({
        uid,
        events: this.events,
      })
      this.events = []
      return json
    })

    const cid = await this.ipfsClient.add(batch)
    const previusSync = this.storage.getItem(this.__syncs)
    const syncs = previusSync ? JSON.parse(previusSync) : []
    this.storage.setItem(this.__syncs, JSON.stringify([...syncs, cid.toString()]))
    return cid.toString()
  }
}

let instance = new Analytics();
export default instance