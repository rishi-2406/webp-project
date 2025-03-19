// Settings Controller
const SettingsCtrl = (function (StorageCtrl, UICtrl) {
  // Private variables
  let settings = {};
  let incomeCategories = [];
  let expenseCategories = [];
  let editingCategory = false;
  let confirmAction = null;

  // Default settings
  const defaultSettings = {
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    weekStart: "monday",
    notifications: true,
    theme: "light",
    colorAccent: "blue",
    fontSize: "medium",
  };

  // Default categories
  const defaultIncomeCategories = [
    { id: 1, name: "Salary", icon: "briefcase", color: "#4e73df" },
    { id: 2, name: "Bonus", icon: "gift", color: "#1cc88a" },
    { id: 3, name: "Investment", icon: "chart-line", color: "#36b9cc" },
    { id: 4, name: "Freelance", icon: "laptop", color: "#f6c23e" },
    { id: 5, name: "Other", icon: "ellipsis-h", color: "#858796" },
  ];

  const defaultExpenseCategories = [
    { id: 1, name: "Housing", icon: "home", color: "#4e73df" },
    { id: 2, name: "Food", icon: "utensils", color: "#1cc88a" },
    { id: 3, name: "Transportation", icon: "car", color: "#36b9cc" },
    { id: 4, name: "Utilities", icon: "bolt", color: "#f6c23e" },
    { id: 5, name: "Healthcare", icon: "heartbeat", color: "#e74a3b" },
    { id: 6, name: "Entertainment", icon: "gamepad", color: "#fd7e14" },
    { id: 7, name: "Shopping", icon: "shopping-cart", color: "#6f42c1" },
    { id: 8, name: "Education", icon: "graduation-cap", color: "#20c9a6" },
    { id: 9, name: "Other", icon: "ellipsis-h", color: "#858796" },
  ];

  // Load settings and categories
  const loadData = function () {
    // Get settings from storage
    settings = StorageCtrl.getSettings();

    // If no settings, use defaults
    if (Object.keys(settings).length === 0) {
      settings = { ...defaultSettings };
      StorageCtrl.saveSettings(settings);
    }

    // Get categories from storage
    incomeCategories = StorageCtrl.getCategories("income");
    expenseCategories = StorageCtrl.getCategories("expense");

    // If no categories, use defaults
    if (incomeCategories.length === 0) {
      incomeCategories = [...defaultIncomeCategories];
      StorageCtrl.saveCategories("income", incomeCategories);
    }

    if (expenseCategories.length === 0) {
      expenseCategories = [...defaultExpenseCategories];
      StorageCtrl.saveCategories("expense", expenseCategories);
    }

    // Update UI
    updateSettingsUI();
    updateCategoriesUI();
  };

  // Update settings UI
  const updateSettingsUI = function () {
    // Update general settings
    document.getElementById("currency-select").value =
      settings.currency || defaultSettings.currency;
    document.getElementById("date-format-select").value =
      settings.dateFormat || defaultSettings.dateFormat;
    document.getElementById("week-start-select").value =
      settings.weekStart || defaultSettings.weekStart;
    document.getElementById("notifications-toggle").checked =
      settings.notifications !== undefined
        ? settings.notifications
        : defaultSettings.notifications;

    // Update appearance settings
    document.getElementById("theme-select").value =
      settings.theme || defaultSettings.theme;
    document.getElementById("font-size-select").value =
      settings.fontSize || defaultSettings.fontSize;

    // Update color accent
    const colorAccent = settings.colorAccent || defaultSettings.colorAccent;
    document.querySelector(
      `input[name="color-accent"][value="${colorAccent}"]`
    ).checked = true;

    // Apply current settings to the page
    applyCurrentSettings();
  };

  // Update categories UI
  const updateCategoriesUI = function () {
    // Update income categories
    const incomeList = document.getElementById("income-categories-list");
    incomeList.innerHTML = "";

    incomeCategories.forEach((category) => {
      const li = document.createElement("li");
      li.className = "category-item";

      li.innerHTML = `
            <div class="category-icon" style="background-color: ${category.color}">
                <i class="fas fa-${category.icon}"></i>
            </div>
            <div class="category-name">${category.name}</div>
            <div class="category-actions">
                <button class="category-btn edit-btn" data-id="${category.id}" data-type="income">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="category-btn delete category-delete-btn" data-id="${category.id}" data-type="income">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

      incomeList.appendChild(li);
    });

    // Update expense categories
    const expenseList = document.getElementById("expense-categories-list");
    expenseList.innerHTML = "";

    expenseCategories.forEach((category) => {
      const li = document.createElement("li");
      li.className = "category-item";

      li.innerHTML = `
            <div class="category-icon" style="background-color: ${category.color}">
                <i class="fas fa-${category.icon}"></i>
            </div>
            <div class="category-name">${category.name}</div>
            <div class="category-actions">
                <button class="category-btn edit-btn" data-id="${category.id}" data-type="expense">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="category-btn delete category-delete-btn" data-id="${category.id}" data-type="expense">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

      expenseList.appendChild(li);
    });
  };

  // Apply current settings to the page
  const applyCurrentSettings = function () {
    // Apply theme
    const theme = settings.theme || defaultSettings.theme;
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    // Apply font size
    const fontSize = settings.fontSize || defaultSettings.fontSize;
    document.documentElement.style.fontSize =
      fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";

    // Apply color accent
    const colorAccent = settings.colorAccent || defaultSettings.colorAccent;
    let primaryColor;

    switch (colorAccent) {
      case "blue":
        primaryColor = "#4e73df";
        break;
      case "green":
        primaryColor = "#1cc88a";
        break;
      case "purple":
        primaryColor = "#6f42c1";
        break;
      case "orange":
        primaryColor = "#fd7e14";
        break;
      case "teal":
        primaryColor = "#20c9a6";
        break;
      default:
        primaryColor = "#4e73df";
    }

    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty(
      "--primary-dark",
      adjustColor(primaryColor, -30)
    );
    document.documentElement.style.setProperty(
      "--primary-light",
      adjustColor(primaryColor, 30)
    );
  };

  // Adjust color brightness
  const adjustColor = function (color, amount) {
    return (
      "#" +
      color
        .replace(/^#/, "")
        .replace(/../g, (color) =>
          (
            "0" +
            Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(
              16
            )
          ).substr(-2)
        )
    );
  };

  // Save general settings
  const saveGeneralSettings = function () {
    // Get form values
    const currency = document.getElementById("currency-select").value;
    const dateFormat = document.getElementById("date-format-select").value;
    const weekStart = document.getElementById("week-start-select").value;
    const notifications = document.getElementById(
      "notifications-toggle"
    ).checked;

    // Update settings
    settings.currency = currency;
    settings.dateFormat = dateFormat;
    settings.weekStart = weekStart;
    settings.notifications = notifications;

    // Save to storage
    StorageCtrl.saveSettings(settings);

    // Apply settings
    applyCurrentSettings();

    // Show success message
    alert("Settings saved successfully!");
  };

  // Save appearance settings
  const saveAppearanceSettings = function () {
    // Get form values
    const theme = document.getElementById("theme-select").value;
    const fontSize = document.getElementById("font-size-select").value;
    const colorAccent = document.querySelector(
      'input[name="color-accent"]:checked'
    ).value;

    // Update settings
    settings.theme = theme;
    settings.fontSize = fontSize;
    settings.colorAccent = colorAccent;

    // Save to storage
    StorageCtrl.saveSettings(settings);

    // Apply settings
    applyCurrentSettings();

    // Show success message
    alert("Appearance settings saved successfully!");
  };

  // Show category modal
  const showCategoryModal = function (type, isEdit = false) {
    const modal = document.getElementById("category-modal");
    const modalTitle = document.getElementById("category-form-title");

    editingCategory = isEdit;

    // Set category type
    document.getElementById("category-type").value = type;

    if (isEdit) {
      modalTitle.textContent = `Edit ${
        type.charAt(0).toUpperCase() + type.slice(1)
      } Category`;
    } else {
      modalTitle.textContent = `Add ${
        type.charAt(0).toUpperCase() + type.slice(1)
      } Category`;
      resetCategoryForm();
    }

    modal.style.display = "block";
  };

  // Show confirmation modal
  const showConfirmModal = function (message, action) {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-message").textContent = message;
    confirmAction = action;
    modal.style.display = "block";
  };

  // Hide modals
  const hideModals = function () {
    document.getElementById("category-modal").style.display = "none";
    document.getElementById("confirm-modal").style.display = "none";
  };

  // Reset category form
  const resetCategoryForm = function () {
    document.getElementById("category-form").reset();
    document.getElementById("category-id").value = "";
    document.getElementById("category-color").value = "#4e73df";
  };

  // Fill category form
  const fillCategoryForm = function (category, type) {
    document.getElementById("category-id").value = category.id;
    document.getElementById("category-type").value = type;
    document.getElementById("category-name").value = category.name;
    document.getElementById("category-icon").value = category.icon;
    document.getElementById("category-color").value = category.color;
  };

  // Save category
  const saveCategory = function (e) {
    e.preventDefault();

    try {
      // Get form data
      const id = document.getElementById("category-id").value;
      const type = document.getElementById("category-type").value;
      const name = document.getElementById("category-name").value;
      const icon = document.getElementById("category-icon").value;
      const color = document.getElementById("category-color").value;

      // Validate form
      if (!name || !icon || !color) {
        alert("Please fill in all fields.");
        return;
      }

      // Get categories based on type
      const categories =
        type === "income" ? incomeCategories : expenseCategories;

      if (editingCategory) {
        // Update existing category
        const index = categories.findIndex((cat) => cat.id === parseInt(id));

        if (index !== -1) {
          categories[index] = {
            id: parseInt(id),
            name,
            icon,
            color,
          };
        }
      } else {
        // Create new category
        const newCategory = {
          id:
            categories.length > 0
              ? Math.max(...categories.map((cat) => cat.id)) + 1
              : 1,
          name,
          icon,
          color,
        };

        categories.push(newCategory);
      }

      // Save to storage
      if (type === "income") {
        incomeCategories = [...categories];
        StorageCtrl.saveCategories("income", incomeCategories);
      } else {
        expenseCategories = [...categories];
        StorageCtrl.saveCategories("expense", expenseCategories);
      }

      // Hide modal
      hideModals();

      // Update UI
      updateCategoriesUI();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("An error occurred while saving the category. Please try again.");
    }
  };

  // Delete category
  const deleteCategory = function (id, type) {
    try {
      // Get categories based on type
      let categories = type === "income" ? incomeCategories : expenseCategories;

      // Filter out the category
      categories = categories.filter((cat) => cat.id !== id);

      // Save to storage
      if (type === "income") {
        incomeCategories = [...categories];
        StorageCtrl.saveCategories("income", incomeCategories);
      } else {
        expenseCategories = [...categories];
        StorageCtrl.saveCategories("expense", expenseCategories);
      }

      // Update UI
      updateCategoriesUI();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred while deleting the category. Please try again.");
    }
  };

  // Export all data
  const exportData = function () {
    try {
      // Gather all data
      const data = {
        settings: settings,
        incomeCategories: incomeCategories,
        expenseCategories: expenseCategories,
        transactions: StorageCtrl.getTransactions
          ? StorageCtrl.getTransactions()
          : [],
        budgets: StorageCtrl.getBudgets ? StorageCtrl.getBudgets() : [],
        goals: StorageCtrl.getGoals ? StorageCtrl.getGoals() : [],
        subscriptions: StorageCtrl.getSubscriptions
          ? StorageCtrl.getSubscriptions()
          : [],
      };

      // Convert to JSON
      const jsonData = JSON.stringify(data, null, 2);

      // Create download link
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create temporary link and click it
      const a = document.createElement("a");
      a.href = url;
      a.download = `fintrack_backup_${new Date()
        .toISOString()
        .split("T")}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("An error occurred while exporting data. Please try again.");
    }
  };

  // Import data
  const importData = function (file) {
    try {
      const reader = new FileReader();

      reader.onload = function (e) {
        try {
          // Parse JSON data
          const data = JSON.parse(e.target.result);

          // Validate data structure
          if (
            !data.settings ||
            !data.incomeCategories ||
            !data.expenseCategories
          ) {
            throw new Error("Invalid data format");
          }

          // Confirm import
          showConfirmModal(
            "This will replace all your current data. Are you sure you want to continue?",
            function () {
              // Import data
              settings = data.settings;
              incomeCategories = data.incomeCategories;
              expenseCategories = data.expenseCategories;

              // Save to storage
              StorageCtrl.saveSettings(settings);
              StorageCtrl.saveCategories("income", incomeCategories);
              StorageCtrl.saveCategories("expense", expenseCategories);

              // Import other data if available
              if (data.transactions)
                StorageCtrl.setTransactions(data.transactions);
              if (data.budgets) StorageCtrl.setBudgets(data.budgets);
              if (data.goals) StorageCtrl.setGoals(data.goals);
              if (data.subscriptions)
                StorageCtrl.setSubscriptions(data.subscriptions);

              // Update UI
              updateSettingsUI();
              updateCategoriesUI();

              alert("Data imported successfully!");
            }
          );
        } catch (error) {
          console.error("Error parsing import data:", error);
          alert("Invalid data format. Please select a valid backup file.");
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing data:", error);
      alert("An error occurred while importing data. Please try again.");
    }
  };

  // Clear all data
  const clearAllData = function () {
    try {
      // Show confirmation
      showConfirmModal(
        "This will permanently delete all your data including transactions, budgets, goals, and settings. This action cannot be undone. Are you sure you want to continue?",
        function () {
          // Clear all data from storage
          localStorage.clear();

          // Reset to defaults
          settings = { ...defaultSettings };
          incomeCategories = [...defaultIncomeCategories];
          expenseCategories = [...defaultExpenseCategories];

          // Save defaults to storage
          StorageCtrl.saveSettings(settings);
          StorageCtrl.saveCategories("income", incomeCategories);
          StorageCtrl.saveCategories("expense", expenseCategories);

          // Update UI
          updateSettingsUI();
          updateCategoriesUI();

          alert("All data has been cleared successfully!");
        }
      );
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("An error occurred while clearing data. Please try again.");
    }
  };

  // Set up event listeners
  const setupEventListeners = function () {
    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        // Remove active class from all tabs
        document
          .querySelectorAll(".tab-btn")
          .forEach((tab) => tab.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((content) => content.classList.remove("active"));
        // Add active class to clicked tab
        this.classList.add("active");

        // Show corresponding content
        const tabId = this.dataset.tab + "-tab";
        document.getElementById(tabId).classList.add("active");
      });
    });

    // Save general settings
    document
      .getElementById("save-general-settings")
      .addEventListener("click", saveGeneralSettings);

    // Save appearance settings
    document
      .getElementById("save-appearance-settings")
      .addEventListener("click", saveAppearanceSettings);

    // Add income category
    document
      .getElementById("add-income-category")
      .addEventListener("click", function () {
        showCategoryModal("income", false);
      });

    // Add expense category
    document
      .getElementById("add-expense-category")
      .addEventListener("click", function () {
        showCategoryModal("expense", false);
      });

    // Save category
    document
      .getElementById("category-form")
      .addEventListener("submit", saveCategory);

    // Cancel category
    document
      .getElementById("cancel-category")
      .addEventListener("click", hideModals);

    // Close modals
    document.querySelectorAll(".close-modal").forEach((closeBtn) => {
      closeBtn.addEventListener("click", hideModals);
    });

    // Confirm action
    document
      .getElementById("confirm-action")
      .addEventListener("click", function () {
        if (typeof confirmAction === "function") {
          confirmAction();
          confirmAction = null;
        }
        hideModals();
      });

    // Cancel action
    document
      .getElementById("cancel-action")
      .addEventListener("click", function () {
        confirmAction = null;
        hideModals();
      });

    // Export data
    document
      .getElementById("export-data")
      .addEventListener("click", exportData);

    // Import data
    document
      .getElementById("import-file")
      .addEventListener("change", function (e) {
        if (this.files.length > 0) {
          importData(this.files);
        }
      });

    // Clear data
    document
      .getElementById("clear-data")
      .addEventListener("click", clearAllData);

    // Event delegation for dynamic buttons
    document.addEventListener("click", function (e) {
      // Edit category button
      if (e.target.closest(".edit-btn")) {
        const button = e.target.closest(".edit-btn");
        const id = parseInt(button.dataset.id);
        const type = button.dataset.type;

        // Find category
        const categories =
          type === "income" ? incomeCategories : expenseCategories;
        const category = categories.find((cat) => cat.id === id);

        if (category) {
          fillCategoryForm(category, type);
          showCategoryModal(type, true);
        }
      }

      // Delete category button
      if (e.target.closest(".category-delete-btn")) {
        const button = e.target.closest(".category-delete-btn");
        const id = parseInt(button.dataset.id);
        const type = button.dataset.type;

        // Show confirmation
        showConfirmModal(
          `Are you sure you want to delete this ${type} category? This may affect existing transactions.`,
          function () {
            deleteCategory(id, type);
          }
        );
      }
    });
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

        // Load data
        loadData();

        console.log("Settings page initialized successfully");
      } catch (error) {
        console.error("Error initializing settings page:", error);
      }
    },
  };
})(StorageCtrl, UICtrl);

// Update StorageCtrl with additional methods for settings page
StorageCtrl.getSettings = function () {
  try {
    let settings;
    if (localStorage.getItem("settings") === null) {
      settings = {};
    } else {
      settings = JSON.parse(localStorage.getItem("settings"));
    }
    return settings;
  } catch (error) {
    console.error("Error getting settings from localStorage:", error);
    return {};
  }
};

StorageCtrl.saveSettings = function (settings) {
  try {
    localStorage.setItem("settings", JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Error saving settings to localStorage:", error);
    return false;
  }
};

StorageCtrl.getCategories = function (type) {
  try {
    let categories;
    if (localStorage.getItem(`${type}Categories`) === null) {
      categories = [];
    } else {
      categories = JSON.parse(localStorage.getItem(`${type}Categories`));
    }
    return categories;
  } catch (error) {
    console.error(`Error getting ${type} categories from localStorage:`, error);
    return [];
  }
};

StorageCtrl.saveCategories = function (type, categories) {
  try {
    localStorage.setItem(`${type}Categories`, JSON.stringify(categories));
    return true;
  } catch (error) {
    console.error(`Error saving ${type} categories to localStorage:`, error);
    return false;
  }
};

StorageCtrl.setTransactions = function (transactions) {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Error setting transactions in localStorage:", error);
    return false;
  }
};

StorageCtrl.setBudgets = function (budgets) {
  try {
    localStorage.setItem("budgets", JSON.stringify(budgets));
    return true;
  } catch (error) {
    console.error("Error setting budgets in localStorage:", error);
    return false;
  }
};

StorageCtrl.setGoals = function (goals) {
  try {
    localStorage.setItem("goals", JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error("Error setting goals in localStorage:", error);
    return false;
  }
};

StorageCtrl.setSubscriptions = function (subscriptions) {
  try {
    localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
    return true;
  } catch (error) {
    console.error("Error setting subscriptions in localStorage:", error);
    return false;
  }
};

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", SettingsCtrl.init);

