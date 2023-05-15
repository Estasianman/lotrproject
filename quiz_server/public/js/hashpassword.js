 function mySubmit(obj) {
    let pwdObj = document.getElementsByClassName('pwd');
    
    for (const iterator of pwdObj) {
      let hashObj = new jsSHA("SHA-512", "TEXT", { numRounds: 1 });
      hashObj.update(iterator.value);
      let hash = hashObj.getHash("HEX");
      iterator.value = hash;
    }
  }