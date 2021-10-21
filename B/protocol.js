const fetch = require("cross-fetch");
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

const Protocol = function () {};
Protocol.prototype.getInitialInfo = getInitialInfo;
Protocol.prototype.B_API = B_API;
Protocol.prototype.KM_API = KM_API;

module.exports = new Protocol();
