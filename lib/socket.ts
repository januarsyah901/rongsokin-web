/**
 * Klien realtime (WebSocket native) untuk backend Go — pengganti socket.io-client.
 *
 * Protokol: frame teks JSON { event, data }. Pesan pertama WAJIB
 * { event: 'auth', data: { token } }; server membalas 'ready' (berhasil) atau
 * 'error' lalu menutup koneksi dengan kode 4401 (token ditolak → tidak reconnect).
 * Nama event & payload (new_order, order_taken, order_status_update,
 * location_update, join_room) sama dengan versi Socket.IO.
 *
 * API-nya sengaja meniru subset Socket.IO yang dipakai FE (on/off/emit/
 * connected/'connect'), jadi hook pemakai tidak perlu berubah.
 */

type Handler<T = unknown> = (data: T) => void;

/** URL endpoint WS: NEXT_PUBLIC_WS_URL, atau diturunkan dari NEXT_PUBLIC_API_URL (+ /ws). */
const resolveWsUrl = (): string => {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return api.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws';
};

const CLOSE_UNAUTHORIZED = 4401;
const MAX_BACKOFF_MS = 10_000;

export class RealtimeSocket {
  connected = false;
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(
    private readonly url: string,
    private readonly token: string
  ) {
    this.open();
    if (typeof window !== 'undefined') window.addEventListener('online', this.reconnectNow);
  }

  private open() {
    if (this.stopped || typeof window === 'undefined') return;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ event: 'auth', data: { token: this.token } }));
    };
    ws.onmessage = (ev) => {
      let msg: { event?: string; data?: unknown };
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
      } catch {
        return;
      }
      if (!msg.event) return;
      if (msg.event === 'ready') {
        this.connected = true;
        this.retry = 0;
        this.dispatch('connect', undefined);
        return;
      }
      if (msg.event === 'error') {
        this.dispatch('connect_error', msg.data);
        return;
      }
      this.dispatch(msg.event, msg.data);
    };
    ws.onclose = (ev) => {
      if (this.ws !== ws) return;
      const wasConnected = this.connected;
      this.connected = false;
      this.ws = null;
      if (wasConnected) this.dispatch('disconnect', ev.reason);
      if (this.stopped || ev.code === CLOSE_UNAUTHORIZED) return;
      // Backoff eksponensial + jitter (jaringan HP putus-sambung, server restart).
      const base = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.retry++);
      this.retryTimer = setTimeout(() => this.open(), base / 2 + Math.random() * (base / 2));
    };
  }

  private reconnectNow = () => {
    if (this.stopped || this.ws) return;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.retry = 0;
    this.open();
  };

  private dispatch(event: string, data: unknown) {
    this.handlers.get(event)?.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error(`[realtime] handler ${event} gagal`, err);
      }
    });
  }

  on<T = unknown>(event: string, fn: Handler<T>): this {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler);
    return this;
  }

  off<T = unknown>(event: string, fn?: Handler<T>): this {
    if (!fn) this.handlers.delete(event);
    else this.handlers.get(event)?.delete(fn as Handler);
    return this;
  }

  /** Kirim event (diabaikan bila belum terautentikasi — sama dengan perilaku lama untuk event sesaat). */
  emit(event: string, data?: unknown): this {
    if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
    return this;
  }

  removeAllListeners(): this {
    this.handlers.clear();
    return this;
  }

  disconnect(): this {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (typeof window !== 'undefined') window.removeEventListener('online', this.reconnectNow);
    const ws = this.ws;
    this.ws = null;
    this.connected = false;
    ws?.close(1000);
    return this;
  }
}

let socket: RealtimeSocket | null = null;
let socketToken: string | null = null;

/**
 * Socket singleton yang TERIKAT ke token. Kalau token berubah (logout lalu login
 * sebagai user lain), koneksi lama diputus & dibuat ulang — supaya user B tidak
 * tetap terautentikasi sebagai user A (room/notifikasi salah orang).
 */
export const getSocket = (token: string): RealtimeSocket => {
  if (socket && socketToken !== token) {
    disconnectSocket();
  }
  if (!socket) {
    socket = new RealtimeSocket(resolveWsUrl(), token);
    socketToken = token;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};

/**
 * Join room dan otomatis JOIN ULANG setiap kali socket (re)connect. Room di
 * server hilang saat koneksi putus (jaringan HP, server restart), jadi emit
 * join_room sekali saja membuat notifikasi/live tracking mati diam-diam setelah
 * reconnect. Mengembalikan fungsi cleanup.
 */
export const joinRoom = (s: RealtimeSocket, room: string): (() => void) => {
  const join = () => {
    s.emit('join_room', room);
  };
  if (s.connected) join();
  s.on('connect', join);
  return () => {
    s.off('connect', join);
  };
};
