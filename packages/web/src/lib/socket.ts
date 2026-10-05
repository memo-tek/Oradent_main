import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("oradent_token")
        : null;

    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    // Update auth token before connecting
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("oradent_token")
        : null;
    s.auth = { token };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Socket event types for type safety
export interface ServerToClientEvents {
  "appointment:created": (data: { appointmentId: string }) => void;
  "appointment:updated": (data: { appointmentId: string; status: string }) => void;
  "appointment:cancelled": (data: { appointmentId: string }) => void;
  "patient:checkedIn": (data: { patientId: string; appointmentId: string }) => void;
  "notification": (data: { title: string; message: string; type: string }) => void;
  "schedule:refresh": () => void;
}

export interface ClientToServerEvents {
  "join:practice": (practiceId: string) => void;
  "leave:practice": (practiceId: string) => void;
  "join:schedule": (date: string) => void;
  "leave:schedule": (date: string) => void;
}
