let coll = document.getElementsByClassName("collapsible");
let i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {

    this.classList.toggle("active");
    let content = this.lastElementChild;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

window.onclick = function (event) {
    if (!event.target.matches(".collapsible")) {
        let content = document.getElementsByClassName("content");
        
        for (let i = 0; i < content.length; i++) {
            
            if (content[i].style.display == "block") {
                content[i].style.display = "none";
            }
            coll[i].classList.remove("active");
        }
    }
};