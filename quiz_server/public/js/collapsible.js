const accordion = document.querySelector(".accordion");

accordion.addEventListener("click", (e) => {
  const activePanel = e.target.closest(".accordion-panel");
  if (!activePanel) return;
  toggleAccordion(activePanel);
});

function toggleAccordion(panelToActivate) {
  const activeButton = panelToActivate.querySelector("button");
  const activePanel = panelToActivate.querySelector(".accordion-content");
  const activePanelIsOpened = activeButton.getAttribute("aria-expanded");

  if (activePanelIsOpened === "true") {
    panelToActivate
      .querySelector("button")
      .setAttribute("aria-expanded", false);

    panelToActivate
      .querySelector(".accordion-content")
      .setAttribute("aria-hidden", true);
      activeButton.classList.toggle("active");
  } else {
    panelToActivate.querySelector("button").setAttribute("aria-expanded", true);

    panelToActivate
      .querySelector(".accordion-content")
      .setAttribute("aria-hidden", false);
      activeButton.classList.toggle("active");
  }
}

// let coll = document.getElementsByClassName("collapsible");
// let i;

// for (i = 0; i < coll.length; i++) {
//   coll[i].addEventListener("click", function() {

//     this.classList.toggle("active");
//     let content = this.lastElementChild;
//     if (content.style.display === "block") {
//       content.style.display = "none";
//     } else {
//       content.style.display = "block";
//     }
//   });
// }

// window.onclick = function (event) {
//     if (!event.target.matches(".collapsible")) {
//         let content = document.getElementsByClassName("content");
        
//         for (let i = 0; i < content.length; i++) {
            
//             if (content[i].style.display == "block") {
//                 content[i].style.display = "none";
//             }
//             coll[i].classList.remove("active");
//         }
//     }
// };
