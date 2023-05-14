function mySubmit(obj) {
    let pwdObj = document.getElementsByClassName('pwd');
    let hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 1});
    for (const iterator of pwdObj) {
      hashObj.update(iterator.value);
      let hash = hashObj.getHash("HEX");
      iterator.value = hash;
    }

  }