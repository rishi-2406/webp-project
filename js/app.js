// App Controller
const App = (function(StorageCtrl, UICtrl) {
    // Initialize the application
    const init = function() {
        // Initialize local storage with sample data if empty
        StorageCtrl.initStorage();
        
        // Set current date in the header
        UICtrl.setCurrentDate();
        
        // Set current month in the month selector
        UICtrl.setCurrentMonth();
        
        // Load and display data
        loadDashboardData();
        
        // Set up event listeners
        setupEventListeners();
    };
    
    // Load all dashboard data
    const loadDashboardData = function() {
        // Get all transactions
        const transactions = StorageCtrl.getTransactions();
        
        // Calculate totals
        const totalIncome = transactions
            .filter(transaction => transaction.type === 'income')
            .reduce((total, transaction) => total + transaction.amount, 0);
            
        const totalExpenses = transactions
            .filter(transaction => transaction.type === 'expense')
            .reduce((total, transaction) => total + transaction.amount, 0);
            
        const totalBalance = totalIncome - totalExpenses;
        
        // Update balance overview
        UICtrl.updateBalanceOverview(totalBalance, totalIncome, totalExpenses);
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get transactions for current month
        const currentMonthTransactions = StorageCtrl.getTransactionsByMonth(currentMonth, currentYear);
        
        // Get income transactions for current month
        const currentMonthIncome = currentMonthTransactions.filter(transaction => transaction.type === 'income');
        
        // Get expense transactions for current month
        const currentMonthExpenses = currentMonthTransactions.filter(transaction => transaction.type === 'expense');
        
        // Calculate income by category
        const incomeByCategory = {
            salary: currentMonthIncome
                .filter(transaction => transaction.category === 'Salary')
                .reduce((total, transaction) => total + transaction.amount, 0),
            bonus: currentMonthIncome
                .filter(transaction => transaction.category === 'Bonus')
                .reduce((total, transaction) => total + transaction.amount, 0),
            investment: currentMonthIncome
                .filter(transaction => transaction.category === 'Investment')
                .reduce((total, transaction) => total + transaction.amount, 0),
            other: currentMonthIncome
                .filter(transaction => transaction.category !== 'Salary' && 
                                       transaction.category !== 'Bonus' && 
                                       transaction.category !== 'Investment')
                .reduce((total, transaction) => total + transaction.amount, 0)
        };
        
        // Update income insights
        UICtrl.updateIncomeInsights(incomeByCategory);
        
        // Populate recent transactions
        UICtrl.populateRecentTransactions(transactions);
        
        // Get budgets
        const budgets = StorageCtrl.getBudgets();
        
        // Update budget progress
        UICtrl.updateBudgetProgress(budgets, currentMonthExpenses);
        
        // Update financial health indicators
        const currentMonthTotalIncome = currentMonthIncome.reduce((total, transaction) => total + transaction.amount, 0);
        const currentMonthTotalExpenses = currentMonthExpenses.reduce((total, transaction) => total + transaction.amount, 0);
        UICtrl.updateFinancialHealth(currentMonthTotalIncome, currentMonthTotalExpenses);
        
        // Calculate expense categories and amounts for chart
        const expenseCategories = [];
        const expenseAmounts = [];
        
        // Group expenses by category
        const expensesByCategory = currentMonthExpenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {});
        
        // Convert to arrays for chart
        for (const category in expensesByCategory) {
            expenseCategories.push(category);
            expenseAmounts.push(expensesByCategory[category]);
        }
        
        // Initialize expense breakdown chart
        UICtrl.initExpenseChart(expenseCategories, expenseAmounts);
        
        // Sample data for mini charts (would be calculated from historical data in a real app)
        const incomeTrend = [45000, 48000, 52000, 49000, 53000, 60000];
        const expenseTrend = [30000, 32000, 35000, 31000, 34000, 38000];
        
        // Initialize mini charts
        UICtrl.initMiniCharts(incomeTrend, expenseTrend);
    };
    
    // Set up event listeners
    const setupEventListeners = function() {
        // Month selector change event
        document.getElementById('month-selector').addEventListener('change', function(e) {
            // In a real app, this would update the dashboard data for the selected month
            // For this demo, we'll just reload the current data
            loadDashboardData();
        });
    };
    
    // Return public methods
    return {
        init: init
    };
})(StorageCtrl, UICtrl);

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);


