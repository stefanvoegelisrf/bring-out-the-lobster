document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.querySelector("dialog");
  const showButton = document.getElementById("showButton");
  const confirmButton = document.getElementById("confirmButton");
  const rankingList = document.getElementById("ranking-list");

  
  showButton.addEventListener("click", () => {
    dialog.showModal();
  });

  
  confirmButton.addEventListener("click", () => {
    dialog.close();
    // Rank order log
    const rankedItems = [...rankingList.children].map(item => item.dataset.value);
    console.log("Ranked items:", rankedItems);
  });

  let draggedItem = null;

  rankingList.addEventListener('dragstart', (e) => {
    draggedItem = e.target;
    e.target.classList.add('dragging');
  });

  rankingList.addEventListener('dragend', (e) => {
    e.target.classList.remove('dragging');
    draggedItem = null;
  });

  rankingList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(rankingList, e.clientY);
    if (afterElement == null) {
      rankingList.appendChild(draggedItem);
    } else {
      rankingList.insertBefore(draggedItem, afterElement);
    }
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
});
