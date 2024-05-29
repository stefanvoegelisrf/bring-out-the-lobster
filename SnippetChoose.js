document.addEventListener("DOMContentLoaded", () => {
    const firstDialog = document.querySelector("#firstDialog");
    const secondDialog = document.querySelector("#secondDialog");
    const showButton = document.querySelector("#showDialog");
    const yellowButton = document.querySelector("#yellow");
    const pinkButton = document.querySelector("#pink");
    const blackButton = document.querySelector("#black");
    const closeSecondDialogButton = document.querySelector("#closeSecondDialog");
    const counterText = document.querySelector("#counterText");

    const colorMap = {
        yellow: 'Yellow',
        pink: 'Pink',
        black: 'Black'
    };

    const buttons = [yellowButton, pinkButton, blackButton];
    let counter = 0;

    // "Show the dialog" button opens the dialog modally
    showButton.addEventListener("click", () => {
        firstDialog.showModal();
    });

    // Function to handle button click with color change and open second dialog
    const handleButtonClick = (button, color) => {
        button.classList.add('selected');
        setTimeout(() => {
            button.classList.remove('selected');
            firstDialog.close();
            console.log(`You selected: ${color}`);
            counter++;
            counterText.textContent = `${counter}/6`;
            secondDialog.showModal();
        }, 1000);
    };

    buttons.forEach(button => {
        button.addEventListener("click", () => handleButtonClick(button, colorMap[button.id]));
    });

    // Close the second dialog
    closeSecondDialogButton.addEventListener("click", () => {
        secondDialog.close();
    });

    // Prevent the dialog from reopening on close
    firstDialog.addEventListener('close', () => {
        console.log('First dialog closed');
    });

    secondDialog.addEventListener('close', () => {
        console.log('Second dialog closed');
    });
});
