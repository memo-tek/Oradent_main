import { useEffect, useCallback, useRef } from "react";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import { useAppStore } from "@/stores/appStore";
import type { Socket } from "socket.io-client";

/**
 * Hook to manage the Socket.IO connection lifecycle.
 * Connects when the user is authenticated and disconnects on logout.
 */
export function useSocket() {
  const { isAuthenticated, practice } = useAppStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
      socketRef.current = getSocket();

      // Join the practice room
      if (practice?.id) {
        socketRef.current.emit("join:practice", practice.id);
      }

      return () => {
        if (practice?.id && socketRef.current) {
          socketRef.current.emit("leave:practice", practice.id);
        }
        disconnectSocket();
        socketRef.current = null;
      };
    }
  }, [isAuthenticated, practice?.id]);

  const on = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: string, handler: (...args: any[]) => void) => {
      const socket = socketRef.current || getSocket();
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    },
    []
  );

  const emit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: string, ...args: any[]) => {
      const socket = socketRef.current || getSocket();
      socket.emit(event, ...args);
    },
    []
  );

  return { on, emit, socket: socketRef.current };
}

/**
 * Hook to subscribe to a specific socket event.
 * Automatically cleans up the listener on unmount.
 *
 * @example
 * useSocketEvent("appointment:updated", (data) => {
 *   refetch();
 * });
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const wrappedHandler = (data: T) => {
      handlerRef.current(data);
    };

    socket.on(event, wrappedHandler);

    return () => {
      socket.off(event, wrappedHandler);
    };
  }, [event]);
}
