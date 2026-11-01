const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const serverPort = 5000;
const children = [];
let shuttingDown = false;

function stopChildren(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
}

function startChild(args, env = process.env) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  children.push(child);
  child.on("error", (error) => {
    console.error("Could not start development service:", error.message);
    stopChildren(1);
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`Development service exited (${signal || code}).`);
      stopChildren(signal ? 1 : code);
    }
  });
  return child;
}

function findAvailablePort(preferredPort, attempts = 50) {
  return new Promise((resolve, reject) => {
    const probe = (port, remaining) => {
      if (remaining === 0) {
        reject(new Error(`No available web port found starting at ${preferredPort}.`));
        return;
      }

      const server = net.createServer();
      server.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
          probe(port + 1, remaining - 1);
        } else {
          reject(error);
        }
      });
      server.listen(port, "0.0.0.0", () => {
        server.close((error) => {
          if (error) reject(error);
          else resolve(port);
        });
      });
    };

    probe(preferredPort, attempts);
  });
}

function waitForPort(port, child, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    let timer;

    const cleanup = () => {
      clearTimeout(timer);
      child.removeListener("exit", onExit);
    };
    const onExit = (code, signal) => {
      cleanup();
      reject(new Error(`Chat server exited before becoming ready (${signal || code}).`));
    };
    const check = () => {
      if (shuttingDown) {
        cleanup();
        reject(new Error("Development startup was cancelled."));
        return;
      }
      const socket = net.createConnection({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        cleanup();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() >= deadline) {
          cleanup();
          reject(new Error(`Chat server did not start on port ${port} within ${timeoutMs}ms.`));
          return;
        }
        timer = setTimeout(check, 150);
      });
    };

    child.once("exit", onExit);
    check();
  });
}

process.on("SIGINT", () => stopChildren(0));
process.on("SIGTERM", () => stopChildren(0));

async function main() {
  const server = startChild(
    [path.join(root, "server", "index.js")],
    { ...process.env, PORT: "5000" }
  );
  try {
    await waitForPort(serverPort, server);
  } catch (error) {
    console.error(error.message);
    stopChildren(1);
    return;
  }

  if (shuttingDown) return;
  const requestedWebPort = Number(
    process.env.WEB_PORT ||
      (process.env.PORT && process.env.PORT !== String(serverPort)
        ? process.env.PORT
        : 3000)
  );
  if (!Number.isInteger(requestedWebPort) || requestedWebPort < 1 || requestedWebPort > 65535) {
    console.error("WEB_PORT must be a valid TCP port.");
    stopChildren(1);
    return;
  }

  let webPort;
  try {
    webPort = await findAvailablePort(requestedWebPort);
  } catch (error) {
    console.error(error.message);
    stopChildren(1);
    return;
  }

  console.log(`Chat server is ready; starting the React app on port ${webPort}.`);
  const webEnvironment = { ...process.env };
  webEnvironment.PORT = String(webPort);
  startChild(
    [path.join(root, "node_modules", "react-scripts", "scripts", "start.js")],
    webEnvironment
  );
}

main().catch((error) => {
  console.error("Could not start development services:", error.message);
  stopChildren(1);
});
