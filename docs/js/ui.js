// UI Controller
const UICtrl = (function () {
  // Private variables and methods

  // Updated formatCurrency: converts the amount to a number, defaulting to 0 if invalid.
const formatCurrency = function(amount) {
    // Check if amount is undefined or not a number
    if (amount === undefined || isNaN(amount)) {
        return "0.00";
    }
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

  const formatDate = function (dateString) {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  // Public methods
  return {
    // Update balance overview section
    updateBalanceOverview: function (totalBalance, totalIncome, totalExpenses) {
      document.getElementById("total-balance").textContent =
        formatCurrency(totalBalance);
      document.getElementById("total-income").textContent =
        formatCurrency(totalIncome);
      document.getElementById("total-expenses").textContent =
        formatCurrency(totalExpenses);

      // Update balance trend
      document.getElementById("balance-trend-percentage").textContent = "5%";
      document.getElementById("trend-icon").className = "fas fa-arrow-up";
    },

    // Update income insights section
    updateIncomeInsights: function (incomeData) {
      document.getElementById("salary-amount").textContent = formatCurrency(
        incomeData.salary
      );
      document.getElementById("bonus-amount").textContent = formatCurrency(
        incomeData.bonus
      );
      document.getElementById("investment-amount").textContent = formatCurrency(
        incomeData.investment
      );
      document.getElementById("other-income-amount").textContent =
        formatCurrency(incomeData.other);

      const totalIncome =
        incomeData.salary +
        incomeData.bonus +
        incomeData.investment +
        incomeData.other;

      // Calculate and update percentages
      if (totalIncome > 0) {
        document.getElementById("salary-percentage").textContent =
          Math.round((incomeData.salary / totalIncome) * 100) + "%";
        document.getElementById("bonus-percentage").textContent =
          Math.round((incomeData.bonus / totalIncome) * 100) + "%";
        document.getElementById("investment-percentage").textContent =
          Math.round((incomeData.investment / totalIncome) * 100) + "%";
        document.getElementById("other-income-percentage").textContent =
          Math.round((incomeData.other / totalIncome) * 100) + "%";
      }
    },

    // Populate recent transactions list
    populateRecentTransactions: function (transactions) {
      const transactionList = document.getElementById(
        "recent-transactions-list"
      );
      transactionList.innerHTML = "";

      // Get the 5 most recent transactions
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      recentTransactions.forEach((transaction) => {
        const li = document.createElement("li");
        li.className = "transaction-item";

        const iconClass = transaction.type === "income" ? "income" : "expense";
        const iconName =
          transaction.type === "income" ? "arrow-down" : "arrow-up";

        li.innerHTML = `
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas fa-${iconName}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${transaction.category} • ${formatDate(
          transaction.date
        )}</p>
                    </div>
                    <div class="transaction-amount ${iconClass}">
                        ${
                          transaction.type === "income" ? "+" : "-"
                        } ₹${formatCurrency(transaction.amount)}
                    </div>
                `;

        transactionList.appendChild(li);
      });
    },

    // Update budget progress section
// In ui.js
updateBudgetProgress: function(budgets, currentMonthExpenses) {
    const budgetContainer = document.getElementById('budget-categories-container');
    budgetContainer.innerHTML = '';
    
    budgets.forEach(budget => {
        // Calculate total spent in this category
        const categoryExpenses = currentMonthExpenses
            .filter(expense => expense.category === budget.category)
            .reduce((total, expense) => {
                // Ensure expense.amount is a number
                const amount = parseFloat(expense.amount) || 0;
                return total + amount;
            }, 0);
        
        const percentSpent = (categoryExpenses / budget.amount) * 100;
        let statusClass = 'good';
        
        if (percentSpent >= 90) {
            statusClass = 'danger';
        } else if (percentSpent >= 70) {
            statusClass = 'warning';
        }
        
        const budgetElement = document.createElement('div');
        budgetElement.className = 'budget-category';
        budgetElement.innerHTML = `
            <div class="budget-category-header">
                <div class="budget-category-name">${budget.category}</div>
                <div class="budget-values">
                    <div class="budget-spent">₹${formatCurrency(categoryExpenses)}</div>
                    <div class="budget-limit">/ ₹${formatCurrency(budget.amount)}</div>
                </div>
            </div>
            <div class="budget-progress-bar">
                <div class="budget-progress-fill ${statusClass}" style="width: ${Math.min(percentSpent, 100)}%"></div>
            </div>
        `;
        
        budgetContainer.appendChild(budgetElement);
    });
},

    // Update financial health indicators
    updateFinancialHealth: function (income, expenses) {
      // Calculate savings rate
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      const savingsMeter = document.getElementById("savings-rate-meter");
      const savingsValue = document.getElementById("savings-rate-value");
      const savingsStatus = document.getElementById("savings-rate-status");

      savingsMeter.style.width = `${Math.min(savingsRate, 100)}%`;
      savingsValue.textContent = `${Math.round(savingsRate)}%`;

      if (savingsRate >= 20) {
        savingsStatus.textContent = "Excellent";
        savingsStatus.className = "health-status good";
      } else if (savingsRate >= 10) {
        savingsStatus.textContent = "Good";
        savingsStatus.className = "health-status good";
      } else {
        savingsStatus.textContent = "Needs Improvement";
        savingsStatus.className = "health-status warning";
      }

      // Set debt ratio (sample data for demonstration)
      document.getElementById("debt-ratio-meter").style.width = "30%";
      document.getElementById("debt-ratio-value").textContent = "30%";

      // Set emergency fund (sample data for demonstration)
      document.getElementById("emergency-fund-meter").style.width = "50%";
      document.getElementById("emergency-fund-value").textContent = "3 months";
    },

    // Initialize expense breakdown chart
    initExpenseChart: function (categories, amounts) {
      const ctx = document
        .getElementById("expense-breakdown-chart")
        .getContext("2d");

      return new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: categories,
          datasets: [
            {
              data: amounts,
              backgroundColor: [
                "#4e73df",
                "#1cc88a",
                "#36b9cc",
                "#f6c23e",
                "#e74a3b",
                "#858796",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "right",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ₹${formatCurrency(value)} (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    },

    // Initialize mini charts for income and expense
    initMiniCharts: function (incomeData, expenseData) {
      // Income mini chart
      const incomeCtx = document
        .getElementById("income-mini-chart")
        .getContext("2d");
      new Chart(incomeCtx, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Income",
              data: incomeData,
              borderColor: "#28a745",
              backgroundColor: "rgba(40, 167, 69, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              display: false,
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
        },
      });

      // Expense mini chart
      const expenseCtx = document
        .getElementById("expense-mini-chart")
        .getContext("2d");
      new Chart(expenseCtx, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Expenses",
              data: expenseData,
              borderColor: "#dc3545",
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              display: false,
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
        },
      });
    },

    // Set current date in the header
    setCurrentDate: function () {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      document.getElementById("current-date").textContent =
        now.toLocaleDateString("en-US", options);
    },

    // Set the month selector to current month
    setCurrentMonth: function () {
      const now = new Date();
      document.getElementById("month-selector").value = now
        .getMonth()
        .toString();
    },
  };
})();
