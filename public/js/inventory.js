document.addEventListener('DOMContentLoaded', function () {
    const addProductButton = document.getElementById('addProduct');
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const productForm = document.getElementById('productForm');
    const searchProductInput = document.getElementById('searchProduct');
    
    let products = []; // This will hold the inventory data

    // Function to calculate total value for each product
    function calculateTotalValue(quantity, price) {
        return (quantity * price).toFixed(2);
    }

    // Function to calculate total inventory value
    function calculateTotalInventoryValue() {
        const totalValue = products.reduce((sum, product) => {
            return sum + (product.quantity * product.price);
        }, 0);

        // Update the total inventory value on the page
        document.getElementById('totalInventoryValue').textContent = `$${totalValue.toFixed(2)}`;
    }

    // Function to render the inventory table
    function renderInventory(filteredProducts = products) {
        inventoryTableBody.innerHTML = ''; // Clear the current table body

        filteredProducts.forEach((product, index) => {
            const row = document.createElement('tr');
            
            // Check if the quantity is below 10 to add a red style
            const quantityClass = product.quantity < product.threshold ? 'text-danger' : '';


            row.innerHTML = `
               <td><input type="text" class="form-control product-name" value="${product.name}" data-index="${index}"></td>
                <td><input type="number" class="form-control product-quantity ${quantityClass}" value="${product.quantity}" data-index="${index}" min="0"></td>
               <td><input type="number" class="form-control product-price" value="${parseFloat(product.price).toFixed(2)}" data-index="${index}" step="0.01" min="0"></td>
                <td>$${calculateTotalValue(product.quantity, product.price)}</td>
                 <td>
        <input type="number" class="form-control product-threshold" value="${product.threshold || 0}" data-index="${index}" min="0">
    </td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm remove-product" data-index="${index}">Remove</button>
                </td>
            `;

            inventoryTableBody.appendChild(row);
        });

        // Update event listeners for the new list of products (filtered products)
        updateEventListeners(filteredProducts);

        // After rendering, calculate the total inventory value
        calculateTotalInventoryValue();
    }

    // Function to fetch products from the backend
    function fetchProducts() {
        axios.get('http://localhost:5000/products/getproduct')
            .then(response => {
                // Update the products array with data from the server
                products = response.data;  // Assuming the response contains an array of products
                renderInventory();  // Re-render the table with the fetched products
            })
            .catch(error => {
                console.error('Error fetching products:', error);
            });
    }

    // Event listener for adding new products
    addProductButton.addEventListener('click', function () {
        document.getElementById('productName').value = '';
        document.getElementById('productQuantity').value = 1;
        document.getElementById('productPrice').value = 0;
        productModal.show();
    });

    // Event listener for the product form submit
    productForm.addEventListener('submit', function (e) {
        e.preventDefault();  // Prevent form submission from reloading the page

        const name = document.getElementById('productName').value;
        const quantity = parseInt(document.getElementById('productQuantity').value);
        const price = parseFloat(document.getElementById('productPrice').value);
        const threshold = parseInt(document.getElementById('productThreshold').value);
        // Prepare the product data object
        const productData = {
            name: name,
            quantity: quantity,
            price: price,
            threshold: threshold
        };

        // Axios POST request to add the product to the backend
        axios.post('http://localhost:5000/products/addproduct', productData)
            .then(response => {
                // If successful, add the product to the local array and re-render the inventory table
               // You can log the response if needed
                products.push({ name, quantity, price });

                // Close the modal and re-render the inventory table
                productModal.hide();
                renderInventory();
            })
            .catch(error => {
                console.error('Error adding product:', error);
            });
    });

    // Update event listeners for quantity inputs and remove buttons
    function updateEventListeners(filteredProducts) {
        // Quantity change event listeners
        const quantityInputs = document.querySelectorAll('.product-quantity');
        quantityInputs.forEach(input => {
            input.addEventListener('input', function (e) {
                e.preventDefault();  // Prevent any unwanted behavior, like form submission or reload

                const index = e.target.getAttribute('data-index');
                const product = filteredProducts[index];  // Get product from filtered list
                product.quantity = parseInt(e.target.value);

                renderInventory(filteredProducts); // Re-render after update

                const id = product.id;

                // Update the backend when quantity is changed
                axios.put(`http://localhost:5000/products/updateproduct/${id}`, product)
                    .then(response => {
                        console.log('Product updated:', response.data);
                    })
                    .catch(error => {
                        console.error('Error updating product:', error);
                    });
            });
            
            
        });

        // Remove product event listeners
        const removeButtons = document.querySelectorAll('.remove-product');
        removeButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                const index = e.target.getAttribute('data-index');
                const productId = filteredProducts[index].id; // Assuming the product has an ID field
                filteredProducts.splice(index, 1); // Remove product from array
                renderInventory(filteredProducts); // Re-render after removal
                // Make an API call to remove the product from the backend
                axios.delete(`http://localhost:5000/products/removeproduct/${productId}`)
                    .then(response => {
                        console.log('Product removed:', response.data);
                    })
                    .catch(error => {
                        console.error('Error removing product:', error);
                    });
            });
        });
        const thresholdInputs = document.querySelectorAll('.product-threshold');
    thresholdInputs.forEach(input => {
        input.addEventListener('input', function (e) {
            const index = e.target.getAttribute('data-index');
            const product = filteredProducts[index];
            product.threshold = parseInt(e.target.value);

            const id = product.id;

            axios.put(`http://localhost:5000/products/updateproduct/${id}`, product)
                .then(response => {
                    console.log('Threshold updated:', response.data);
                })
                .catch(error => {
                    console.error('Error updating threshold:', error);
                });
        });
    });
    // Name change event listeners
const nameInputs = document.querySelectorAll('.product-name');
nameInputs.forEach(input => {
    input.addEventListener('input', function (e) {
        const index = e.target.getAttribute('data-index');
        const product = filteredProducts[index];
        product.name = e.target.value;

        const id = product.id;

        axios.put(`http://localhost:5000/products/updateproduct/${id}`, product)
            .then(response => {
                console.log('Product name updated:', response.data);
            })
            .catch(error => {
                console.error('Error updating product name:', error);
            });
    });
});

// Price change event listeners
const priceInputs = document.querySelectorAll('.product-price');
priceInputs.forEach(input => {
    input.addEventListener('input', function (e) {
        const index = e.target.getAttribute('data-index');
        const product = filteredProducts[index];
        product.price = parseFloat(e.target.value);

        const id = product.id;

        axios.put(`http://localhost:5000/products/updateproduct/${id}`, product)
            .then(response => {
                console.log('Product price updated:', response.data);
                renderInventory(filteredProducts); // Re-render to update total value
            })
            .catch(error => {
                console.error('Error updating product price:', error);
            });
    });
});

    }

    // Event listener for search input
    searchProductInput.addEventListener('input', function () {
        const query = searchProductInput.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(query)
        );
        renderInventory(filteredProducts); // Re-render with filtered products
    });

    // Initial render of the inventory table (empty initially)
    fetchProducts();  // Fetch products from the backend when the page loads
});
