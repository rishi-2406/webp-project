// Goals Controller
const GoalsCtrl = (function (StorageCtrl, UICtrl) {
  // Private variables
  let goals = [];
  let subscriptions = [];
  let deleteItemId = null;
  let deleteItemType = null;
  let editingGoal = false;
  let editingSubscription = false;
  let selectedGoalId = null;

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

  // Calculate days remaining
  const calculateDaysRemaining = function (endDateString) {
    const endDate = new Date(endDateString);
    const today = new Date();

    // Reset time part for accurate day calculation
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = endDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  // Calculate progress percentage
  const calculateProgress = function (current, target) {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  // Determine goal term (short, medium, long)
  const determineGoalTerm = function (startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth();

    if (diffMonths <= 3) {
      return "short";
    } else if (diffMonths <= 12) {
      return "medium";
    } else {
      return "long";
    }
  };

  // Load goals and subscriptions
  const loadData = function () {
    // Get goals from storage
    goals = StorageCtrl.getGoals();

    // Get subscriptions from storage
    subscriptions = StorageCtrl.getSubscriptions();

    // Update UI
    updateGoalsUI();
    updateSubscriptionsUI();
  };

  // Update goals UI
  const updateGoalsUI = function () {
    // Filter active goals
    const activeGoals = goals.filter((goal) => !goal.completed);
    const completedGoals = goals.filter((goal) => goal.completed);

    // Update counts
    document.getElementById("active-goals-count").textContent =
      activeGoals.length;
    document.getElementById("completed-goals-count").textContent =
      completedGoals.length;

    // Calculate total saved and target
    let totalSaved = 0;
    let totalTarget = 0;

    goals.forEach((goal) => {
      totalSaved += parseFloat(goal.currentAmount) || 0;
      totalTarget += parseFloat(goal.targetAmount) || 0;
    });

    document.getElementById("total-saved").textContent = `₹${formatCurrency(
      totalSaved
    )}`;
    document.getElementById("total-target").textContent = `₹${formatCurrency(
      totalTarget
    )}`;

    // Update active goals list
    updateActiveGoalsList(activeGoals);

    // Update timeline
    updateGoalTimeline();

    // Update recommendations
    updateRecommendations();
  };

  // Update active goals list
  const updateActiveGoalsList = function (activeGoals) {
    const goalsList = document.getElementById("active-goals-list");
    const noGoalsMessage = document.getElementById("no-active-goals");

    // Clear current list
    goalsList.innerHTML = "";
    goalsList.appendChild(noGoalsMessage);

    // If no active goals, show message
    if (activeGoals.length === 0) {
      noGoalsMessage.style.display = "flex";
      return;
    }

    // Hide no goals message
    noGoalsMessage.style.display = "none";

    // Filter goals based on selected filter
    const filter = document.getElementById("goal-filter").value;
    let filteredGoals = activeGoals;

    if (filter !== "all") {
      filteredGoals = activeGoals.filter((goal) => {
        const term = determineGoalTerm(goal.startDate, goal.endDate);
        return term === filter;
      });
    }

    // Add each goal to the list
    filteredGoals.forEach((goal) => {
      const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
      const daysRemaining = calculateDaysRemaining(goal.endDate);

      const goalCard = document.createElement("div");
      goalCard.className = `goal-card ${goal.priority}-priority`;

      goalCard.innerHTML = `
                <div class="goal-header">
                    <div class="goal-title">${goal.name}</div>
                    <div class="goal-category">${goal.category}</div>
                </div>
                <div class="goal-details">
                    <div class="goal-amount">
                        <span>₹${formatCurrency(goal.currentAmount)}</span>
                        <span>of ₹${formatCurrency(goal.targetAmount)}</span>
                    </div>
                </div>
                <div class="goal-progress-container">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-progress-stats">
                        <span>${progress}% Complete</span>
                        <span>${daysRemaining} days left</span>
                    </div>
                </div>
                <div class="goal-dates">
                    <span>Started: ${formatDate(goal.startDate)}</span>
                    <span>Target: ${formatDate(goal.endDate)}</span>
                </div>
                <div class="goal-actions">
                    <button class="goal-btn primary contribute-btn" data-id="${
                      goal.id
                    }">
                        <i class="fas fa-plus"></i> Add Funds
                    </button>
                    <button class="goal-btn secondary edit-goal-btn" data-id="${
                      goal.id
                    }">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="goal-btn danger delete-goal-btn" data-id="${
                      goal.id
                    }">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      goalsList.appendChild(goalCard);

      // Check if goal is complete after adding funds
      if (progress >= 100 && !goal.completed) {
        // Trigger celebration
        setTimeout(() => {
          celebrateGoalCompletion(goal.name);
        }, 500);
      }
    });
  };

  // Update goal timeline
  const updateGoalTimeline = function () {
    const timelineContainer = document.getElementById("timeline-container");
    const noTimelineMessage = document.getElementById("no-timeline-goals");

    // Clear current timeline
    timelineContainer.innerHTML = "";
    timelineContainer.appendChild(noTimelineMessage);

    // If no goals, show message
    if (goals.length === 0) {
      noTimelineMessage.style.display = "flex";
      return;
    }

    // Hide no goals message
    noTimelineMessage.style.display = "none";

    // Sort goals by end date
    const sortedGoals = [...goals].sort(
      (a, b) => new Date(a.endDate) - new Date(b.endDate)
    );

    // Add each goal to the timeline
    sortedGoals.forEach((goal) => {
      const timelineItem = document.createElement("div");
      timelineItem.className = `timeline-item ${
        goal.completed ? "completed" : ""
      }`;

      const progress = calculateProgress(goal.currentAmount, goal.targetAmount);

      timelineItem.innerHTML = `
                <div class="timeline-content">
                    <div class="timeline-date">${formatDate(goal.endDate)}</div>
                    <div class="timeline-title">${goal.name} (${
        goal.category
      })</div>
                    <div class="timeline-description">
                        <div class="goal-progress-container">
                            <div class="goal-progress-bar">
                                <div class="goal-progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="goal-progress-stats">
                                <span>₹${formatCurrency(
                                  goal.currentAmount
                                )} of ₹${formatCurrency(
        goal.targetAmount
      )}</span>
                                <span>${progress}% Complete</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      timelineContainer.appendChild(timelineItem);
    });
  };

  // Update recommendations
  const updateRecommendations = function () {
    const recommendationsContainer = document.getElementById(
      "recommendations-container"
    );
    recommendationsContainer.innerHTML = "";

    // Define some recommendation templates
    const recommendations = [
      {
        title: "Emergency Fund",
        description:
          "Build a 3-6 month emergency fund to cover unexpected expenses.",
        icon: "shield-alt",
        targetAmount: 50000,
      },
      {
        title: "Debt Payoff",
        description:
          "Pay off high-interest debt to save money in the long run.",
        icon: "credit-card",
        targetAmount: 25000,
      },
      {
        title: "Vacation Fund",
        description: "Start saving for your next vacation or travel adventure.",
        icon: "plane",
        targetAmount: 30000,
      },
    ];

    // Check if user already has these goals
    const existingGoalNames = goals.map((goal) => goal.name.toLowerCase());

    // Filter recommendations that user doesn't already have
    const filteredRecommendations = recommendations.filter(
      (rec) => !existingGoalNames.includes(rec.title.toLowerCase())
    );

    // If all recommendations are already goals, add some more
    if (filteredRecommendations.length === 0) {
      filteredRecommendations.push(
        {
          title: "Home Improvement",
          description:
            "Save for home repairs or renovations to maintain your property value.",
          icon: "home",
          targetAmount: 100000,
        },
        {
          title: "Education Fund",
          description:
            "Invest in your future by saving for education or skill development.",
          icon: "graduation-cap",
          targetAmount: 75000,
        }
      );
    }

    // Add recommendations to UI (max 3)
    filteredRecommendations.slice(0, 3).forEach((rec) => {
      const recCard = document.createElement("div");
      recCard.className = "recommendation-card";

      recCard.innerHTML = `
                <div class="recommendation-icon">
                    <i class="fas fa-${rec.icon}"></i>
                </div>
                <div class="recommendation-title">${rec.title}</div>
                <div class="recommendation-description">${rec.description}</div>
                <div class="recommendation-action">
                    <button class="btn primary small create-recommended-goal" 
                        data-title="${rec.title}" 
                        data-description="${rec.description}" 
                        data-amount="${rec.targetAmount}">
                        Create Goal
                    </button>
                </div>
            `;

      recommendationsContainer.appendChild(recCard);
    });
  };

  // Update subscriptions UI
  const updateSubscriptionsUI = function () {
    const subscriptionsTable = document.getElementById("subscriptions-table");
    const noSubscriptionsRow = document.getElementById("no-subscriptions");

    // Clear current table
    subscriptionsTable.innerHTML = "";
    subscriptionsTable.appendChild(noSubscriptionsRow);

    // If no subscriptions, show message
    if (subscriptions.length === 0) {
      noSubscriptionsRow.style.display = "table-row";
      return;
    }

    // Hide no subscriptions message
    noSubscriptionsRow.style.display = "none";

    // Add each subscription to the table
    subscriptions.forEach((subscription) => {
      const nextPayment = new Date(subscription.nextPaymentDate);
      const today = new Date();

      // Determine status
      let status = "Active";
      let statusClass = "status-active";

      // If next payment is within 7 days
      if ((nextPayment - today) / (1000 * 60 * 60 * 24) <= 7) {
        status = "Upcoming";
        statusClass = "status-upcoming";
      }

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${subscription.name}</td>
                <td>₹${formatCurrency(subscription.amount)}</td>
                <td>${
                  subscription.billingCycle.charAt(0).toUpperCase() +
                  subscription.billingCycle.slice(1)
                }</td>
                <td>${formatDate(subscription.nextPaymentDate)}</td>
                <td><span class="subscription-status ${statusClass}">${status}</span></td>
                <td>
                    <div class="subscription-actions">
                        <button class="action-btn edit-btn" data-id="${
                          subscription.id
                        }">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${
                          subscription.id
                        }">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

      subscriptionsTable.appendChild(row);
    });
  };

  // Show goal modal
  const showGoalModal = function (isEdit = false) {
    const modal = document.getElementById("goal-modal");
    const modalTitle = document.getElementById("goal-form-title");

    editingGoal = isEdit;

    if (isEdit) {
      modalTitle.textContent = "Edit Goal";
    } else {
      modalTitle.textContent = "Add New Goal";
      resetGoalForm();
    }

    modal.style.display = "block";
  };

  // Show subscription modal
  const showSubscriptionModal = function (isEdit = false) {
    const modal = document.getElementById("subscription-modal");
    const modalTitle = document.getElementById("subscription-form-title");

    editingSubscription = isEdit;

    if (isEdit) {
      modalTitle.textContent = "Edit Subscription";
    } else {
      modalTitle.textContent = "Add Subscription";
      resetSubscriptionForm();
    }

    modal.style.display = "block";
  };

  // Show contribution modal
  const showContributionModal = function (goalId) {
    const modal = document.getElementById("contribution-modal");
    selectedGoalId = goalId;

    // Set today's date as default
    document.getElementById("contribution-date").value = new Date()
      .toISOString()
      .split("T")[0];

    modal.style.display = "block";
  };

  // Show confirmation modal
  const showConfirmModal = function (id, type) {
    const modal = document.getElementById("confirm-modal");
    const message = document.getElementById("confirm-message");

    deleteItemId = id;
    deleteItemType = type;

    if (type === "goal") {
      message.textContent =
        "Are you sure you want to delete this goal? This action cannot be undone.";
    } else if (type === "subscription") {
      message.textContent =
        "Are you sure you want to delete this subscription? This action cannot be undone.";
    }

    modal.style.display = "block";
  };

  // Hide modals
  const hideModals = function () {
    document.getElementById("goal-modal").style.display = "none";
    document.getElementById("subscription-modal").style.display = "none";
    document.getElementById("contribution-modal").style.display = "none";
    document.getElementById("confirm-modal").style.display = "none";
  };

  // Reset goal form
  const resetGoalForm = function () {
    document.getElementById("goal-form").reset();
    document.getElementById("goal-id").value = "";

    // Set today's date as default start date
    document.getElementById("goal-start-date").value = new Date()
      .toISOString()
      .split("T")[0];

    // Clear milestones
    document.getElementById("milestones-container").innerHTML = "";
  };

  // Reset subscription form
  const resetSubscriptionForm = function () {
    document.getElementById("subscription-form").reset();
    document.getElementById("subscription-id").value = "";

    // Set today's date as default next payment date
    document.getElementById("subscription-next-date").value = new Date()
      .toISOString()
      .split("T")[0];
  };

  // Fill goal form with data
  const fillGoalForm = function (goal) {
    document.getElementById("goal-id").value = goal.id;
    document.getElementById("goal-name").value = goal.name;
    document.getElementById("goal-category").value = goal.category;
    document.getElementById("goal-target").value = goal.targetAmount;
    document.getElementById("goal-current").value = goal.currentAmount;
    document.getElementById("goal-start-date").value = goal.startDate;
    document.getElementById("goal-end-date").value = goal.endDate;
    document.getElementById("goal-priority").value = goal.priority;
    document.getElementById("goal-notes").value = goal.notes || "";

    // Add milestones
    const milestonesContainer = document.getElementById("milestones-container");
    milestonesContainer.innerHTML = "";

    if (goal.milestones && goal.milestones.length > 0) {
      goal.milestones.forEach((milestone) => {
        addMilestoneToForm(milestone.description, milestone.amount);
      });
    }
  };

  // Fill subscription form with data
  const fillSubscriptionForm = function (subscription) {
    document.getElementById("subscription-id").value = subscription.id;
    document.getElementById("subscription-name").value = subscription.name;
    document.getElementById("subscription-amount").value = subscription.amount;
    document.getElementById("subscription-cycle").value =
      subscription.billingCycle;
    document.getElementById("subscription-next-date").value =
      subscription.nextPaymentDate;
    document.getElementById("subscription-category").value =
      subscription.category;
    document.getElementById("subscription-notes").value =
      subscription.notes || "";
    document.getElementById("subscription-auto-renew").checked =
      subscription.autoRenew;
  };

  // Add milestone to form
  const addMilestoneToForm = function (description = "", amount = "") {
    const milestonesContainer = document.getElementById("milestones-container");
    const template = document.getElementById("milestone-template");
    const milestoneItem = template.content.cloneNode(true);
    // Set values if provided
    if (description) {
      milestoneItem.querySelector(".milestone-description").value = description;
    }
    if (amount) {
      milestoneItem.querySelector(".milestone-amount").value = amount;
    }

    // Add remove event listener
    milestoneItem
      .querySelector(".remove-milestone-btn")
      .addEventListener("click", function () {
        this.closest(".milestone-item").remove();
      });

    milestonesContainer.appendChild(milestoneItem);
  };

  // Save goal
  const saveGoal = function (e) {
    e.preventDefault();

    try {
      // Get form data
      const id = document.getElementById("goal-id").value;
      const name = document.getElementById("goal-name").value;
      const category = document.getElementById("goal-category").value;
      const targetAmount = parseFloat(
        document.getElementById("goal-target").value
      );
      const currentAmount = parseFloat(
        document.getElementById("goal-current").value
      );
      const startDate = document.getElementById("goal-start-date").value;
      const endDate = document.getElementById("goal-end-date").value;
      const priority = document.getElementById("goal-priority").value;
      const notes = document.getElementById("goal-notes").value;

      // Validate form
      if (
        !name ||
        !category ||
        isNaN(targetAmount) ||
        targetAmount <= 0 ||
        isNaN(currentAmount) ||
        currentAmount < 0 ||
        !startDate ||
        !endDate
      ) {
        alert("Please fill in all required fields with valid values.");
        return;
      }

      // Check if end date is after start date
      if (new Date(endDate) <= new Date(startDate)) {
        alert("Target date must be after start date.");
        return;
      }

      // Get milestones
      const milestones = [];
      const milestoneItems = document.querySelectorAll(".milestone-item");

      milestoneItems.forEach((item) => {
        const description = item.querySelector(".milestone-description").value;
        const amount = parseFloat(
          item.querySelector(".milestone-amount").value
        );

        if (description && !isNaN(amount) && amount > 0) {
          milestones.push({
            description,
            amount,
          });
        }
      });

      // Check if goal is completed
      const completed = currentAmount >= targetAmount;

      if (editingGoal) {
        // Update existing goal
        const updatedGoal = {
          id: parseInt(id),
          name,
          category,
          targetAmount,
          currentAmount,
          startDate,
          endDate,
          priority,
          notes,
          milestones,
          completed,
        };

        // Update in storage
        StorageCtrl.updateGoal(updatedGoal);
      } else {
        // Create new goal
        const newGoal = {
          id: goals.length > 0 ? Math.max(...goals.map((g) => g.id)) + 1 : 1,
          name,
          category,
          targetAmount,
          currentAmount,
          startDate,
          endDate,
          priority,
          notes,
          milestones,
          completed,
        };

        // Add to storage
        StorageCtrl.addGoal(newGoal);
      }

      // Hide modal
      hideModals();

      // Reload data
      loadData();
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("An error occurred while saving the goal. Please try again.");
    }
  };

  // Save subscription
  const saveSubscription = function (e) {
    e.preventDefault();

    try {
      // Get form data
      const id = document.getElementById("subscription-id").value;
      const name = document.getElementById("subscription-name").value;
      const amount = parseFloat(
        document.getElementById("subscription-amount").value
      );
      const billingCycle = document.getElementById("subscription-cycle").value;
      const nextPaymentDate = document.getElementById(
        "subscription-next-date"
      ).value;
      const category = document.getElementById("subscription-category").value;
      const notes = document.getElementById("subscription-notes").value;
      const autoRenew = document.getElementById(
        "subscription-auto-renew"
      ).checked;

      // Validate form
      if (
        !name ||
        isNaN(amount) ||
        amount <= 0 ||
        !billingCycle ||
        !nextPaymentDate ||
        !category
      ) {
        alert("Please fill in all required fields with valid values.");
        return;
      }

      if (editingSubscription) {
        // Update existing subscription
        const updatedSubscription = {
          id: parseInt(id),
          name,
          amount,
          billingCycle,
          nextPaymentDate,
          category,
          notes,
          autoRenew,
        };

        // Update in storage
        StorageCtrl.updateSubscription(updatedSubscription);
      } else {
        // Create new subscription
        const newSubscription = {
          id:
            subscriptions.length > 0
              ? Math.max(...subscriptions.map((s) => s.id)) + 1
              : 1,
          name,
          amount,
          billingCycle,
          nextPaymentDate,
          category,
          notes,
          autoRenew,
        };

        // Add to storage
        StorageCtrl.addSubscription(newSubscription);
      }

      // Hide modal
      hideModals();

      // Reload data
      loadData();
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert(
        "An error occurred while saving the subscription. Please try again."
      );
    }
  };

  // Save contribution
  const saveContribution = function (e) {
    e.preventDefault();

    try {
      // Get form data
      const amount = parseFloat(
        document.getElementById("contribution-amount").value
      );
      const date = document.getElementById("contribution-date").value;
      const notes = document.getElementById("contribution-notes").value;

      // Validate form
      if (isNaN(amount) || amount <= 0 || !date) {
        alert("Please fill in all required fields with valid values.");
        return;
      }

      // Find goal
      const goal = goals.find((g) => g.id === selectedGoalId);

      if (!goal) {
        alert("Goal not found.");
        return;
      }

      // Update goal current amount
      goal.currentAmount = parseFloat(goal.currentAmount) + amount;

      // Check if goal is completed
      if (goal.currentAmount >= goal.targetAmount && !goal.completed) {
        goal.completed = true;
      }

      // Add contribution to goal history if it doesn't exist
      if (!goal.contributions) {
        goal.contributions = [];
      }

      goal.contributions.push({
        amount,
        date,
        notes,
      });

      // Update in storage
      StorageCtrl.updateGoal(goal);

      // Hide modal
      hideModals();

      // Reload data
      loadData();
    } catch (error) {
      console.error("Error saving contribution:", error);
      alert(
        "An error occurred while saving the contribution. Please try again."
      );
    }
  };

  // Delete item
  const deleteItem = function () {
    if (!deleteItemId || !deleteItemType) return;

    try {
      if (deleteItemType === "goal") {
        // Delete goal
        StorageCtrl.deleteGoal(deleteItemId);
      } else if (deleteItemType === "subscription") {
        // Delete subscription
        StorageCtrl.deleteSubscription(deleteItemId);
      }

      // Reset delete variables
      deleteItemId = null;
      deleteItemType = null;

      // Hide modal
      hideModals();

      // Reload data
      loadData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("An error occurred while deleting the item. Please try again.");
    }
  };

  // Create goal from recommendation
  const createGoalFromRecommendation = function (title, description, amount) {
    // Set form values
    document.getElementById("goal-name").value = title;
    document.getElementById("goal-category").value =
      title === "Emergency Fund"
        ? "Emergency Fund"
        : title === "Debt Payoff"
        ? "Debt Payoff"
        : title === "Vacation Fund"
        ? "Vacation"
        : "Other";
    document.getElementById("goal-target").value = amount;
    document.getElementById("goal-current").value = 0;
    document.getElementById("goal-notes").value = description;

    // Set start date to today
    const today = new Date().toISOString().split("T");
    document.getElementById("goal-start-date").value = today;

    // Set end date to 6 months from now for short-term goals, 1 year for medium, 3 years for long
    const endDate = new Date();
    if (title === "Emergency Fund") {
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year
    } else if (title === "Debt Payoff") {
      endDate.setMonth(endDate.getMonth() + 6); // 6 months
    } else {
      endDate.setMonth(endDate.getMonth() + 9); // 9 months
    }

    document.getElementById("goal-end-date").value = endDate
      .toISOString()
      .split("T");

    // Set priority
    document.getElementById("goal-priority").value =
      title === "Emergency Fund" ? "high" : "medium";

    // Show goal modal
    showGoalModal(false);
  };

  // Celebrate goal completion
  const celebrateGoalCompletion = function (goalName) {
    // Show confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Show alert
    setTimeout(() => {
      alert(`Congratulations! You've reached your goal: ${goalName}`);
    }, 500);
  };

  // Set up event listeners
  const setupEventListeners = function () {
    // Add goal button
    document
      .getElementById("add-goal-btn")
      .addEventListener("click", function () {
        showGoalModal(false);
      });

    // Add subscription button
    document
      .getElementById("add-subscription-btn")
      .addEventListener("click", function () {
        showSubscriptionModal(false);
      });

    // Goal filter change
    document
      .getElementById("goal-filter")
      .addEventListener("change", function () {
        // Update active goals list with current goals
        const activeGoals = goals.filter((goal) => !goal.completed);
        updateActiveGoalsList(activeGoals);
      });

    // Add milestone button
    document
      .getElementById("add-milestone-btn")
      .addEventListener("click", function () {
        addMilestoneToForm();
      });

    // Save goal
    document.getElementById("goal-form").addEventListener("submit", saveGoal);

    // Save subscription
    document
      .getElementById("subscription-form")
      .addEventListener("submit", saveSubscription);

    // Save contribution
    document
      .getElementById("contribution-form")
      .addEventListener("submit", saveContribution);

    // Cancel buttons
    document
      .getElementById("cancel-goal")
      .addEventListener("click", hideModals);
    document
      .getElementById("cancel-subscription")
      .addEventListener("click", hideModals);
    document
      .getElementById("cancel-contribution")
      .addEventListener("click", hideModals);
    document
      .getElementById("cancel-delete")
      .addEventListener("click", hideModals);

    // Close modals
    document.querySelectorAll(".close-modal").forEach((closeBtn) => {
      closeBtn.addEventListener("click", hideModals);
    });

    // Confirm delete
    document
      .getElementById("confirm-delete")
      .addEventListener("click", deleteItem);

    // Event delegation for dynamic buttons
    document.addEventListener("click", function (e) {
      // Edit goal button
      if (e.target.closest(".edit-goal-btn")) {
        const goalId = parseInt(e.target.closest(".edit-goal-btn").dataset.id);
        const goal = goals.find((g) => g.id === goalId);

        if (goal) {
          fillGoalForm(goal);
          showGoalModal(true);
        }
      }

      // Delete goal button
      else if (e.target.closest(".delete-goal-btn")) {
        const goalId = parseInt(
          e.target.closest(".delete-goal-btn").dataset.id
        );
        showConfirmModal(goalId, "goal");
      }

      // Contribute button
      else if (e.target.closest(".contribute-btn")) {
        const goalId = parseInt(e.target.closest(".contribute-btn").dataset.id);
        showContributionModal(goalId);
      }

      // Edit subscription button
      else if (e.target.closest(".edit-btn") && e.target.closest("table")) {
        const subscriptionId = parseInt(
          e.target.closest(".edit-btn").dataset.id
        );
        const subscription = subscriptions.find((s) => s.id === subscriptionId);

        if (subscription) {
          fillSubscriptionForm(subscription);
          showSubscriptionModal(true);
        }
      }

      // Delete subscription button
      else if (e.target.closest(".delete-btn") && e.target.closest("table")) {
        const subscriptionId = parseInt(
          e.target.closest(".delete-btn").dataset.id
        );
        showConfirmModal(subscriptionId, "subscription");
      }

      // Create recommended goal button
      else if (e.target.closest(".create-recommended-goal")) {
        const button = e.target.closest(".create-recommended-goal");
        const title = button.dataset.title;
        const description = button.dataset.description;
        const amount = parseFloat(button.dataset.amount);

        createGoalFromRecommendation(title, description, amount);
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

        console.log("Goals page initialized successfully");
      } catch (error) {
        console.error("Error initializing goals page:", error);
      }
    },
  };
})(StorageCtrl, UICtrl);

// Update StorageCtrl with additional methods for goals page
StorageCtrl.getGoals = function () {
  try {
    let goals;
    if (localStorage.getItem("goals") === null) {
      goals = [];
    } else {
      goals = JSON.parse(localStorage.getItem("goals"));
      // Validate goals data
      if (!Array.isArray(goals)) {
        console.error("Invalid goals data in localStorage");
        goals = [];
      }
    }
    return goals;
  } catch (error) {
    console.error("Error getting goals from localStorage:", error);
    return [];
  }
};

StorageCtrl.addGoal = function (goal) {
  try {
    if (!goal || !goal.name || isNaN(goal.targetAmount)) {
      console.error("Invalid goal data:", goal);
      return false;
    }
    let goals = this.getGoals();
    goals.push(goal);
    localStorage.setItem("goals", JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error("Error adding goal to localStorage:", error);
    return false;
  }
};

StorageCtrl.updateGoal = function (updatedGoal) {
  try {
    if (
      !updatedGoal ||
      !updatedGoal.id ||
      !updatedGoal.name ||
      isNaN(updatedGoal.targetAmount)
    ) {
      console.error("Invalid goal data for update:", updatedGoal);
      return false;
    }
    let goals = this.getGoals();
    const index = goals.findIndex((g) => g.id === updatedGoal.id);

    if (index !== -1) {
      goals[index] = updatedGoal;
      localStorage.setItem("goals", JSON.stringify(goals));
      return true;
    } else {
      console.error("Goal not found for update:", updatedGoal.id);
      return false;
    }
  } catch (error) {
    console.error("Error updating goal in localStorage:", error);
    return false;
  }
};

StorageCtrl.deleteGoal = function (id) {
  try {
    if (!id) {
      console.error("Invalid goal ID for deletion:", id);
      return false;
    }
    let goals = this.getGoals();
    const filteredGoals = goals.filter((g) => g.id !== id);
    localStorage.setItem("goals", JSON.stringify(filteredGoals));
    return true;
  } catch (error) {
    console.error("Error deleting goal from localStorage:", error);
    return false;
  }
};

StorageCtrl.getSubscriptions = function () {
  try {
    let subscriptions;
    if (localStorage.getItem("subscriptions") === null) {
      subscriptions = [];
    } else {
      subscriptions = JSON.parse(localStorage.getItem("subscriptions"));
      // Validate subscriptions data
      if (!Array.isArray(subscriptions)) {
        console.error("Invalid subscriptions data in localStorage");
        subscriptions = [];
      }
    }
    return subscriptions;
  } catch (error) {
    console.error("Error getting subscriptions from localStorage:", error);
    return [];
  }
};

StorageCtrl.addSubscription = function (subscription) {
  try {
    if (!subscription || !subscription.name || isNaN(subscription.amount)) {
      console.error("Invalid subscription data:", subscription);
      return false;
    }
    let subscriptions = this.getSubscriptions();
    subscriptions.push(subscription);
    localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
    return true;
  } catch (error) {
    console.error("Error adding subscription to localStorage:", error);
    return false;
  }
};

StorageCtrl.updateSubscription = function (updatedSubscription) {
  try {
    if (
      !updatedSubscription ||
      !updatedSubscription.id ||
      !updatedSubscription.name ||
      isNaN(updatedSubscription.amount)
    ) {
      console.error(
        "Invalid subscription data for update:",
        updatedSubscription
      );
      return false;
    }

    let subscriptions = this.getSubscriptions();
    const index = subscriptions.findIndex(
      (s) => s.id === updatedSubscription.id
    );

    if (index !== -1) {
      subscriptions[index] = updatedSubscription;
      localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
      return true;
    } else {
      console.error(
        "Subscription not found for update:",
        updatedSubscription.id
      );
      return false;
    }
  } catch (error) {
    console.error("Error updating subscription in localStorage:", error);
    return false;
  }
};

StorageCtrl.deleteSubscription = function (id) {
  try {
    if (!id) {
      console.error("Invalid subscription ID for deletion:", id);
      return false;
    }
    let subscriptions = this.getSubscriptions();
    const filteredSubscriptions = subscriptions.filter((s) => s.id !== id);
    localStorage.setItem(
      "subscriptions",
      JSON.stringify(filteredSubscriptions)
    );
    return true;
  } catch (error) {
    console.error("Error deleting subscription from localStorage:", error);
    return false;
  }
};

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", GoalsCtrl.init);
