const http = require("http");
const url = require("url");
const forge = require("node-forge");
const AES = require("crypto-js/aes");

const port = 3030;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  if (req.method === "GET") {
    return handleGetReq(req, res);
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

async function handleGetReq(req, res) {
  const { pathname } = url.parse(req.url);

  if (pathname !== "/initial/info" && pathname !== "/private/key") {
    return handleError(res, 404);
  }

  try {
    switch (pathname) {
      case "/initial/info":
        res.write(
          JSON.stringify({
            publicKey: global.publicKey,
            iv: global.iv,
          })
        );
        break;

      case "/private/key":
        const encryptedPrivateKey = AES.encrypt(
          global.privateKey,
          global.publicKey
        );
        res.write(
          JSON.stringify({
            encrypted: encryptedPrivateKey.toString(),
          })
        );
        break;

      default:
        break;
    }

    res.status = 200;
    return res.end();
  } catch (err) {
    if (!Object.keys(http.STATUS_CODES).includes(err.statusCode)) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Internal server error" }));
    } else {
      res.statusCode = err.statusCode;
      res.end(JSON.stringify({ message: err.message }));
    }
  }
}

function createKeys() {
  global.publicKey = forge.random.getBytesSync(16);
  global.privateKey = forge.random.getBytesSync(16);
  global.iv = forge.random.getBytesSync(16);
}

function handleError(res, code) {
  res.statusCode = code;
  res.end(`{"error": "${http.STATUS_CODES[code]}"}`);
  return;
}

server.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  createKeys();
});
