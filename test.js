const CryptoJS = require("crypto-js");

const payload = {
  project_id: "689d783e207f0b0c309fa07c",
  number: "917047468741",
  name: "Sourav Developer",
  email: "souravad1916@gmail.com",
  firm_name: "OneSaas",
  website: "onesaas.in",
  remark: "This is new number"
};

// must match your backend decryption key
const secretKey = "bdce1f9883ddb568459d3b564b32a164";

const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), secretKey).toString();

console.log({
  data: ciphertext,
  key: secretKey
});
