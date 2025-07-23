/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
//global array to store all selected products 
const selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}


/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product, index) => {
      const modalId = `modal-${index}`;
      return `
        <div class="product-card" 
             data-name="${product.name}" 
             data-brand="${product.brand}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button 
              type="button" 
              class="modal-btn btn btn-primary"
              data-bs-toggle="modal" 
              data-bs-target="#${modalId}"
              onclick="event.stopPropagation()"
            >
              View Details
            </button>
          </div>
        </div>

        <!-- Modal for this product -->
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${product.name}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p><strong>Brand:</strong> ${product.brand}</p>
                <p>${product.description || "No description available."}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}


//code for selecting/ deselecting products and adding to selected list
function handleProductSelection(){
  const productCard = document.querySelectorAll(".product-card");
  const selectedProductsList = document.querySelector("#selectedProductsList");
  productCard.forEach(card => {
    card.addEventListener("click" , () => {
      //get elements from the DOM
      const name = card.getAttribute("data-name");
      const brand = card.getAttribute("data-brand");

      // Check if the product is already in the selectedProducts array
      const isInArray = selectedProducts.some(
        product => product.name === name && product.brand === brand
      );

      const isSelected = card.classList.contains("selected-card");

      if (!isSelected && !isInArray) {
        // Select card and add product
        card.classList.add("selected-card");

        selectedProducts.push({ name, brand });
        saveSelectedProducts();

      // create item and add it to product list
      const item = document.createElement("div");
      item.classList.add("selected-product-item");
      item.setAttribute("data-name", name); 
      item.innerHTML = `
      ${name} - ${brand}
      <button class="remove-btn">✖</button>
      `
      const removeButton = item.querySelector(".remove-btn");
      removeButton.addEventListener("click", () => {
      //remove from list
      item.remove()
      //remove from the global array
      const index = selectedProducts.findIndex((product) => {
        return product.name === name && product.brand === brand
      });
      //if item exists in the index, remove 1 item at whatever index the item is located
      if (index !== -1) {
        selectedProducts.splice(index, 1);
        saveSelectedProducts();
      }
      //deselect card 
      card.classList.remove("selected-card");
    });
      selectedProductsList.appendChild(item);
      }


      else {
        //deselect card 
        card.classList.remove("selected-card");
        //remove product from the list 
        const existingItem = selectedProductsList.querySelector(
          `[data-name="${name}"]`
        );
        if (existingItem) {
          existingItem.remove();
        }
        //remove from the global array
      const index = selectedProducts.findIndex((product) => {
        return product.name === name && product.brand === brand
      });
      //if item exists in the index, remove 1 item at whatever index the item is located
      if (index !== -1) {
        selectedProducts.splice(index, 1);
        saveSelectedProducts();
      }
      }
      
    });
  });
}

function restoreSelectedCardStyles() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach(card => {
    const name = card.getAttribute("data-name");
    const brand = card.getAttribute("data-brand");

    const isInArray = selectedProducts.some(
      product => product.name === name && product.brand === brand
    );

    if (isInArray) {
      card.classList.add("selected-card");
    }
  });
}

function restoreSelectedProductsList() {
  const selectedProductsList = document.querySelector("#selectedProductsList");
  selectedProductsList.innerHTML = ""; // clear current

  selectedProducts.forEach(({ name, brand }) => {
    const item = document.createElement("div");
    item.classList.add("selected-product-item");
    item.setAttribute("data-name", name);
    item.innerHTML = `
      ${name} - ${brand}
      <button class="remove-btn">✖</button>
    `;

    const removeButton = item.querySelector(".remove-btn");
    removeButton.addEventListener("click", () => {
      item.remove();
      const index = selectedProducts.findIndex(p => p.name === name && p.brand === brand);
      if (index !== -1) {
        selectedProducts.splice(index, 1);
        saveSelectedProducts();
      }
      const card = document.querySelector(`.product-card[data-name="${name}"][data-brand="${brand}"]`);
      if (card) card.classList.remove("selected-card");
    });

    selectedProductsList.appendChild(item);
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
  handleProductSelection();
  restoreSelectedCardStyles();
  restoreSelectedProductsList();
});

const userInput = document.getElementById("userInput");


// ------- CHATBOT CODE -------- 

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
});

// Initialize an array to keep track of the conversation history
let messages = [
  {
    role: "system",
    content: `You are a helpful and knowledgeable assistant for L’Oréal. You generate a skincare routine based on the selected prodcuts. Only answer questions related to L’Oréal products, skincare and haircare routines, and product recommendations. If a user asks something unrelated to L’Oréal, politely redirect them to ask about L’Oréal's offerings.`,
  },
];

