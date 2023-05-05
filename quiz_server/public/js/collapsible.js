const accordion = document.querySelector(".accordion");
const editReasonInput = document.querySelectorAll('#edit-reason-input-container');
let editReasonButton = document.querySelectorAll('#edit-reason').forEach((element) => {
  element.addEventListener("click",(eClicked)=>{
    
    let textBox = element.nextElementSibling;
    let textBoxIsOpened = element.getAttribute("aria-expanded");
    
    if (textBoxIsOpened == "true"){
      textBox.setAttribute("aria-hidden", true);
      element.setAttribute("aria-expanded", false);
    }
    else{
      textBox.setAttribute("aria-hidden", false);
      element.setAttribute("aria-expanded", true);
    }
  });
});

accordion.addEventListener("click", (e) => {
  const activePanel = e.target.closest(".accordion-panel");
  if (!activePanel || e.target.matches(".a")) return;
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
    panelToActivate
    .querySelector("button")
    .setAttribute("aria-expanded", true);

    panelToActivate
      .querySelector(".accordion-content")
      .setAttribute("aria-hidden", false);
      activeButton.classList.toggle("active");
  }
}