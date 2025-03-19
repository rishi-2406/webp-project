// Budget Controller
const BudgetCtrl = (function (StorageCtrl, UICtrl) {
  // Private variables
  let currentBudgets = [];
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let deleteBudgetId = null;
  let isEditing = false;

  // Default colors for budget categories
  const categoryColors = {
    Housing: "#4e73df",
    Food: "#1cc88a",
    Transportation: "#36b9cc",
    Utilities: "#f6c23e",
    Entertainment: "#e74a3b",
    Healthcare: "#fd7e14",
    Shopping: "#6f42c1",
    Education: "#20c9a6",
    "Personal Care": "#858796",
    Travel: "#5a5c69",
    Other: "#5a5c69",
  };

  // Format currency safely by ensuring the amount is a valid number.
  const formatCurrency = function (amount) {
    const num = parseFloat(amount) || 0;
    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  };

  // Format month and year
  const formatMonthYear = function (month, year) {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Get transactions for current month
  const getCurrentMonthTransactions = function () {
    const transactions = StorageCtrl.getTransactions();
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });
  };

  // Calculate total budget amount
  const calculateTotalBudget = function () {
    return currentBudgets.reduce((total, budget) => total + budget.amount, 0);
  };

  // Calculate total spent amount for current month
  const calculateTotalSpent = function () {
    const transactions = getCurrentMonthTransactions();
    return transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Calculate spent amount by category
  const calculateCategorySpent = function (category) {
    const transactions = getCurrentMonthTransactions();
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" && transaction.category === category
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Generate budget alerts
  const generateAlerts = function () {
    const alerts = [];

    // Check each budget category
    currentBudgets.forEach((budget) => {
      const spent = calculateCategorySpent(budget.category);
      const percentSpent = (spent / budget.amount) * 100;

      // Alert if over budget
      if (spent > budget.amount) {
        alerts.push({
          id: budget.id,
          category: budget.category,
          type: "danger",
          title: `${budget.category} Budget Exceeded`,
          message: `You've spent ₹${formatCurrency(
            spent
          )} of your ₹${formatCurrency(budget.amount)} budget for ${
            budget.category
          }.`,
          overspent: spent - budget.amount,
        });
      }
      // Warning if close to budget limit (90% or more)
      else if (percentSpent >= 90) {
        alerts.push({
          id: budget.id,
          category: budget.category,
          type: "warning",
          title: `${budget.category} Budget Almost Reached`,
          message: `You've used ${Math.round(percentSpent)}% of your ${
            budget.category
          } budget for this month.`,
          percentSpent: percentSpent,
        });
      }
    });

    // Check overall budget
    const totalBudget = calculateTotalBudget();
    const totalSpent = calculateTotalSpent();
    const overallPercentSpent = (totalSpent / totalBudget) * 100;

    if (totalSpent > totalBudget) {
      alerts.push({
        id: "overall",
        category: "Overall",
        type: "danger",
        title: "Overall Budget Exceeded",
        message: `You've spent ₹${formatCurrency(
          totalSpent
        )} of your ₹${formatCurrency(
          totalBudget
        )} total budget for this month.`,
        overspent: totalSpent - totalBudget,
      });
    } else if (overallPercentSpent >= 90) {
      alerts.push({
        id: "overall",
        category: "Overall",
        type: "warning",
        title: "Overall Budget Almost Reached",
        message: `You've used ${Math.round(
          overallPercentSpent
        )}% of your total budget for this month.`,
        percentSpent: overallPercentSpent,
      });
    }

    return alerts;
  };

  // Load budgets and update UI
  const loadBudgets = function () {
    // Get budgets from storage
    currentBudgets = StorageCtrl.getBudgets();

    // Update UI
    updateBudgetOverview();
    updateBudgetAllocation();
    updateBudgetTracking();
    updateBudgetAlerts();
  };

  // Update budget overview
  const updateBudgetOverview = function () {
    const totalBudget = calculateTotalBudget();
    const totalSpent = calculateTotalSpent();
    const remaining = totalBudget - totalSpent;
    const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Update month display
    document.getElementById("current-month").textContent = formatMonthYear(
      currentMonth,
      currentYear
    );

    // Update summary cards
    document.getElementById(
      "total-budget-amount"
    ).textContent = `₹${formatCurrency(totalBudget)}`;
    document.getElementById("spent-amount").textContent = `₹${formatCurrency(
      totalSpent
    )}`;
    document.getElementById(
      "remaining-amount"
    ).textContent = `₹${formatCurrency(remaining)}`;

    // Update progress bar
    const progressFill = document.getElementById("overall-progress");
    const progressPercentage = document.getElementById("overall-percentage");

    progressFill.style.width = `${Math.min(percentSpent, 100)}%`;
    progressPercentage.textContent = `${Math.round(percentSpent)}%`;

    // Update progress bar color based on percentage
    progressFill.className = "progress-fill";
    if (percentSpent >= 90) {
      progressFill.classList.add("danger");
    } else if (percentSpent >= 70) {
      progressFill.classList.add("warning");
    }
  };

  // Update budget allocation section
  const updateBudgetAllocation = function () {
    const budgetCategoriesList = document.getElementById(
      "budget-categories-list"
    );
    budgetCategoriesList.innerHTML = "";

    // If no budgets
    if (currentBudgets.length === 0) {
      budgetCategoriesList.innerHTML =
        '<p class="no-data">No budget categories set up yet. Add a category to get started.</p>';
      return;
    }

    // Add each budget category to the list
    currentBudgets.forEach((budget) => {
      const categoryItem = document.createElement("div");
      categoryItem.className = "budget-category-item";

      categoryItem.innerHTML = `
                  <div class="category-color" style="background-color: ${
                    budget.color || categoryColors[budget.category] || "#5a5c69"
                  }"></div>
                  <div class="category-name">${budget.category}</div>
                  <div class="category-amount">₹${formatCurrency(
                    budget.amount
                  )}</div>
                  <div class="category-actions">
                      <button class="category-btn edit-btn" data-id="${
                        budget.id
                      }">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button class="category-btn delete-btn" data-id="${
                        budget.id
                      }">
                          <i class="fas fa-trash"></i>
                      </button>
                  </div>
              `;

      budgetCategoriesList.appendChild(categoryItem);
    });

    // Create allocation chart data
    const chartData = {
      labels: currentBudgets.map((budget) => budget.category),
      values: currentBudgets.map((budget) => budget.amount),
      colors: currentBudgets.map(
        (budget) => budget.color || categoryColors[budget.category] || "#5a5c69"
      ),
    };

    // Initialize or update allocation chart
    initAllocationChart(chartData);
  };

  // Update budget tracking section
  const updateBudgetTracking = function () {
    const progressList = document.getElementById("category-progress-list");
    progressList.innerHTML = "";

    // If no budgets
    if (currentBudgets.length === 0) {
      progressList.innerHTML =
        '<p class="no-data">No budget categories set up yet. Add a category to get started.</p>';
      return;
    }

    // Prepare data for comparison chart
    const comparisonLabels = [];
    const budgetValues = [];
    const spentValues = [];

    // Add progress for each budget category
    currentBudgets.forEach((budget) => {
      const spent = calculateCategorySpent(budget.category);
      const percentSpent =
        budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      // Add to comparison chart data
      comparisonLabels.push(budget.category);
      budgetValues.push(budget.amount);
      spentValues.push(spent);

      // Create progress item
      const progressItem = document.createElement("div");
      progressItem.className = "category-progress-item";

      let statusClass = "good";
      let statusText = "On Track";

      if (percentSpent >= 100) {
        statusClass = "danger";
        statusText = "Over Budget";
      } else if (percentSpent >= 90) {
        statusClass = "warning";
        statusText = "Almost Reached";
      }

      progressItem.innerHTML = `
                  <div class="progress-item-header">
                      <div class="category-title">${budget.category}</div>
                      <div class="progress-values">
                          <span class="spent-value">₹${formatCurrency(
                            spent
                          )}</span> / ₹${formatCurrency(budget.amount)}
                      </div>
                  </div>
                  <div class="category-progress-bar">
                      <div class="category-progress-fill ${statusClass}" style="width: ${Math.min(
        percentSpent,
        100
      )}%"></div>
                  </div>
                  <div class="progress-status">
                      <div class="status-percentage">${Math.round(
                        percentSpent
                      )}% used</div>
                      <div class="status-label ${
                        percentSpent >= 100 ? "danger" : ""
                      }">${statusText}</div>
                  </div>
              `;

      progressList.appendChild(progressItem);
    });

    // Initialize or update comparison chart
    initComparisonChart(comparisonLabels, budgetValues, spentValues);
  };

  // Update budget alerts section
  const updateBudgetAlerts = function () {
    const alertsContainer = document.getElementById("alerts-container");
    const noAlertsMessage = document.getElementById("no-alerts-message");

    // Clear previous alerts
    alertsContainer.innerHTML = "";
    alertsContainer.appendChild(noAlertsMessage);

    // Generate alerts
    const alerts = generateAlerts();

    // If no alerts, show no alerts message
    if (alerts.length === 0) {
      noAlertsMessage.style.display = "flex";
      return;
    }

    // Hide no alerts message and show alerts
    noAlertsMessage.style.display = "none";

    // Add each alert to the container
    alerts.forEach((alert) => {
      const alertItem = document.createElement("div");
      alertItem.className = "alert-item";

      alertItem.innerHTML = `
                  <div class="alert-icon">
                      <i class="fas fa-exclamation-triangle"></i>
                  </div>
                  <div class="alert-content">
                      <div class="alert-title">${alert.title}</div>
                      <div class="alert-message">${alert.message}</div>
                  </div>
                  <div class="alert-actions">
                      <button class="alert-dismiss" data-id="${alert.id}">
                          <i class="fas fa-times"></i>
                      </button>
                  </div>
              `;

      alertsContainer.appendChild(alertItem);
    });
  };

  // Initialize allocation chart
  const initAllocationChart = function (data) {
    const ctx = document.getElementById("allocation-chart").getContext("2d");

    // Destroy existing chart if it exists
    if (window.allocationChart) {
      window.allocationChart.destroy();
    }

    // Create new chart
    window.allocationChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: data.colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              padding: 15,
            },
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
  };

  // Initialize comparison chart
  const initComparisonChart = function (labels, budgetValues, spentValues) {
    const ctx = document.getElementById("comparison-chart").getContext("2d");

    // Destroy existing chart if it exists
    if (window.comparisonChart) {
      window.comparisonChart.destroy();
    }

    // Create new chart
    window.comparisonChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Budget",
            data: budgetValues,
            backgroundColor: "rgba(78, 115, 223, 0.7)",
            borderColor: "rgba(78, 115, 223, 1)",
            borderWidth: 1,
          },
          {
            label: "Spent",
            data: spentValues,
            backgroundColor: "rgba(231, 74, 59, 0.7)",
            borderColor: "rgba(231, 74, 59, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "₹" + value.toLocaleString();
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || "";
                const value = context.raw || 0;
                return `${label}: ₹${formatCurrency(value)}`;
              },
            },
          },
        },
      },
    });
  };

  // Show budget modal
  const showBudgetModal = function (isEdit = false) {
    const modal = document.getElementById("budget-modal");
    const modalTitle = document.getElementById("budget-form-title");

    isEditing = isEdit;

    if (isEdit) {
      modalTitle.textContent = "Edit Budget Category";
    } else {
      modalTitle.textContent = "Add Budget Category";
      resetBudgetForm();
    }

    modal.style.display = "block";
  };

  // Hide budget modal
  const hideBudgetModal = function () {
    const modal = document.getElementById("budget-modal");
    modal.style.display = "none";
  };

  // Show confirmation modal
  const showConfirmModal = function (budgetId) {
    const modal = document.getElementById("confirm-modal");
    deleteBudgetId = budgetId;
    modal.style.display = "block";
  };

  // Hide confirmation modal
  const hideConfirmModal = function () {
    const modal = document.getElementById("confirm-modal");
    modal.style.display = "none";
    deleteBudgetId = null;
  };

  // Reset budget form
  const resetBudgetForm = function () {
    document.getElementById("budget-form").reset();
    document.getElementById("budget-id").value = "";
    document.getElementById("budget-color").value = "#4e73df";
    populateCategoryOptions();
  };

  // Populate category options
  const populateCategoryOptions = function () {
    const categorySelect = document.getElementById("budget-category");
    categorySelect.innerHTML = "";

    // Get all expense categories
    const expenseCategories = Object.keys(categoryColors);

    // Add each category as an option
    expenseCategories.forEach((category) => {
      // Skip if already has a budget
      if (
        !isEditing &&
        currentBudgets.some((budget) => budget.category === category)
      ) {
        return;
      }

      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    // Add custom option
    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "-- Add Custom Category --";
    categorySelect.appendChild(customOption);
  };

  // Fill form with budget data
  const fillBudgetForm = function (budget) {
    document.getElementById("budget-id").value = budget.id;
    document.getElementById("budget-amount").value = budget.amount;
    document.getElementById("budget-notes").value = budget.notes || "";
    document.getElementById("budget-color").value =
      budget.color || categoryColors[budget.category] || "#4e73df";

    populateCategoryOptions();
    document.getElementById("budget-category").value = budget.category;
  };

  // Get form data
  const getFormData = function () {
    const id = document.getElementById("budget-id").value;
    const category = document.getElementById("budget-category").value;
    const amount = parseFloat(document.getElementById("budget-amount").value);
    const color = document.getElementById("budget-color").value;
    const notes = document.getElementById("budget-notes").value;

    return {
      id: id ? parseInt(id) : null,
      category,
      amount,
      color,
      notes,
    };
  };

  // Save budget
  const saveBudget = function (e) {
    e.preventDefault();

    // Get form data
    const formData = getFormData();

    // Validate form
    if (
      formData.category === "" ||
      formData.category === "custom" ||
      isNaN(formData.amount) ||
      formData.amount <= 0
    ) {
      alert("Please fill in all required fields with valid values.");
      return;
    }

    if (isEditing) {
      // Update existing budget
      const updatedBudget = {
        id: formData.id,
        category: formData.category,
        amount: formData.amount,
        color: formData.color,
        notes: formData.notes,
      };

      // Update in storage
      StorageCtrl.updateBudget(updatedBudget);
    } else {
      // Create new budget
      const newBudget = {
        id:
          currentBudgets.length > 0
            ? Math.max(...currentBudgets.map((b) => b.id)) + 1
            : 1,
        category: formData.category,
        amount: formData.amount,
        color: formData.color,
        notes: formData.notes,
      };

      // Add to storage
      StorageCtrl.addBudget(newBudget);
    }

    // Hide modal
    hideBudgetModal();

    // Reload budgets
    loadBudgets();
  };

  // Delete budget
  const deleteBudget = function () {
    if (deleteBudgetId) {
      // Delete from storage
      StorageCtrl.deleteBudget(deleteBudgetId);

      // Hide confirmation modal
      hideConfirmModal();

      // Reload budgets
      loadBudgets();
    }
  };

  // Set up event listeners
  const setupEventListeners = function () {
    // Month navigation
    document
      .getElementById("prev-month")
      .addEventListener("click", function () {
        if (currentMonth === 0) {
          currentMonth = 11;
          currentYear--;
        } else {
          currentMonth--;
        }
        loadBudgets();
      });

    document
      .getElementById("next-month")
      .addEventListener("click", function () {
        if (currentMonth === 11) {
          currentMonth = 0;
          currentYear++;
        } else {
          currentMonth++;
        }
        loadBudgets();
      });

    // Add budget button
    document
      .getElementById("add-budget-btn")
      .addEventListener("click", function () {
        showBudgetModal(false);
      });

    // Save budget
    document
      .getElementById("budget-form")
      .addEventListener("submit", saveBudget);

    // Cancel budget
    document
      .getElementById("cancel-budget")
      .addEventListener("click", hideBudgetModal);

    // Close modals
    document.querySelectorAll(".close-modal").forEach((closeBtn) => {
      closeBtn.addEventListener("click", function () {
        hideBudgetModal();
        hideConfirmModal();
      });
    });

    // View toggle
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        // Remove active class from all buttons
        document
          .querySelectorAll(".toggle-btn")
          .forEach((b) => b.classList.remove("active"));

        // Add active class to clicked button
        this.classList.add("active");

        // Hide all views
        document
          .querySelectorAll(".view-content")
          .forEach((view) => view.classList.remove("active"));

        // Show selected view
        const viewId = this.dataset.view + "-view";
        document.getElementById(viewId).classList.add("active");
      });
    });

    // Edit budget
    document.addEventListener("click", function (e) {
      if (e.target.closest(".edit-btn")) {
        const budgetId = parseInt(e.target.closest(".edit-btn").dataset.id);
        const budget = currentBudgets.find((b) => b.id === budgetId);

        if (budget) {
          fillBudgetForm(budget);
          showBudgetModal(true);
        }
      }
    });

    // Delete budget
    document.addEventListener("click", function (e) {
      if (e.target.closest(".delete-btn")) {
        const budgetId = parseInt(e.target.closest(".delete-btn").dataset.id);
        showConfirmModal(budgetId);
      }
    });

    // Confirm delete
    document
      .getElementById("confirm-delete")
      .addEventListener("click", deleteBudget);

    // Cancel delete
    document
      .getElementById("cancel-delete")
      .addEventListener("click", hideConfirmModal);

    // Dismiss alert
    document.addEventListener("click", function (e) {
      if (e.target.closest(".alert-dismiss")) {
        const alertItem = e.target.closest(".alert-item");
        alertItem.style.display = "none";
      }
    });

    // Category select change
    document
      .getElementById("budget-category")
      .addEventListener("change", function () {
        if (this.value === "custom") {
          const customCategory = prompt("Enter custom category name:");
          if (customCategory && customCategory.trim() !== "") {
            // Add new option
            const option = document.createElement("option");
            option.value = customCategory.trim();
            option.textContent = customCategory.trim();

            // Insert before custom option
            const customOption = this.querySelector('option[value="custom"]');
            this.insertBefore(option, customOption);

            // Select new option
            this.value = customCategory.trim();
          } else {
            // If canceled or empty, revert to first option
            this.selectedIndex = 0;
          }
        }
      });
  };

  // Public methods
  return {
    init: function () {
      // Set current date in header
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      document.getElementById("current-date").textContent =
        now.toLocaleDateString("en-US", options);

      // Set up event listeners
      setupEventListeners();

      // Load budgets
      loadBudgets();
    },
  };
})(StorageCtrl, UICtrl);

// Update StorageCtrl with additional methods for budget page
StorageCtrl.getBudgets = function () {
  let budgets;
  if (localStorage.getItem("budgets") === null) {
    budgets = [];
  } else {
    budgets = JSON.parse(localStorage.getItem("budgets"));
  }
  return budgets;
};

StorageCtrl.addBudget = function (budget) {
  let budgets = this.getBudgets();
  budgets.push(budget);
  localStorage.setItem("budgets", JSON.stringify(budgets));
};

StorageCtrl.updateBudget = function (updatedBudget) {
  let budgets = this.getBudgets();
  const index = budgets.findIndex((b) => b.id === updatedBudget.id);

  if (index !== -1) {
    budgets[index] = updatedBudget;
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }
};

StorageCtrl.deleteBudget = function (id) {
  let budgets = this.getBudgets();
  const filteredBudgets = budgets.filter((b) => b.id !== id);
  localStorage.setItem("budgets", JSON.stringify(filteredBudgets));
};

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", BudgetCtrl.init);
