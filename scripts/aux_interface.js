// Function to increase the quantity
function increaseQuantity() {
    let quantityElement = document.getElementById("quantity");
    let currentQuantity = parseInt(quantityElement.innerText);
    quantityElement.innerText = currentQuantity + 1;
}

// Function to decrease the quantity
function decreaseQuantity() {
    let quantityElement = document.getElementById("quantity");
    let currentQuantity = parseInt(quantityElement.innerText);
    if (currentQuantity > 1) {
        quantityElement.innerText = currentQuantity - 1;
    }
}
