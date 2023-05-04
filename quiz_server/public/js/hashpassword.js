function mySubmit(obj) {
    let pwdObj = document.getElementById('pwd');
    let hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 1});
    hashObj.update(pwdObj.value);
    let hash = hashObj.getHash("HEX");
    pwdObj.value = hash;
  }