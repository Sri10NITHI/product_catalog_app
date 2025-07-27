const API_URL = 'http://127.0.0.1:5000'; // Make sure this matches your Flask backend URL

const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const priceInput = document.getElementById('price');
const stockInput = document.getElementById('stock');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const productListDiv = document.getElementById('productList');

const productDetailModal = document.getElementById('productDetailModal');
const closeButton = document.querySelector('.close-button');
const detailId = document.getElementById('detailId');
const detailName = document.getElementById('detailName');
const detailDescription = document.getElementById('detailDescription');
const detailPrice = document.getElementById('detailPrice'); // Will update this
const detailStock = document.getElementById('detailStock');

// Global variables for filtering and sorting
let allProducts = [];
let displayedProducts = [];

// DOM elements for filter and sort controls
const filterInput = document.getElementById('filterInput');
const sortSelect = document.getElementById('sortSelect');
const resetFiltersButton = document.getElementById('resetFiltersButton');


// NEW: Currency Formatter for Indian Rupees
const inrFormatter = new Intl.NumberFormat('en-IN', { // 'en-IN' for India locale
    style: 'currency',
    currency: 'INR', // INR for Indian Rupee
    minimumFractionDigits: 2, // Ensure two decimal places
    maximumFractionDigits: 2,
});


// --- Fetch and Display Products ---
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allProducts = await response.json();
        applyFiltersAndSort();
    } catch (error) {
        console.error('Error fetching products:', error);
        productListDiv.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}

// Function to apply filters and sorting (no change here)
function applyFiltersAndSort() {
    let currentProducts = [...allProducts];

    const filterText = filterInput.value.toLowerCase().trim();
    if (filterText) {
        currentProducts = currentProducts.filter(product =>
            product.name.toLowerCase().includes(filterText) ||
            (product.description && product.description.toLowerCase().includes(filterText))
        );
    }

    const sortOption = sortSelect.value;
    switch (sortOption) {
        case 'name_asc':
            currentProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name_desc':
            currentProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price_asc':
            currentProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            currentProducts.sort((a, b) => b.price - a.price);
            break;
        case 'stock_asc':
            currentProducts.sort((a, b) => a.stock - b.stock);
            break;
        case 'stock_desc':
            currentProducts.sort((a, b) => b.stock - a.stock);
            break;
    }

    displayedProducts = currentProducts;
    displayProducts(displayedProducts);
}

// Modified displayProducts function to use INR formatter
function displayProducts(productsToDisplay) {
    productListDiv.innerHTML = '';

    if (productsToDisplay.length === 0) {
        productListDiv.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card-info">
                <h3>${product.name}</h3>
                <p>Price: ${inrFormatter.format(product.price)} | Stock: ${product.stock}</p>
            </div>
            <div class="product-card-actions">
                <button class="view-btn" data-id="${product.id}">View</button>
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
            </div>
        `;
        productListDiv.appendChild(productCard);
    });

    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', (e) => viewProduct(e.target.dataset.id));
    });
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editProduct(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
    });
}

// --- Add/Update Product (no change here, priceInput remains a number) ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = productIdInput.value;
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const price = parseFloat(priceInput.value); // Ensure this remains a number
    const stock = parseInt(stockInput.value);

    if (!name || isNaN(price) || isNaN(stock)) {
        alert('Please fill in all required fields (Name, Price, Stock) with valid values.');
        return;
    }

    const productData = { name, description, price, stock };

    try {
        let response;
        if (id) {
            response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || response.statusText}`);
        }

        productForm.reset();
        productIdInput.value = '';
        submitButton.textContent = 'Add Product';
        cancelEditButton.style.display = 'none';
        fetchProducts();
    } catch (error) {
        console.error('Error submitting product:', error);
        alert(`Failed to save product: ${error.message}`);
    }
});

// --- Edit Product (no change, priceInput still handles numbers) ---
async function editProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const product = await response.json();

        productIdInput.value = product.id;
        nameInput.value = product.name;
        descriptionInput.value = product.description;
        priceInput.value = product.price; // Keep this as a number for editing
        stockInput.value = product.stock;

        submitButton.textContent = 'Update Product';
        cancelEditButton.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        alert('Failed to load product for editing.');
    }
}

// --- Cancel Edit (no change) ---
cancelEditButton.addEventListener('click', () => {
    productForm.reset();
    productIdInput.value = '';
    submitButton.textContent = 'Add Product';
    cancelEditButton.style.display = 'none';
});

// --- Delete Product (no change) ---
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || response.statusText}`);
        }
        fetchProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Failed to delete product: ${error.message}`);
    }
}

// --- View Product Details (Modal - MODIFIED to use INR formatter) ---
async function viewProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const product = await response.json();

        detailId.textContent = product.id;
        detailName.textContent = product.name;
        detailDescription.textContent = product.description || 'N/A';
        detailPrice.textContent = inrFormatter.format(product.price); // Apply formatter here
        detailStock.textContent = product.stock;

        productDetailModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Failed to load product details.');
    }
}

// Close modal when close button is clicked (no change)
closeButton.addEventListener('click', () => {
    productDetailModal.style.display = 'none';
});

// Close modal when clicking outside of it (no change)
window.addEventListener('click', (event) => {
    if (event.target === productDetailModal) {
        productDetailModal.style.display = 'none';
    }
});

// Event Listeners for filter and sort controls (no change)
filterInput.addEventListener('input', applyFiltersAndSort);
sortSelect.addEventListener('change', applyFiltersAndSort);
resetFiltersButton.addEventListener('click', () => {
    filterInput.value = '';
    sortSelect.value = 'none';
    applyFiltersAndSort();
});

// Initial fetch of products when the page loads
document.addEventListener('DOMContentLoaded', fetchProducts);
