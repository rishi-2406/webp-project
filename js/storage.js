// Storage Controller
const StorageCtrl = (function() {
    // Private methods and variables
    
    // Public methods
    return {
        // Initialize storage with default data if empty
        initStorage: function() {
            if (localStorage.getItem('transactions') === null) {
                // Create sample transactions
                const sampleTransactions = [
                    {
                        id: 1,
                        description: 'Salary',
                        amount: 50000,
                        type: 'income',
                        category: 'Salary',
                        date: new Date(2025, 2, 15) // March 15, 2025
                    },
                    {
                        id: 2,
                        description: 'Rent',
                        amount: 15000,
                        type: 'expense',
                        category: 'Housing',
                        date: new Date(2025, 2, 5) // March 5, 2025
                    },
                    {
                        id: 3,
                        description: 'Groceries',
                        amount: 3500,
                        type: 'expense',
                        category: 'Food',
                        date: new Date(2025, 2, 10) // March 10, 2025
                    },
                    {
                        id: 4,
                        description: 'Freelance Work',
                        amount: 10000,
                        type: 'income',
                        category: 'Other',
                        date: new Date(2025, 2, 18) // March 18, 2025
                    },
                    {
                        id: 5,
                        description: 'Dining Out',
                        amount: 2000,
                        type: 'expense',
                        category: 'Food',
                        date: new Date(2025, 2, 19) // March 19, 2025
                    }
                ];
                
                localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
            }
            
            if (localStorage.getItem('budgets') === null) {
                // Create sample budgets
                const sampleBudgets = [
                    {
                        id: 1,
                        category: 'Housing',
                        limit: 20000
                    },
                    {
                        id: 2,
                        category: 'Food',
                        limit: 8000
                    },
                    {
                        id: 3,
                        category: 'Transportation',
                        limit: 5000
                    },
                    {
                        id: 4,
                        category: 'Entertainment',
                        limit: 3000
                    }
                ];
                
                localStorage.setItem('budgets', JSON.stringify(sampleBudgets));
            }
        },
        
        // Get all transactions
        getTransactions: function() {
            let transactions;
            if (localStorage.getItem('transactions') === null) {
                transactions = [];
            } else {
                transactions = JSON.parse(localStorage.getItem('transactions'));
            }
            return transactions;
        },
        
        // Get transactions for a specific month and year
        getTransactionsByMonth: function(month, year) {
            const transactions = this.getTransactions();
            return transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
            });
        },
        
        // Get all budgets
        getBudgets: function() {
            let budgets;
            if (localStorage.getItem('budgets') === null) {
                budgets = [];
            } else {
                budgets = JSON.parse(localStorage.getItem('budgets'));
            }
            return budgets;
        }
    };
})();
