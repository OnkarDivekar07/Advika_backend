document.addEventListener('DOMContentLoaded', function() {
    const addItemButton = document.getElementById('addItem');
    const itemsTable = document.getElementById('itemsTable').getElementsByTagName('tbody')[0];
    const totalAmountElement = document.getElementById('totalAmount');
    const submitButton = document.getElementById('submitButton'); // Reference to Submit Button

    // New elements to display the aggregated data (daily & monthly profits and sales)
    const dailyProfitElement = document.getElementById('dailyProfit');
    const dailySalesElement = document.getElementById('dailySales');
    const monthlyProfitElement = document.getElementById('monthlyProfit');
    const monthlySalesElement = document.getElementById('monthlySales');

    // Function to calculate the total price for each row
    function calculateTotal(row) {
        const quantity = row.querySelector('.quantity').value;
        const price = row.querySelector('.price').value;
        const total = quantity * price;
        row.querySelector('.total').value = total.toFixed(2);
        updateTotalAmount();
    }

    // Function to update the grand total
    function updateTotalAmount() {
        let totalAmount = 0;
        const rows = document.querySelectorAll('.item-row');
        rows.forEach(row => {
            const rowTotal = parseFloat(row.querySelector('.total').value) || 0;
            totalAmount += rowTotal;
        });
        totalAmountElement.textContent = totalAmount.toFixed(2);
    }

    // Event listener for adding new item rows
    addItemButton.addEventListener('click', function() {
        const newRow = document.createElement('tr');
        newRow.classList.add('item-row');
        newRow.innerHTML = `
            <td><input type="text" name="item_name[]" list="productList" class="form-control" placeholder="Item Name" required></td>
            <td><input type="number" name="quantity[]" class="form-control quantity" min="1" value="1" required></td>
            <td><input type="number" name="price[]" class="form-control price" min="0" value="0" required></td>
            <td><input type="number" name="total[]" class="form-control total" value="0" readonly></td>
            <td><button type="button" class="btn btn-danger remove-item">Remove</button></td>
        `;
        itemsTable.appendChild(newRow);

        // Attach event listeners for the new row
        newRow.querySelector('.quantity').addEventListener('input', function() {
            calculateTotal(newRow);
        });
        newRow.querySelector('.price').addEventListener('input', function() {
            calculateTotal(newRow);
        });
        newRow.querySelector('.remove-item').addEventListener('click', function() {
            newRow.remove();
            updateTotalAmount();
        });

        // Recalculate totals
        calculateTotal(newRow);
    });

    // Event listener for removing item rows
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-item')) {
            const row = event.target.closest('tr');
            row.remove();
            updateTotalAmount();
        }
    });

    // Initial setup for existing rows (if any)
    document.querySelectorAll('.item-row').forEach(row => {
        row.querySelector('.quantity').addEventListener('input', function() {
            calculateTotal(row);
        });
        row.querySelector('.price').addEventListener('input', function() {
            calculateTotal(row);
        });
        calculateTotal(row);
    });

    // Function to fetch and display the daily and monthly profit/sales using the showall API
    function fetchAggregatedData() {
        axios.get('http://localhost:5000/transactions/showall')
            .then(response => {
                const data = response.data; // { dailyProfit, dailySales, monthlyProfit, monthlySales }

                // Display the aggregated data in the appropriate fields
                if (data.dailyProfit && data.dailySales && data.monthlyProfit && data.monthlySales) {
                    dailyProfitElement.textContent = `$${parseFloat(data.dailyProfit).toFixed(2)}`;
                    dailySalesElement.textContent = `$${parseFloat(data.dailySales).toFixed(2)}`;
                    monthlyProfitElement.textContent = `$${parseFloat(data.monthlyProfit).toFixed(2)}`;
                    monthlySalesElement.textContent = `$${parseFloat(data.monthlySales).toFixed(2)}`;
                }
            })
            .catch(error => {
                console.error('Error fetching aggregated data:', error);
                alert('Error fetching daily and monthly data.');
            });
    }

    // Fetch and display the aggregated data when the page loads
    fetchAggregatedData();

    // Event listener for the Submit Button
    submitButton.addEventListener('click', function() {
        // Collect billing data
        const billingData = [];
        const rows = document.querySelectorAll('.item-row');

        rows.forEach(row => {
            const itemName = row.querySelector('input[name="item_name[]"]').value;
            const quantity = row.querySelector('input[name="quantity[]"]').value;
            const price = row.querySelector('input[name="price[]"]').value;
            const total = row.querySelector('input[name="total[]"]').value;
        
            billingData.push({
                item_name: itemName,
                quantity: quantity,
                price: price,
                total: total
            });
        });
        // Add total amount to the billing data
        const totalAmount = parseFloat(totalAmountElement.textContent);
        billingData.push({ total_amount: totalAmount.toFixed(2) });

        // Send data to the server via POST request using Axios
        axios.post('http://localhost:5000/transactions/billingTranction', billingData)
            .then(response => {
                // Handle successful response
                alert('Transaction successfully submitted!');
              // Log the server's response (for debugging)
            })
            .catch(error => {
                // Handle error
                const errorMessage = error?.response?.data?.details || 'Something went wrong.';
                alert(errorMessage);
            });
    });
});




function fetchProductList() {
    axios.get('http://localhost:5000/products/getproduct')
        .then(response => {
            const productList = response.data; // Array of product objects
            const productListElement = document.getElementById('productList');
            productListElement.innerHTML = ''; // Clear the datalist

            // Check if we received valid data
            if (Array.isArray(productList) && productList.length > 0) {
                productList.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.name; // Assuming the product object has a "name" field
                    productListElement.appendChild(option);
                });
            } else {
                console.error("No products found or invalid data structure.");
            }
        })
        .catch(error => {
            console.error('Error fetching product list:', error);
            alert('Error fetching product list.');
        });
}

// Fetch and display the products when the page loads
fetchProductList();
document.addEventListener('DOMContentLoaded', function () {
    const customerCountElement = document.getElementById('customerCount');
    const increaseCustomerButton = document.getElementById('increaseCustomer');
    const decreaseCustomerButton = document.getElementById('decreaseCustomer');

    // Function to fetch current customer count
    function fetchCustomerCount() {
        axios.get('http://localhost:5000/customers/count')
            .then(response => {
                customerCountElement.textContent = response.data.count;
            })
            .catch(error => {
                console.error('Error fetching customer count:', error);
            });
    }

    // Function to update customer count
    function updateCustomerCount(change) {
        axios.post('http://localhost:5000/customers/update', { change: change })
            .then(response => {
                customerCountElement.textContent = response.data.count;
            })
            .catch(error => {
                console.error('Error updating customer count:', error);
            });
    }

    // Event Listeners
    increaseCustomerButton.addEventListener('click', function () {
        updateCustomerCount(1);
    });

    decreaseCustomerButton.addEventListener('click', function () {
        updateCustomerCount(-1);
    });

    // Fetch customer count on page load
    fetchCustomerCount();
});



document.getElementById('sendStockEmail').addEventListener('click', function() {
    axios.post('http://localhost:5000/sendemail/email')
        .then(function (response) {
            alert('Stock email sent successfully!');
        })
        .catch(function (error) {
            console.error(error);
            alert('Failed to send stock email.');
        });
});

