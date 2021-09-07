const crypt = require('crypto-js');
const axios = require('axios');
const PBKDF2WithHmacSHA256 = require('pbkdf2-sha256');

const SECRET_KEY = 'dayanandpanchal';
const SALT = 'panchaldayanand';
// const keySize = 128 / 8;
const keySize = 256 / 8;
const mode = crypt.mode.CBC;
const padding = crypt.pad.Pkcs7;

function stringToByteArray(str) {
  return Array.from(str, ch => ch.charCodeAt(0));
}

function byteArrayToString(byteArr) {
  return String.fromCharCode.apply(null, byteArr);
}

function parseKey(key) {
  return crypt.enc.Utf8.parse(key);
}


function getIv() {
  let ivArr = [1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
  return crypt.lib.WordArray.create(ivArr).toString(crypt.enc.Hex);
}

function generateKey() {
  let key = crypt.PBKDF2(SECRET_KEY, SALT, { keySize, iterations: keySize * keySize });
  // let key = crypt.HmacSHA256(SECRET_KEY, SALT, { keySize, iterations: keySize * keySize });
  // let key = PBKDF2WithHmacSHA256(SECRET_KEY, SALT, keySize * keySize, keySize);
  return key;
}


function getKey() {
  if (SECRET_KEY.length === keySize) return parseKey(SECRET_KEY);
  const byteArr = stringToByteArray(SECRET_KEY);
  if (byteArr.length < keySize) {
    let pad = keySize - byteArr.length;
    for (let i = 0; i < pad; i++) {
      byteArr.push(0);
    }
  } else {
    byteArr.splice(keySize);
  }
  return parseKey(byteArrayToString(byteArr));
}


function encrypt(value) {
  // var key = getKey();  // EBC Mode
  var key = generateKey();
  var iv = getIv();  // EBC Mode - iv === key
  let payload = value;
  if (toString.call(payload) !== '[object String]') {
    payload = JSON.stringify(payload);
  } else {
    payload = value.toString();
  }
  var encrypted = crypt.AES.encrypt(crypt.enc.Utf8.parse(payload), key, {
      keySize,
      iv: crypt.enc.Hex.parse(iv),  // EBC mode - no need to parse
      // mode,  // Required for EBC
      // padding  // Required for EBC
  });

  return encrypted.toString();
}

function decrypt(value) {
  // var key = getKey();   // EBC Mode
  var key = generateKey();
  var iv = getIv();  // EBC Mode - iv === key
  var decrypted = crypt.AES.decrypt(value, key, {
      keySize,
      iv: crypt.enc.Hex.parse(iv),  // EBC mode - no need to parse
      // mode,  // Required for EBC
      // padding  // Required for EBC
  });
  return decrypted.toString(crypt.enc.Utf8);
}

async function saveBook() {
  const req = {bookName:'Krishna: The Man and His Philosofy',authorName:'Osho',quantity:1,price:350.0};
  try {
    const headers = {
      'Content-Type': 'application/text'
    };
    const { data } = await axios.post('http://localhost:8080/book', encrypt(req), { headers });
    console.log('data ', data);
    const res = decrypt(data);
    console.log('res ', res);
  } catch {
    console.log('error in api call');
  }
}

const cipherText = encrypt('dayanand');
console.log('cipherText ', cipherText);

console.log('plaintext: ', decrypt(cipherText));

// saveBook();

async function getAllBooks() {
  try {
    const headers = {
      'Content-Type': 'application/text'
    };
    const { data } = await axios.get('http://localhost:8080/book', { headers });
    console.log('data ', data);
    const res = decrypt(data);
    console.log('res ', res);
  } catch {
    console.log('error in api call');
  }
}

// getAllBooks();
