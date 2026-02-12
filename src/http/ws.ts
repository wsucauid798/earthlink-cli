export async function streamWorld(baseUrl: string, onMessage: (message: unknown) => void): Promise<void> {
  const { default: WebSocket } = await import("ws");
  return new Promise((resolve, reject) => {
    const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws/world";
    const socket = new WebSocket(wsUrl);

    socket.on("open", () => {
      process.stdout.write(`Connected: ${wsUrl}\n`);
    });

    socket.on("message", (data) => {
      const raw = data.toString();
      try {
        onMessage(JSON.parse(raw));
      } catch {
        onMessage(raw);
      }
    });

    socket.on("error", (error) => {
      reject(error);
    });

    socket.on("close", () => {
      process.stdout.write("Stream closed\n");
      resolve();
    });

    process.on("SIGINT", () => {
      socket.close();
    });
  });
}
