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


            task.images.sort(() => Math.random() - 0.5);

            task.images.forEach((url, index) => {
                let imgDiv = document.createElement("div");
                imgDiv.classList.add("box");
                // imgDiv.innerHTML = `<img src="${url}" width="100%" height="80%" style="object-fit: cover;" onclick="getPrediction('${url}')">`;  
                imgDiv.innerHTML = `<img src="${url}" width="100%" height="80%" style="object-fit: cover;" onclick="getPrediction('${url}', ${index})">`;

                let dropBox = document.createElement("div");
                dropBox.classList.add("drop-box");
                dropBox.setAttribute("ondrop", `drop(event, 'image${index}_model')`);
                dropBox.setAttribute("ondragover", "allowDrop(event)");
                dropBox.innerHTML = `<input type="hidden" id="image${index}_model" value="">`;
            
                imagesContainer.appendChild(imgDiv);
                dropContainer.appendChild(dropBox);
            });
            


            task.models.sort(() => Math.random() - 0.5);

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

function nextTask() {
    location.reload();
}


// async function getPrediction(imageUrl) {
//     const apiUrl = "https://ad14-34-85-162-161.ngrok-free.app/predict";
    
//     try {
//         console.log("Sending request to:", apiUrl);
//         console.log("Image url:", imageUrl)
//         const response = await fetch(apiUrl, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ url: imageUrl })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const result = await response.json();
//         console.log("API Response:", result);

//         if (result.error) {
//             document.getElementById("prediction-result").innerText = `Error: ${result.error}`;
//         } else {
//             document.getElementById("prediction-result").innerText = 
//                 `Prediction: ${result.model} (Confidence: ${(result.confidence * 100).toFixed(0)}%)`;
//         }
//     } catch (error) {
//         console.error("Error fetching prediction:", error);
//         document.getElementById("prediction-result").innerText = `Error: ${error.message}`;
//     }
// }

async function getPrediction(imageUrl, imageIndex) {
    const apiUrl = "https://ad14-34-85-162-161.ngrok-free.app/predict";
    
    try {
        console.log("Sending request to:", apiUrl);
        console.log("Image url:", imageUrl);
        
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: imageUrl })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("API Response:", result);

        // Convert index to ordinal (1st, 2nd, 3rd, 4th)
        const ordinal = ["1st", "2nd", "3rd", "4th"];
        let imagePosition = ordinal[imageIndex] || `${imageIndex + 1}th`;

        let predictionElement = document.getElementById("prediction-result");

        if (result.error) {
            predictionElement.innerText = `Error: ${result.error}`;
        } else {
            predictionElement.innerText = 
                `Prediction for the ${imagePosition} image: ${result.model} (Confidence: ${(result.confidence * 100).toFixed(0)}%)`;
        }
    } catch (error) {
        console.error("Error fetching prediction:", error);
        document.getElementById("prediction-result").innerText = `Error: ${error.message}`;
    }
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


// function submitResults() {
//     let result = {
//         "prompt": document.getElementById("prompt").innerText,
//         "image1_model": document.getElementById("image0_model").value,
//         "image2_model": document.getElementById("image1_model").value,
//         "image3_model": document.getElementById("image2_model").value,
//         "image4_model": document.getElementById("image3_model").value
//     };

//     fetch("https://formspree.io/f/mqapzyyl", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(result)
//     })
//     .then(resp => resp.json())
//     .then(data => {

//         // Generate and display MTurk completion code
//         let completionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
//         document.getElementById("mturk-code").innerText = completionCode;
//         document.getElementById("completion-section").style.display = "block";

//         // Disable Submit Button & Enable Next Task Button
//         document.getElementById("submit-button").disabled = true;
//         document.getElementById("next-task-btn").disabled = false;
//     })
//     .catch(err => console.log(err));
// }

function submitResults() {
    let result = {
        "prompt": document.getElementById("prompt").innerText,
        "image1_model": document.getElementById("image0_model").value,
        "image2_model": document.getElementById("image1_model").value,
        "image3_model": document.getElementById("image2_model").value,
        "image4_model": document.getElementById("image3_model").value
    };

    fetch("https://ad14-34-85-162-161.ngrok-free.app/submit", {  // replace with actual ngrok url
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
    })
    .then(resp => resp.json())
    .then(data => {
            // Generate and display MTurk completion code
            let completionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            document.getElementById("mturk-code").innerText = completionCode;
            document.getElementById("completion-section").style.display = "block";

            // Disable Submit Button & Enable Next Task Button
            document.getElementById("submit-button").disabled = true;
            document.getElementById("next-task-btn").disabled = false;
    })
    .catch(err => console.log("Error submitting: ", err));
}


