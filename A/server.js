const http = require("http");
const readline = require("readline");

const Protocol = require("./src/protocol");
const port = 3031;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  if (req.method === "GET") {
    return res.end("GET");
  } else if (req.method === "POST") {
    return res.end("POST");
  } else if (req.method === "DELETE") {
    return res.end("DELETE");
  } else if (req.method === "PUT") {
    return res.end("PUT");
  } else if (req.method === "OPTIONS") {
    return res.end("OPTIONS");
  }
});

const handleCommands = () => {
  const readLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log("Select operating mode: ECB/CFB");
  readLine.on("line", async (cmd) => {
    switch (cmd) {
      case "ECB":
        global.mode = "ECB";
        console.log("Enter a command: connect/exit");
        break;

      case "CFB":
        global.mode = "CFB";
        console.log("Enter a command: connect/exit");
        break;

      case "connect" :
        await Protocol.connect();
        break;

      case "exit":
        readLine.close();
        process.exit();
    }
  });
};

server.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  Protocol.getInitialInfo();
  handleCommands();
});