// REPLACE with your actual Cloudflare Worker URL
const workerUrl = "https://misty-hill-502e.kdaviso5.workers.dev/";

//code for creating a peresonalized routine 

const generateButton = document.getElementById("generateRoutine");

generateButton.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div class="assistant-message error">Please select some products before generating a routine.</div>`;
    return;
  }

  // Build a readable list of selected products
  const productList = selectedProducts
    .map((p) => `${p.name} by ${p.brand}`)
    .join(", ");

  const prompt = `Please create a skincare or haircare routine using the following L’Oréal products: ${productList}. Suggest the best order to use them and explain each step.`;

  // Add to chat history
  messages.push({ role: "user", content: prompt });

  // Display the prompt to the user
  chatWindow.innerHTML += `
    <div class="user-message"><strong>You:</strong> ${prompt}</div>
    <div class="assistant-message"><em>Assistant is thinking...</em></div>
  `;

  console.log("Generate button clicked!"); // ✅ DEBUG CHECK
  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        max_completion_tokens: 1500,
        temperature: 0.5,
        frequency_penalty: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const replyText = result.choices[0].message.content;


    messages.push({ role: "assistant", content: replyText });

    chatWindow.innerHTML += `<div class="bot-message">${replyText}</div>`;
    // Re-render the chat window
  let chatHistory = "";
  for (const msg of messages) {
    if (msg.role === "user") {
      chatHistory += `<div class="user-message"><strong>You:</strong> ${msg.content}</div>`;
    } else if (msg.role === "assistant") {
      chatHistory += `<div class="assistant-message"><strong>Assistant:</strong> ${msg.content}</div>`;
    }
  }
  chatWindow.innerHTML = chatHistory;
    
  } catch (error) {
    console.error("Error sending request:", error);
  }
});


// Add event listener to the form
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the form from submitting the traditional way
  //I need to figure out how to get this to display while still keeping all the chats

  chatWindow.textContent = "Thinking..."; // Display a loading message

  // Add the user's message to the conversation history
  messages.push({ role: "user", content: userInput.value });

  // Show chat history plus "Thinking..." message
  let chatHistory = "";
  for (const msg of messages) {
    if (msg.role === "user") {
      chatHistory += `<div class="user-message"><strong>You:</strong> ${msg.content}</div>`;
    } else if (msg.role === "assistant") {
      chatHistory += `<div class="assistant-message"><strong>Assistant:</strong> ${msg.content}</div>`;
    }
  }
  // Add the "Thinking..." message at the end
  chatHistory += `<div class="assistant-message"><em>Assistant is thinking...</em></div>`;
  chatWindow.innerHTML = chatHistory;

  try {
    // Send a POST request to your Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        max_completion_tokens: 1000,
        temperature: 0.5,
        frequency_penalty: 0.5,
      }),
    });

    // Check if the response is not ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse JSON response from the Cloudflare Worker
    const result = await response.json();

    // Get the reply from OpenAI's response structure
    const replyText = result.choices[0].message.content;

    // Add the Worker's response to the conversation history
    messages.push({ role: "assistant", content: replyText });

    // Show all messages in the chat window
    // Build a string with each message on a new line
    chatHistory = "";
    for (const msg of messages) {
      // Only show user and assistant messages (skip system)
      if (msg.role === "user") {
        chatHistory += `<div class="user-message"><strong>You:</strong> ${msg.content}</div>`;
      } else if (msg.role === "assistant") {
        chatHistory += `<div class="assistant-message"><strong>Assistant:</strong> ${msg.content}</div>`;
      }
    }
    // Display the conversation in the chat window using innerHTML
    chatWindow.innerHTML = chatHistory;
  } catch (error) {
    console.error("Error:", error); // Log the error
    chatWindow.textContent =
      "Sorry, something went wrong. Please try again later."; // Show error message to the user
  }

  // Clear the input field
  userInput.value = "";
});
