import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | null = null;

/**
 * Socket singleton yang TERIKAT ke token. Kalau token berubah (logout lalu login
 * sebagai user lain), koneksi lama diputus & dibuat ulang — dulu singleton
 * menyimpan token pertama selamanya, sehingga user B tetap terautentikasi
 * sebagai user A di socket (room/notifikasi salah orang).
 */
export const getSocket = (token: string): Socket => {
  if (socket && socketToken !== token) {
    disconnectSocket();
  }
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
    });
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
export const joinRoom = (s: Socket, room: string): (() => void) => {
  const join = () => {
    s.emit('join_room', room);
  };
  if (s.connected) join();
  s.on('connect', join);
  return () => {
    s.off('connect', join);
  };
};
