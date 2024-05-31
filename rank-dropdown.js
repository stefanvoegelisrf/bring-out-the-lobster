document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.querySelector("dialog");
    const showButton = document.getElementById("showButton");
    const confirmButton = document.getElementById("confirmButton");
  
    
    showButton.addEventListener("click", () => {
      dialog.showModal();
    });
  
    
    confirmButton.addEventListener("click", () => {
      dialog.close();
    });
  });

  
  