// Reports Controller
const ReportsCtrl = (function (StorageCtrl, UICtrl) {
  // Private variables
  let transactions = [];
  let filteredTransactions = [];
  let startDate = null;
  let endDate = null;
  let incomeExpenseChart = null;
  let categoryChart = null;
  let trendsChart = null;
  let incomeSourcesChart = null;

  // Chart colors
  const chartColors = [
    "#4e73df",
    "#1cc88a",
    "#36b9cc",
    "#f6c23e",
    "#e74a3b",
    "#fd7e14",
    "#6f42c1",
    "#20c9a6",
    "#858796",
    "#5a5c69",
    "#4e73df",
    "#1cc88a",
    "#36b9cc",
    "#f6c23e",
    "#e74a3b",
  ];

  // Format currency
  const formatCurrency = function (amount) {
    // Check if amount is undefined or not a number
    if (amount === undefined || isNaN(amount)) {
      return "0.00";
    }
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  };

  // Format date
  const formatDate = function (dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format month
  const formatMonth = function (date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // Set date range based on period
  const setDateRange = function (period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case "month":
        // This month
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
      case "quarter":
        // Last 3 months
        startDate = new Date(currentYear, currentMonth - 2, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
      case "halfyear":
        // Last 6 months
        startDate = new Date(currentYear, currentMonth - 5, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
      case "year":
        // This year
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        break;
      case "custom":
        // Custom range - already set by date inputs
        break;
      default:
        // Default to this month
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
    }
  };

  // Filter transactions by date range
  const filterTransactionsByDate = function () {
    filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // Calculate financial summary
  const calculateFinancialSummary = function () {
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += parseFloat(transaction.amount);
      } else if (transaction.type === "expense") {
        totalExpenses += parseFloat(transaction.amount);
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      income: totalIncome,
      expenses: totalExpenses,
      savings: netSavings,
      savingsRate: savingsRate,
    };
  };

  // Calculate expenses by category
  const calculateExpensesByCategory = function () {
    const expensesByCategory = {};

    // Filter for expense transactions
    const expenseTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === "expense"
    );

    // Group by category
    expenseTransactions.forEach((transaction) => {
      const category = transaction.category || "Uncategorized";
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += parseFloat(transaction.amount);
    });

    // Convert to array of objects for easier sorting
    const categoriesArray = Object.keys(expensesByCategory).map((category) => {
      return {
        category: category,
        amount: expensesByCategory[category],
      };
    });

    // Sort by amount (descending)
    categoriesArray.sort((a, b) => b.amount - a.amount);

    return categoriesArray;
  };

  // Calculate income by source
  const calculateIncomeBySource = function () {
    const incomeBySource = {};

    // Filter for income transactions
    const incomeTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === "income"
    );

    // Group by category (source)
    incomeTransactions.forEach((transaction) => {
      const source = transaction.category || "Other";
      if (!incomeBySource[source]) {
        incomeBySource[source] = 0;
      }
      incomeBySource[source] += parseFloat(transaction.amount);
    });

    // Convert to array of objects for easier sorting
    const sourcesArray = Object.keys(incomeBySource).map((source) => {
      return {
        source: source,
        amount: incomeBySource[source],
      };
    });

    // Sort by amount (descending)
    sourcesArray.sort((a, b) => b.amount - a.amount);

    return sourcesArray;
  };

  // Calculate monthly trends
  const calculateMonthlyTrends = function () {
    // Determine number of months to show
    const months = [];
    const incomeData = [];
    const expenseData = [];

    // Create a copy of start date
    let currentDate = new Date(startDate);

    // Set to first day of month
    currentDate.setDate(1);

    // Loop through each month in the range
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Add month label
      months.push(formatMonth(currentDate));

      // Filter transactions for this month
      const monthTransactions = filteredTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === month
        );
      });

      // Calculate income and expenses for this month
      let monthlyIncome = 0;
      let monthlyExpense = 0;

      monthTransactions.forEach((transaction) => {
        if (transaction.type === "income") {
          monthlyIncome += parseFloat(transaction.amount);
        } else if (transaction.type === "expense") {
          monthlyExpense += parseFloat(transaction.amount);
        }
      });

      // Add to data arrays
      incomeData.push(monthlyIncome);
      expenseData.push(monthlyExpense);

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      months: months,
      income: incomeData,
      expenses: expenseData,
    };
  };

  // Update financial summary UI
  const updateFinancialSummary = function () {
    const summary = calculateFinancialSummary();

    document.getElementById("summary-income").textContent = `₹${formatCurrency(
      summary.income
    )}`;
    document.getElementById(
      "summary-expenses"
    ).textContent = `₹${formatCurrency(summary.expenses)}`;
    document.getElementById("summary-savings").textContent = `₹${formatCurrency(
      summary.savings
    )}`;
    document.getElementById("summary-rate").textContent = `${Math.round(
      summary.savingsRate
    )}%`;

    // Set color for savings based on value
    const savingsElement = document.getElementById("summary-savings");
    if (summary.savings >= 0) {
      savingsElement.classList.add("income");
      savingsElement.classList.remove("expense");
    } else {
      savingsElement.classList.add("expense");
      savingsElement.classList.remove("income");
    }
  };

  // Update income vs expenses chart
  const updateIncomeVsExpensesChart = function () {
    const summary = calculateFinancialSummary();
    const ctx = document
      .getElementById("income-expense-chart")
      .getContext("2d");

    // Destroy existing chart if it exists
    if (incomeExpenseChart) {
      incomeExpenseChart.destroy();
    }

    // Create new chart
    incomeExpenseChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Income", "Expenses", "Savings"],
        datasets: [
          {
            data: [
              summary.income,
              summary.expenses,
              Math.max(0, summary.savings),
            ],
            backgroundColor: [
              "rgba(40, 167, 69, 0.7)", // Green for income
              "rgba(220, 53, 69, 0.7)", // Red for expenses
              "rgba(40, 140, 250, 0.7)", // Blue for savings
            ],
            borderColor: [
              "rgba(40, 167, 69, 1)",
              "rgba(220, 53, 69, 1)",
              "rgba(40, 140, 250, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `₹${formatCurrency(context.raw)}`;
              },
            },
          },
        },
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
      },
    });
  };

  // Update spending by category chart
  const updateCategoryChart = function () {
    const expensesByCategory = calculateExpensesByCategory();
    const ctx = document.getElementById("category-chart").getContext("2d");

    // Prepare data for chart
    const labels = expensesByCategory.map((item) => item.category);
    const data = expensesByCategory.map((item) => item.amount);
    const backgroundColors = chartColors.slice(0, labels.length);

    // Destroy existing chart if it exists
    if (categoryChart) {
      categoryChart.destroy();
    }

    // Create new chart
    categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
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
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ₹${formatCurrency(value)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    // Update category legend
    updateCategoryLegend(expensesByCategory, backgroundColors);
  };

  // Update category legend
  const updateCategoryLegend = function (expensesByCategory, colors) {
    const legendContainer = document.getElementById("category-legend");
    legendContainer.innerHTML = "";

    const totalExpenses = expensesByCategory.reduce(
      (total, item) => total + item.amount,
      0
    );

    expensesByCategory.forEach((item, index) => {
      const percentage =
        totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

      const legendItem = document.createElement("div");
      legendItem.className = "legend-item";
      legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${
                  colors[index]
                }"></div>
                <div class="legend-text">${item.category}</div>
                <div class="legend-value">₹${formatCurrency(item.amount)}</div>
            `;

      legendContainer.appendChild(legendItem);
    });
  };

  // Update monthly trends chart
  const updateTrendsChart = function () {
    const trendsData = calculateMonthlyTrends();
    const ctx = document.getElementById("trends-chart").getContext("2d");

    // Destroy existing chart if it exists
    if (trendsChart) {
      trendsChart.destroy();
    }

    // Create new chart
    trendsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: trendsData.months,
        datasets: [
          {
            label: "Income",
            data: trendsData.income,
            borderColor: "rgba(40, 167, 69, 1)",
            backgroundColor: "rgba(40, 167, 69, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: "Expenses",
            data: trendsData.expenses,
            borderColor: "rgba(220, 53, 69, 1)",
            backgroundColor: "rgba(220, 53, 69, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
      },
    });
  };

  // Update top expenses table
  const updateTopExpensesTable = function () {
    const expensesByCategory = calculateExpensesByCategory();
    const tableBody = document.getElementById("top-expenses-table");
    tableBody.innerHTML = "";

    const totalExpenses = expensesByCategory.reduce(
      (total, item) => total + item.amount,
      0
    );

    // Show top 5 categories
    const topCategories = expensesByCategory.slice(0, 5);

    topCategories.forEach((item) => {
      const percentage =
        totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${item.category}</td>
                <td>₹${formatCurrency(item.amount)}</td>
                <td>${Math.round(percentage)}%</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </td>
            `;

      tableBody.appendChild(row);
    });

    // If no expenses
    if (topCategories.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="4" style="text-align: center;">No expense data available</td>';
      tableBody.appendChild(row);
    }
  };

  // Update income sources
  const updateIncomeSources = function () {
    const incomeBySource = calculateIncomeBySource();
    const ctx = document
      .getElementById("income-sources-chart")
      .getContext("2d");

    // Prepare data for chart
    const labels = incomeBySource.map((item) => item.source);
    const data = incomeBySource.map((item) => item.amount);
    const backgroundColors = chartColors.slice(0, labels.length);

    // Destroy existing chart if it exists
    if (incomeSourcesChart) {
      incomeSourcesChart.destroy();
    }

    // Create new chart
    incomeSourcesChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ₹${formatCurrency(value)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    // Update income sources table
    updateIncomeSourcesTable(incomeBySource);
  };

  // Update income sources table
  const updateIncomeSourcesTable = function (incomeBySource) {
    const tableBody = document.getElementById("income-sources-table");
    tableBody.innerHTML = "";

    const totalIncome = incomeBySource.reduce(
      (total, item) => total + item.amount,
      0
    );

    incomeBySource.forEach((item) => {
      const percentage =
        totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${item.source}</td>
                <td>₹${formatCurrency(item.amount)}</td>
                <td>${Math.round(percentage)}%</td>
                `;
      tableBody.appendChild(row);
    });

    // If no income
    if (incomeBySource.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="3" style="text-align: center;">No income data available</td>';
      tableBody.appendChild(row);
    }
  };

  // Generate report
  const generateReport = function () {
    // Update all report sections
    updateFinancialSummary();
    updateIncomeVsExpensesChart();
    updateCategoryChart();
    updateTrendsChart();
    updateTopExpensesTable();
    updateIncomeSources();
  };

  // Export report as PDF
  const exportReportAsPDF = function () {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");
      const reportContent = document.getElementById("report-content");

      // Add title
      doc.setFontSize(18);
      doc.text("Financial Report", 105, 15, { align: "center" });

      // Add date range
      doc.setFontSize(12);
      doc.text(
        `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`,
        105,
        25,
        { align: "center" }
      );

      // Improved html2canvas options to reduce artifacts
      const options = {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Enable CORS for external resources
        allowTaint: true, // Allow tainted canvas
        backgroundColor: "#ffffff", // Ensure white background
        removeContainer: true, // Remove the cloned element
        logging: false, // Disable logging
        // Optimize shadow rendering
        onclone: (document) => {
          // Find all elements with box-shadow in the cloned document
          const elements = document.querySelectorAll(
            '[class*="card"], [class*="shadow"]'
          );
          elements.forEach((el) => {
            // Simplify or remove shadows for PDF export
            el.style.boxShadow = "none";
          });
        },
      };

      // Add report content with improved options
      html2canvas(reportContent, options).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 190;
        const pageHeight = 280; // Slightly reduced to avoid cutoffs
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 35;

        // Add first page
        doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save PDF with improved quality
        doc.save("financial-report.pdf");
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("An error occurred while exporting the report. Please try again.");
    }
  };

  // Set up event listeners
  const setupEventListeners = function () {
    // Period selector change
    document
      .getElementById("report-period")
      .addEventListener("change", function () {
        const period = this.value;
        const customRange = document.getElementById("custom-date-range");

        if (period === "custom") {
          customRange.classList.remove("hidden");
        } else {
          customRange.classList.add("hidden");
          setDateRange(period);
        }
      });

    // Generate report button
    document
      .getElementById("generate-report")
      .addEventListener("click", function () {
        const period = document.getElementById("report-period").value;

        if (period === "custom") {
          const fromDate = document.getElementById("date-from").value;
          const toDate = document.getElementById("date-to").value;

          if (!fromDate || !toDate) {
            alert("Please select both start and end dates.");
            return;
          }

          startDate = new Date(fromDate);
          endDate = new Date(toDate);

          // Set end date to end of day
          endDate.setHours(23, 59, 59, 999);

          if (startDate > endDate) {
            alert("Start date cannot be after end date.");
            return;
          }
        } else {
          setDateRange(period);
        }

        filterTransactionsByDate();
        generateReport();
      });

    // Export report button
    document
      .getElementById("export-report")
      .addEventListener("click", exportReportAsPDF);
  };

  // Initialize report
  const initReport = function () {
    // Load all transactions
    transactions = StorageCtrl.getTransactions();

    // Set default date range (this month)
    setDateRange("month");

    // Filter transactions
    filterTransactionsByDate();

    // Generate initial report
    generateReport();
  };

  // Public methods
  return {
    init: function () {
      try {
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

        // Initialize report
        initReport();

        console.log("Reports page initialized successfully");
      } catch (error) {
        console.error("Error initializing reports page:", error);
      }
    },
  };
})(StorageCtrl, UICtrl);

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", ReportsCtrl.init);

