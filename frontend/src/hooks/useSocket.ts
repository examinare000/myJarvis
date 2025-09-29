import { useCallback, useEffect, useRef, useState } from "react";
import { io, type ManagerOptions, type Socket, type SocketOptions } from "socket.io-client";

type UseSocketConfig = {
  /** Fully qualified websocket endpoint, e.g. https://api.example.com */
  url: string;
  /** Event name used to collect incoming messages. Defaults to "message". */
  listenEvent?: string;
  /** Socket.io manager options forwarded to the client instance. */
  options?: Partial<ManagerOptions & SocketOptions>;
};

type UseSocketResult<TMessage> = {
  messages: TMessage[];
  sendMessage: (event: string, payload: unknown) => void;
  isConnected: boolean;
  socket: Socket | null;
};

/**
 * Simple reusable hook that wires up a Socket.io client with sane defaults.
 */
const useSocket = <TMessage = unknown>({
  url,
  listenEvent = "message",
  options,
}: UseSocketConfig): UseSocketResult<TMessage> => {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(url, options);
    socketRef.current = socket;
    setMessages([]);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleMessage = (message: TMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(listenEvent, handleMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(listenEvent, handleMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, listenEvent, options]);

  const sendMessage = useCallback((event: string, payload: unknown) => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    socket.emit(event, payload);
  }, []);

  return { messages, sendMessage, isConnected, socket: socketRef.current };
};

export default useSocket;
