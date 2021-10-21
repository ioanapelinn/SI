const http = require("http");
const url = require("url");
const AES = require("crypto-js/aes");
const CryptoJS = require("crypto-js");

const Protocol = require("./src/protocol");
const port = 3032;

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
    return handlePostReq(req, res);
  } else if (req.method === "DELETE") {
    return res.end("DELETE");
  } else if (req.method === "PUT") {
    return res.end("PUT");
  } else if (req.method === "OPTIONS") {
    return res.end("OPTIONS");
  }
});

async function handlePostReq(req, res) {
  const size = parseInt(req.headers["content-length"], 10);
  const buffer = Buffer.allocUnsafe(size);
  var pos = 0;

  const { pathname } = url.parse(req.url);
  if (
    pathname !== "/operating/mode" &&
    pathname !== "/setup" &&
    pathname !== "/message"
  ) {
    return handleError(res, 404);
  }

  req
    .on("data", (chunk) => {
      const offset = pos + chunk.length;
      if (offset > size) {
        reject(413, "Too Large", res);
        return;
      }
      chunk.copy(buffer, pos);
      pos = offset;
    })
    .on("end", async () => {
      if (pos !== size) {
        reject(400, "Bad Request", res);
        return;
      }

      try {
        const data = JSON.parse(buffer.toString());

        switch (pathname) {
          case "/operating/mode":
            global.mode = data.mode;
            res.write({ status: 200 });
            res.end();
            break;

          case "/setup":
            global.privateKey = AES.decrypt(
              data.encrypted,
              global.publicKey
            ).toString(CryptoJS.enc.Utf8);
            res.write({ status: 200 });
            res.end();
            break;

          case "/message":
            let decryptedMessage = "";
            const encryptedBlocks = data.encrypted;

            switch (global.mode) {
              case "ECB":
                encryptedBlocks.forEach((block) => {
                  decryptedMessage =
                    decryptedMessage +
                    AES.decrypt(block, global.privateKey).toString(
                      CryptoJS.enc.Utf8
                    );
                });
                break;

              case "CFB":
                let blockCipher = AES.encrypt(
                  global.iv,
                  global.privateKey
                ).toString();

                decryptedMessage =
                  decryptedMessage + xor(blockCipher, encryptedBlocks[0]);

                for (i = 1; i < encryptedBlocks.length; i++) {
                  blockCipher = AES.encrypt(
                    encryptedBlocks[i - 1],
                    global.privateKey
                  ).toString();

                  decryptedMessage =
                    decryptedMessage + xor(blockCipher, encryptedBlocks[i]);
                }
                break;
            }
            console.log(decryptedMessage);
            break;

          default:
            break;
        }
        res.write({ status: 200 });
        res.end();
      } catch (err) {
        if (!Object.keys(http.STATUS_CODES).includes(err.statusCode)) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: "Internal server error" }));
        } else {
          res.statusCode = err.statusCode;
          res.end(JSON.stringify({ message: err.message }));
        }
      }
    });
}

function xor(a, b) {
  let s = "";
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    s += String.fromCharCode((a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0));
  }
  return s;
}

function handleError(res, code) {
  res.statusCode = code;
  res.end(`{"error": "${http.STATUS_CODES[code]}"}`);
  return;
}

server.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  Protocol.getInitialInfo();
});
