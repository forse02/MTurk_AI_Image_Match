document.addEventListener("DOMContentLoaded", function () {
    fetch("mturk_match.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Loaded data:", data); // Debug output
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("JSON data is empty or not an array");
            }

            const task = data[Math.floor(Math.random() * data.length)]; // Pick a random task
            document.getElementById("prompt").innerText = task.prompt;

            let imagesContainer = document.getElementById("images-container");
            let dropContainer = document.getElementById("drop-container");
            let modelsContainer = document.getElementById("models-container");

            task.images.forEach((url, index) => {
                let imgDiv = document.createElement("div");
                imgDiv.classList.add("box");
                imgDiv.innerHTML = `<img src="${url}" width="100%" height="80%" style="object-fit: cover;">`;

                let dropBox = document.createElement("div");
                dropBox.classList.add("drop-box");
                dropBox.setAttribute("ondrop", `drop(event, 'image${index}_model')`);
                dropBox.setAttribute("ondragover", "allowDrop(event)");
                dropBox.innerHTML = `<input type="hidden" id="image${index}_model" value="">`;

                imagesContainer.appendChild(imgDiv);
                dropContainer.appendChild(dropBox);
            });

            task.models.forEach(model => {
                let dragItem = document.createElement("div");
                dragItem.classList.add("drag-item");
                dragItem.setAttribute("draggable", "true");
                dragItem.setAttribute("id", model);
                dragItem.setAttribute("ondragstart", "drag(event)");
                dragItem.innerText = model;
                modelsContainer.appendChild(dragItem);
            });

            updateSubmitButton(); // Ensure button starts disabled
        })
        .catch(error => console.error("Error loading data.json:", error));
});

function allowDrop(ev) { ev.preventDefault(); }

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev, inputId) {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    let draggedItem = document.getElementById(data);

    if (!draggedItem) {
        console.error(`Dragged item with ID '${data}' not found.`);
        return;  // Stop execution if item is missing
    }

    let targetBox = ev.target;

    if (!targetBox.classList.contains("drop-box") && targetBox.id !== "models-container") {
        targetBox = targetBox.closest(".drop-box");
    }

    if (!targetBox) {
        console.error("No valid drop target found.");
        return;
    }

    if (targetBox.id === "models-container") {
        targetBox.appendChild(draggedItem);

        // Reset value if model is dragged back
        document.querySelectorAll(".drop-box input").forEach(input => {
            if (input.value === data) {
                input.value = "";
            }
        });
    }
    else if (targetBox.classList.contains("drop-box") && targetBox.children.length === 1) {
        targetBox.appendChild(draggedItem);

        let inputField = document.getElementById(inputId);
        if (inputField) {
            inputField.value = data;
        } else {
            console.error(`Input field '${inputId}' not found.`);
        }
    }

    updateSubmitButton();
}


function checkCompletion() {
    let allFilled = true;

    // Check if all drop-boxes have an assigned value
    document.querySelectorAll(".drop-box input").forEach(input => {
        if (input.value === "") {
            allFilled = false;
        }
    });

    // Enable submit button only if all are assigned
    document.getElementById("submit-button").disabled = !allFilled;
}


function updateSubmitButton() {
    let submitButton = document.getElementById("submit-button");
    if (!submitButton) {
        console.error("Submit button not found!");
        return;  // Prevent further execution if button is missing
    }

    let allFilled = true;

    document.querySelectorAll(".drop-box input").forEach(input => {
        if (input.value === "") {
            allFilled = false;
        }
    });

    submitButton.disabled = !allFilled;  // Enable only when all are assigned
}


function submitResults() {
    let result = {
        "prompt": document.getElementById("prompt").innerText,
        "image1_model": document.getElementById("image0_model").value,
        "image2_model": document.getElementById("image1_model").value,
        "image3_model": document.getElementById("image2_model").value,
        "image4_model": document.getElementById("image3_model").value
    };

    fetch("https://script.google.com/macros/s/AKfycby26aIoi0fzMTwwMwqevEtzsK0GXOVLhP9Q_3-paAraUINnwpA_8I-Nvgc9T9yadWMc/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Success:", data);
        alert("Submission successful! Your MTurk code: 123456");
    })
    .catch(error => console.error("Error:", error));
}
