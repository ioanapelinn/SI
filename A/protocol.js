const fs = require("fs");
const fetch = require("cross-fetch");
const AES = require("crypto-js/aes");
const CryptoJS = require("crypto-js");
const KM_API = "http://localhost:3030/";
const B_API = "http://localhost:3032/";

const getInitialInfo = async () => {
  const response = await fetch(`${KM_API}initial/info`);
  if (response.status !== 200) {
    console.log(
      "Looks like there was a problem. Status Code: " + response.status
    );
    return;
  }
  const { publicKey, iv } = await response.json();
  global.publicKey = publicKey;
  global.iv = iv;
};

const connect = async () => {
  const responseSendMode = await sendOperatingMode();
  if (responseSendMode !== "Success") return;

  const responseGetPrivateKey = await getPrivateKey();
  if (responseGetPrivateKey !== "Success") return;

  const responseSendPrivateKey = await sendPrivateKey();
  if (responseSendPrivateKey !== "Success") return;

  const responseSendEncryptedFileContent = await sendEncryptedFileContent();
  if (responseSendEncryptedFileContent !== "Success") return;
  console.log("File successfully decrypted by B.");
};

const sendOperatingMode = async () => {
  const response = await fetch(`${B_API}operating/mode`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      mode: global.mode,
    }),
  });
  if (response.status !== 200) {
    console.log(
      "Looks like there was a problem. Status Code: " + response.status
    );
    return;
  }

  return "Success";
};

const getPrivateKey = async () => {
  const response = await fetch(`${KM_API}private/key`);

  if (response.status !== 200) {
    console.log(
      "Looks like there was a problem. Status Code: " + response.status
    );
    return;
  }
  const result = await response.json();
  global.privateKey = AES.decrypt(result.encrypted, global.publicKey).toString(
    CryptoJS.enc.Utf8
  );

  return "Success";
};

const sendPrivateKey = async () => {
  const encryptedPrivateKey = AES.encrypt(global.privateKey, global.publicKey);
  const response = await fetch(`${B_API}setup`, {
    method: "post",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      encrypted: encryptedPrivateKey.toString(),
    }),
  });

  if (response.status !== 200) {
    console.log(
      "Looks like there was a problem. Status Code: " + response.status
    );
    return;
  }
  return "Success";
};

const splitFileByChunks = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("file.txt", "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      blocks = data.match(new RegExp(".{1," + 8 + "}", "g"));
      resolve(blocks);
    });
  });
};

const encryptBlocksWithECB = (blocks) => {
  let encryptedBlocks = blocks.map((block) =>
    AES.encrypt(block, global.privateKey).toString()
  );
  return encryptedBlocks;
};

const encryptBlocksWithCFB = (blocks) => {
  var encryptedBlocks = [];
  var blockCipher = AES.encrypt(global.iv, global.privateKey).toString();

  for (let i = 0; i < blocks.length; i++) {
    encryptedBlocks[i] = xor(blockCipher, blocks[i]);
    blockCipher = AES.encrypt(encryptedBlocks[i], global.privateKey).toString();
  }
  return encryptedBlocks;
};

const sendEncryptedFileContent = async () => {
  let blocks = await splitFileByChunks();
  let encryptedBlocks = [];
  if (global.mode === "ECB") {
    encryptedBlocks = encryptBlocksWithECB(blocks);
  } else {
    encryptedBlocks = encryptBlocksWithCFB(blocks);
  }
  const response = await fetch(`${B_API}message`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ encrypted: encryptedBlocks }),
  });
  if (response.status !== 200) {
    console.log(
      "Looks like there was a problem. Status Code: " + response.status
    );
    return;
  }

  return "Success";
};

function xor(a, b) {
  let s = "";
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    s += String.fromCharCode((a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0));
  }
  return s;
}

const Protocol = function () {};
Protocol.prototype.getInitialInfo = getInitialInfo;
Protocol.prototype.connect = connect;
Protocol.prototype.B_API = B_API;
Protocol.prototype.KM_API = KM_API;
module.exports = new Protocol();
