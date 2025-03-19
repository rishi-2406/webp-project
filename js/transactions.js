// Transactions Controller
const TransactionsCtrl = (function(StorageCtrl, UICtrl) {
    // Private variables
    let currentTransactions = [];
    let filteredTransactions = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentSort = { field: 'date', direction: 'desc' };
    let deleteTransactionId = null;
    let isEditing = false;
    
    // Income and expense categories
    const incomeCategories = [
        'Salary', 'Bonus', 'Investment', 'Freelance', 'Gift', 'Refund', 'Other'
    ];
    
    const expenseCategories = [
        'Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 
        'Healthcare', 'Shopping', 'Education', 'Personal Care', 'Travel', 'Other'
    ];
    
    // Format currency
    const formatCurrency = function(amount) {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };
    
    // Format date for display
    const formatDateForDisplay = function(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    // Format date for input
    const formatDateForInput = function(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };
    
    // Get today's date formatted for input
    const getTodayForInput = function() {
        return new Date().toISOString().split('T')[0];
    };
    
    // Load all transactions
    const loadTransactions = function() {
        // Get transactions from storage
        currentTransactions = StorageCtrl.getTransactions();
        
        // Apply current filters and sorting
        applyFiltersAndSort();
        
        // Update UI
        updateTransactionList();
        updateSummary();
    };
    
    // Apply filters and sorting
    const applyFiltersAndSort = function() {
        // Get filter values
        const searchText = document.getElementById('search-transactions').value.toLowerCase();
        const typeFilter = document.getElementById('filter-type').value;
        const categoryFilter = document.getElementById('filter-category').value;
        const dateFromFilter = document.getElementById('filter-date-from').value;
        const dateToFilter = document.getElementById('filter-date-to').value;
        
        // Filter transactions
        filteredTransactions = currentTransactions.filter(transaction => {
            // Search text filter
            const matchesSearch = 
                transaction.description.toLowerCase().includes(searchText) ||
                transaction.category.toLowerCase().includes(searchText);
            
            // Type filter
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
            
            // Category filter
            const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
            
            // Date range filter
            let matchesDateRange = true;
            
            if (dateFromFilter) {
                const transactionDate = new Date(transaction.date);
                const fromDate = new Date(dateFromFilter);
                matchesDateRange = transactionDate >= fromDate;
            }
            
            if (dateToFilter && matchesDateRange) {
                const transactionDate = new Date(transaction.date);
                const toDate = new Date(dateToFilter);
                // Set time to end of day
                toDate.setHours(23, 59, 59, 999);
                matchesDateRange = transactionDate <= toDate;
            }
            
            return matchesSearch && matchesType && matchesCategory && matchesDateRange;
        });
        
        // Sort transactions
        sortTransactions();
        
        // Reset to first page
        currentPage = 1;
    };
    
    // Sort transactions
    const sortTransactions = function() {
        filteredTransactions.sort((a, b) => {
            let aValue, bValue;
            
            // Get values based on sort field
            switch (currentSort.field) {
                case 'date':
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'category':
                    aValue = a.category;
                    bValue = b.category;
                    break;
                default:
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
            }
            
            // Compare based on direction
            if (currentSort.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    };
    
    // Update transaction list in UI
    const updateTransactionList = function() {
        const tableBody = document.getElementById('transactions-table-body');
        tableBody.innerHTML = '';
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
        
        // Update pagination UI
        document.getElementById('current-page-num').textContent = currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
        
        // If no transactions
        if (filteredTransactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="no-transactions">No transactions found</td>
            `;
            tableBody.appendChild(row);
            return;
        }
        
        // Add transactions to table
        for (let i = startIndex; i < endIndex; i++) {
            const transaction = filteredTransactions[i];
            const row = document.createElement('tr');
            
            // Format date
            const formattedDate = formatDateForDisplay(transaction.date);
            
            // Format amount
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td><span class="transaction-category">${transaction.category}</span></td>
                <td class="transaction-amount ${amountClass}">${amountPrefix} ₹${formatCurrency(transaction.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
        
        // Update transaction count
        document.getElementById('transaction-count').textContent = filteredTransactions.length;
    };
    
    // Update summary information
    const updateSummary = function() {
        // Calculate totals from filtered transactions
        let totalIncome = 0;
        let totalExpenses = 0;
        
        filteredTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpenses += transaction.amount;
            }
        });
        
        const balance = totalIncome - totalExpenses;
        
        // Update UI
        document.getElementById('summary-income').textContent = `₹${formatCurrency(totalIncome)}`;
        document.getElementById('summary-expenses').textContent = `₹${formatCurrency(totalExpenses)}`;
        document.getElementById('summary-balance').textContent = `₹${formatCurrency(balance)}`;
    };
    
    // Populate category options based on transaction type
    const populateCategoryOptions = function(type) {
        const categorySelect = document.getElementById('transaction-category');
        categorySelect.innerHTML = '';
        
        const categories = type === 'income' ? incomeCategories : expenseCategories;
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    };
    
    // Populate filter category options
    const populateFilterCategories = function() {
        const categoryFilter = document.getElementById('filter-category');
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        
        // Combine all categories
        const allCategories = [...incomeCategories, ...expenseCategories];
        
        // Remove duplicates
        const uniqueCategories = [...new Set(allCategories)].sort();
        
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    };
    
    // Show transaction modal
    const showTransactionModal = function(isEdit = false) {
        const modal = document.getElementById('transaction-modal');
        const modalTitle = document.getElementById('transaction-form-title');
        
        isEditing = isEdit;
        
        if (isEdit) {
            modalTitle.textContent = 'Edit Transaction';
        } else {
            modalTitle.textContent = 'Add New Transaction';
            resetTransactionForm();
        }
        
        modal.style.display = 'block';
    };
    
    // Hide transaction modal
    const hideTransactionModal = function() {
        const modal = document.getElementById('transaction-modal');
        modal.style.display = 'none';
    };
    
    // Show confirmation modal
    const showConfirmModal = function(transactionId) {
        const modal = document.getElementById('confirm-modal');
        deleteTransactionId = transactionId;
        modal.style.display = 'block';
    };
    
    // Hide confirmation modal
    const hideConfirmModal = function() {
        const modal = document.getElementById('confirm-modal');
        modal.style.display = 'none';
        deleteTransactionId = null;
    };
    
    // Reset transaction form
    const resetTransactionForm = function() {
        document.getElementById('transaction-form').reset();
        document.getElementById('transaction-id').value = '';
        document.getElementById('type-income').checked = true;
        document.getElementById('transaction-date').value = getTodayForInput();
        populateCategoryOptions('income');
    };
    
    // Fill form with transaction data
    const fillTransactionForm = function(transaction) {
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-date').value = formatDateForInput(transaction.date);
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-notes').value = transaction.notes || '';
        
        if (transaction.type === 'income') {
            document.getElementById('type-income').checked = true;
        } else {
            document.getElementById('type-expense').checked = true;
        }
        
        populateCategoryOptions(transaction.type);
        document.getElementById('transaction-category').value = transaction.category;
    };
    
    // Get form data
    const getFormData = function() {
        const id = document.getElementById('transaction-id').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const type = document.querySelector('input[name="transaction-type"]:checked').value;
        const category = document.getElementById('transaction-category').value;
        const notes = document.getElementById('transaction-notes').value;
        
        return {
            id: id ? parseInt(id) : null,
            amount,
            date,
            description,
            type,
            category,
            notes
        };
    };
    
    // Save transaction
    const saveTransaction = function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = getFormData();
        
        // Validate form
        if (formData.description === '' || isNaN(formData.amount) || formData.amount <= 0) {
            alert('Please fill in all required fields with valid values.');
            return;
        }
        
        if (isEditing) {
            // Update existing transaction
            const updatedTransaction = {
                id: formData.id,
                amount: formData.amount,
                date: formData.date,
                description: formData.description,
                type: formData.type,
                category: formData.category,
                notes: formData.notes
            };
            
            // Update in storage
            StorageCtrl.updateTransaction(updatedTransaction);
        } else {
            // Create new transaction
            const newTransaction = {
                id: currentTransactions.length > 0 ? Math.max(...currentTransactions.map(t => t.id)) + 1 : 1,
                amount: formData.amount,
                date: formData.date,
                description: formData.description,
                type: formData.type,
                category: formData.category,
                notes: formData.notes
            };
            
            // Add to storage
            StorageCtrl.addTransaction(newTransaction);
        }
        
        // Hide modal
        hideTransactionModal();
        
        // Reload transactions
        loadTransactions();
    };
    
    // Delete transaction
    const deleteTransaction = function() {
        if (deleteTransactionId) {
            // Delete from storage
            StorageCtrl.deleteTransaction(deleteTransactionId);
            
            // Hide confirmation modal
            hideConfirmModal();
            
            // Reload transactions
            loadTransactions();
        }
    };
    
    // Set up event listeners
    const setupEventListeners = function() {
        // Add transaction button
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            showTransactionModal(false);
        });
        
        // Transaction type change
        document.querySelectorAll('input[name="transaction-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                populateCategoryOptions(e.target.value);
            });
        });
        
        // Save transaction
        document.getElementById('transaction-form').addEventListener('submit', saveTransaction);
        
        // Cancel transaction
        document.getElementById('cancel-transaction').addEventListener('click', hideTransactionModal);
        
                // Close modals
                document.querySelectorAll('.close-modal').forEach(closeBtn => {
                    closeBtn.addEventListener('click', function() {
                        hideTransactionModal();
                        hideConfirmModal();
                    });
                });
                
                // Edit transaction
                document.addEventListener('click', function(e) {
                    if (e.target.closest('.edit-btn')) {
                        const transactionId = parseInt(e.target.closest('.edit-btn').dataset.id);
                        const transaction = currentTransactions.find(t => t.id === transactionId);
                        
                        if (transaction) {
                            fillTransactionForm(transaction);
                            showTransactionModal(true);
                        }
                    }
                });
                
                // Delete transaction
                document.addEventListener('click', function(e) {
                    if (e.target.closest('.delete-btn')) {
                        const transactionId = parseInt(e.target.closest('.delete-btn').dataset.id);
                        showConfirmModal(transactionId);
                    }
                });
                
                // Confirm delete
                document.getElementById('confirm-delete').addEventListener('click', deleteTransaction);
                
                // Cancel delete
                document.getElementById('cancel-delete').addEventListener('click', hideConfirmModal);
                
                // Apply filters
                document.getElementById('apply-filters').addEventListener('click', function() {
                    applyFiltersAndSort();
                    updateTransactionList();
                    updateSummary();
                });
                
                // Clear filters
                document.getElementById('clear-filters').addEventListener('click', function() {
                    document.getElementById('search-transactions').value = '';
                    document.getElementById('filter-type').value = 'all';
                    document.getElementById('filter-category').value = 'all';
                    document.getElementById('filter-date-from').value = '';
                    document.getElementById('filter-date-to').value = '';
                    
                    applyFiltersAndSort();
                    updateTransactionList();
                    updateSummary();
                });
                
                // Search input
                document.getElementById('search-transactions').addEventListener('input', function() {
                    applyFiltersAndSort();
                    updateTransactionList();
                    updateSummary();
                });
                
                // Pagination
                document.getElementById('prev-page').addEventListener('click', function() {
                    if (currentPage > 1) {
                        currentPage--;
                        updateTransactionList();
                    }
                });
                
                document.getElementById('next-page').addEventListener('click', function() {
                    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
                    if (currentPage < totalPages) {
                        currentPage++;
                        updateTransactionList();
                    }
                });
                
                // Sorting
                document.querySelectorAll('.sortable').forEach(header => {
                    header.addEventListener('click', function() {
                        const field = this.dataset.sort;
                        
                        // Toggle direction if same field, otherwise default to desc
                        if (currentSort.field === field) {
                            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                        } else {
                            currentSort.field = field;
                            currentSort.direction = 'desc';
                        }
                        
                        // Update sort indicators
                        document.querySelectorAll('.sortable').forEach(h => {
                            h.classList.remove('sorted-asc', 'sorted-desc');
                        });
                        
                        this.classList.add(`sorted-${currentSort.direction}`);
                        
                        // Apply sort and update list
                        sortTransactions();
                        updateTransactionList();
                    });
                });
            };
            
            // Public methods
            return {
                init: function() {
                    // Set current date in header
                    const now = new Date();
                    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
                    
                    // Populate category filters
                    populateFilterCategories();
                    
                    // Set up event listeners
                    setupEventListeners();
                    
                    // Load transactions
                    loadTransactions();
                }
            };
        })(StorageCtrl, UICtrl);
        
        // Update StorageCtrl with additional methods for transactions page
        StorageCtrl.addTransaction = function(transaction) {
            let transactions = this.getTransactions();
            transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
        };
        
        StorageCtrl.updateTransaction = function(updatedTransaction) {
            let transactions = this.getTransactions();
            const index = transactions.findIndex(t => t.id === updatedTransaction.id);
            
            if (index !== -1) {
                transactions[index] = updatedTransaction;
                localStorage.setItem('transactions', JSON.stringify(transactions));
            }
        };
        
        StorageCtrl.deleteTransaction = function(id) {
            let transactions = this.getTransactions();
            const filteredTransactions = transactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
        };
        
        // Initialize the application when the DOM is loaded
        document.addEventListener('DOMContentLoaded', TransactionsCtrl.init);
        
