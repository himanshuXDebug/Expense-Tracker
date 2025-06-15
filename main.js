let expenses = [];
let reminders = [];
let currentSection = "dashboard";
let notificationPermission = "default";

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  try {
    loadData();
    checkNotificationPermission();
    updateSummary();
    renderDashboard();
    renderExpenses();
    renderReminders();
    startReminderChecker();
    setDefaultDate();
  } catch (error) {
    showError("Failed to initialize app: " + error.message);
  }
}

// Data Management
function loadData() {
  try {
    const savedExpenses = localStorage.getItem("expenses");
    const savedReminders = localStorage.getItem("reminders");

    expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
    reminders = savedReminders ? JSON.parse(savedReminders) : [];
  } catch (error) {
    showError(
      "Failed to load data from localStorage. Your data might be corrupted."
    );
    expenses = [];
    reminders = [];
  }
}

function saveData() {
  try {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("reminders", JSON.stringify(reminders));
  } catch (error) {
    showError("Failed to save data to localStorage. Storage might be full.");
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  document.getElementById("theme-icon").textContent =
    newTheme === "dark" ? "☀️" : "🌙";

  try {
    localStorage.setItem("theme", newTheme);
  } catch (error) {
    console.warn("Failed to save theme preference");
  }
}

// Load saved theme
function loadTheme() {
  try {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.getElementById("theme-icon").textContent =
      savedTheme === "dark" ? "☀️" : "🌙";
  } catch (error) {
    console.warn("Failed to load theme preference");
  }
}

function showSection(section) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.classList.add("active");

  document.querySelectorAll(".section").forEach((sec) => {
    sec.classList.add("hidden");
  });

  document.getElementById(section + "-section").classList.remove("hidden");
  currentSection = section;

  if (section === "dashboard") {
    renderDashboard();
  } else if (section === "expenses") {
    renderExpenses();
  } else if (section === "reminders") {
    renderReminders();
  }
}

// Modal Management
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");

  const form = document.querySelector(`#${modalId} form`);
  if (form) {
    form.reset();

    const dueDateGroup = document.getElementById("due-date-group");
    if (dueDateGroup) {
      dueDateGroup.classList.add("hidden");
    }
  }
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
});

// Expense Management
function addExpense(event) {
  event.preventDefault();

  try {
    const formData = new FormData(event.target);
    const expense = {
      id: Date.now(),
      title: formData.get("title"),
      amount: parseFloat(formData.get("amount")),
      category: formData.get("category"),
      date: formData.get("date"),
      status: formData.get("status"),
      dueDate: formData.get("dueDate") || null,
      createdAt: new Date().toISOString(),
    };

    expenses.push(expense);
    saveData();
    updateSummary();
    renderExpenses();
    renderDashboard();
    closeModal("expense-modal");

    // Show success animation
    showNotification("Expense added successfully!", "success");
  } catch (error) {
    showError("Failed to add expense: " + error.message);
  }
}

function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenses = expenses.filter((expense) => expense.id !== id);
    saveData();
    updateSummary();
    renderExpenses();
    renderDashboard();
    showNotification("Expense deleted successfully!", "success");
  }
}

function toggleExpenseStatus(id) {
  const expense = expenses.find((exp) => exp.id === id);
  if (expense) {
    expense.status = expense.status === "Paid" ? "Due" : "Paid";
    saveData();
    updateSummary();
    renderExpenses();
    renderDashboard();
  }
}

function toggleDueDate(select) {
  const dueDateGroup = document.getElementById("due-date-group");
  if (select.value === "Due") {
    dueDateGroup.classList.remove("hidden");
    dueDateGroup.querySelector("input").required = true;
  } else {
    dueDateGroup.classList.add("hidden");
    dueDateGroup.querySelector("input").required = false;
  }
}

// Reminder Management
function addReminder(event) {
  event.preventDefault();

  try {
    const formData = new FormData(event.target);
    const reminder = {
      id: Date.now(),
      message: formData.get("message"),
      datetime: formData.get("datetime"),
      repeat: formData.get("repeat") === "on",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    reminders.push(reminder);
    saveData();
    renderReminders();
    renderDashboard();
    closeModal("reminder-modal");

    showNotification("Reminder added successfully!", "success");
  } catch (error) {
    showError("Failed to add reminder: " + error.message);
  }
}

function deleteReminder(id) {
  if (confirm("Are you sure you want to delete this reminder?")) {
    reminders = reminders.filter((reminder) => reminder.id !== id);
    saveData();
    renderReminders();
    renderDashboard();
    showNotification("Reminder deleted successfully!", "success");
  }
}

function toggleReminderStatus(id) {
  const reminder = reminders.find((rem) => rem.id === id);
  if (reminder) {
    reminder.completed = !reminder.completed;
    saveData();
    renderReminders();
    renderDashboard();
  }
}

// Filtering and Sorting
function filterExpenses() {
  const categoryFilter = document.getElementById("category-filter").value;
  const statusFilter = document.getElementById("status-filter").value;
  const sortFilter = document.getElementById("sort-filter").value;

  let filteredExpenses = [...expenses];

  // Apply filters
  if (categoryFilter) {
    filteredExpenses = filteredExpenses.filter(
      (exp) => exp.category === categoryFilter
    );
  }
  if (statusFilter) {
    filteredExpenses = filteredExpenses.filter(
      (exp) => exp.status === statusFilter
    );
  }

  // Apply sorting
  filteredExpenses.sort((a, b) => {
    switch (sortFilter) {
      case "date-desc":
        return new Date(b.date) - new Date(a.date);
      case "date-asc":
        return new Date(a.date) - new Date(b.date);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  renderExpensesList(filteredExpenses);
}

// Rendering Functions
function renderDashboard() {
  renderRecentExpenses();
  renderUpcomingReminders();
}

function renderRecentExpenses() {
  const container = document.getElementById("recent-expenses");
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recentExpenses.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No expenses yet</p></div>';
    return;
  }

  container.innerHTML = recentExpenses
    .map(
      (expense) => `
                <div class="expense-item ${
                  isOverdue(expense) ? "overdue" : ""
                }">
                    <div class="expense-info">
                        <h4>${expense.title}</h4>
                        <div class="expense-meta">${
                          expense.category
                        } • ${formatDate(expense.date)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="expense-amount">₹${expense.amount.toFixed(
                          2
                        )}</div>
                        <span class="status-badge status-${expense.status.toLowerCase()}">${
        expense.status
      }</span>
                    </div>
                </div>
            `
    )
    .join("");
}

function renderUpcomingReminders() {
  const container = document.getElementById("upcoming-reminders");
  const upcomingReminders = reminders
    .filter(
      (reminder) =>
        !reminder.completed && new Date(reminder.datetime) > new Date()
    )
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    .slice(0, 5);

  if (upcomingReminders.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⏰</div><p>No upcoming reminders</p></div>';
    return;
  }

  container.innerHTML = upcomingReminders
    .map(
      (reminder) => `
                <div class="expense-item">
                    <div class="expense-info">
                        <h4>${reminder.message}</h4>
                        <div class="expense-meta">${formatDateTime(
                          reminder.datetime
                        )}</div>
                    </div>
                    <div>
                        ${
                          reminder.repeat
                            ? '<span class="status-badge status-due">Repeat</span>'
                            : ""
                        }
                    </div>
                </div>
            `
    )
    .join("");
}

function renderExpenses() {
  filterExpenses(); // This will render the filtered list
}

function renderExpensesList(expenseList = expenses) {
  const container = document.getElementById("expenses-list");

  if (expenseList.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">💳</div><p>No expenses found</p></div>';
    return;
  }

  container.innerHTML = expenseList
    .map(
      (expense) => `
                <div class="expense-item ${
                  isOverdue(expense) ? "overdue" : ""
                }">
                    <div class="expense-info">
                        <h4>${expense.title}</h4>
                        <div class="expense-meta">
                            ${expense.category} • ${formatDate(expense.date)}
                            ${
                              expense.dueDate
                                ? ` • Due: ${formatDate(expense.dueDate)}`
                                : ""
                            }
                            ${
                              isOverdue(expense)
                                ? ' • <span class="text-danger">OVERDUE</span>'
                                : ""
                            }
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="text-align: right;">
                            <div class="expense-amount">₹${expense.amount.toFixed(
                              2
                            )}</div>
                            <span class="status-badge status-${getExpenseStatusClass(
                              expense
                            )}">${getExpenseStatus(expense)}</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="toggleExpenseStatus(${
                              expense.id
                            })" title="Toggle Status">
                                ${expense.status === "Paid" ? "↩️" : "✅"}
                            </button>
                            <button class="btn btn-danger" onclick="deleteExpense(${
                              expense.id
                            })" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `
    )
    .join("");
}

function renderReminders() {
  const container = document.getElementById("reminders-list");

  if (reminders.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⏰</div><p>No reminders yet</p></div>';
    return;
  }

  const sortedReminders = reminders.sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime)
  );

  container.innerHTML = sortedReminders
    .map(
      (reminder) => `
                <div class="expense-item ${
                  reminder.completed ? "opacity-50" : ""
                }">
                    <div class="expense-info">
                        <h4 style="${
                          reminder.completed
                            ? "text-decoration: line-through;"
                            : ""
                        }">${reminder.message}</h4>
                        <div class="expense-meta">
                            ${formatDateTime(reminder.datetime)}
                            ${reminder.repeat ? " • Repeats Daily" : ""}
                            ${reminder.completed ? " • Completed" : ""}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="toggleReminderStatus(${
                          reminder.id
                        })" title="Toggle Status">
                            ${reminder.completed ? "↩️" : "✅"}
                        </button>
                        <button class="btn btn-danger" onclick="deleteReminder(${
                          reminder.id
                        })" title="Delete">🗑️</button>
                    </div>
                </div>
            `
    )
    .join("");
}

// Summary Updates
function updateSummary() {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPaid = expenses
    .filter((exp) => exp.status === "Paid")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const totalDue = expenses
    .filter((exp) => exp.status === "Due")
    .reduce((sum, exp) => sum + exp.amount, 0);

  document.getElementById(
    "total-expenses"
  ).textContent = `₹${totalExpenses.toFixed(2)}`;
  document.getElementById("total-paid").textContent = `₹${totalPaid.toFixed(
    2
  )}`;
  document.getElementById("total-due").textContent = `₹${totalDue.toFixed(2)}`;
}

// Notification Management
function checkNotificationPermission() {
  if ("Notification" in window) {
    notificationPermission = Notification.permission;
    if (notificationPermission === "default") {
      document.getElementById("notification-banner").classList.remove("hidden");
    }
  } else {
    showError("Notifications are not supported in this browser.");
  }
}

function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      notificationPermission = permission;
      if (permission === "granted") {
        document.getElementById("notification-banner").classList.add("hidden");
        showNotification("Notifications enabled successfully!", "success");
      } else {
        showError("Notification permission denied. You won't receive alerts.");
      }
    });
  }
}

function showNotification(message, type = "info") {
  if (notificationPermission === "granted") {
    new Notification("Expense Tracker", {
      body: message,
      icon: "/favicon.ico",
    });
  }
}

function sendNotification(title, message) {
  if (notificationPermission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/favicon.ico",
      requireInteraction: true,
    });
  }
}

// Reminder Checker
function startReminderChecker() {
  setInterval(checkReminders, 60000); // Check every minute
  checkReminders(); // Check immediately
}

function checkReminders() {
  const now = new Date();

  // Check reminders
  reminders.forEach((reminder) => {
    if (!reminder.completed) {
      const reminderTime = new Date(reminder.datetime);

      if (now >= reminderTime) {
        sendNotification("Reminder", reminder.message);

        if (reminder.repeat) {
          // Set next day
          const nextDay = new Date(reminderTime);
          nextDay.setDate(nextDay.getDate() + 1);
          reminder.datetime = nextDay.toISOString().slice(0, 16);
        } else {
          reminder.completed = true;
        }
        saveData();
      }
    }
  });

  // Check overdue expenses
  expenses.forEach((expense) => {
    if (expense.status === "Due" && expense.dueDate && isOverdue(expense)) {
      const lastNotified = localStorage.getItem(`notified_${expense.id}`);
      const today = new Date().toDateString();

      if (lastNotified !== today) {
        sendNotification(
          "Overdue Payment",
          `You have an overdue payment: ₹${expense.amount} for ${expense.title}`
        );
        localStorage.setItem(`notified_${expense.id}`, today);
      }
    }
  });
}

// Utility Functions
function isOverdue(expense) {
  if (expense.status !== "Due" || !expense.dueDate) return false;
  return new Date(expense.dueDate) < new Date();
}

function getExpenseStatus(expense) {
  if (expense.status === "Due" && isOverdue(expense)) {
    return "OVERDUE";
  }
  return expense.status;
}

function getExpenseStatusClass(expense) {
  if (expense.status === "Due" && isOverdue(expense)) {
    return "overdue";
  }
  return expense.status.toLowerCase();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN");
}

function formatDateTime(dateTimeString) {
  return new Date(dateTimeString).toLocaleString("en-IN");
}

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  document.querySelector('input[name="date"]').value = today;
}

// Error Handling
function showError(message) {
  document.getElementById("error-message").textContent = message;
  openModal("error-modal");
}

function resetAllData() {
  if (
    confirm(
      "Are you sure you want to reset all data? This action cannot be undone."
    )
  ) {
    try {
      localStorage.clear();
      expenses = [];
      reminders = [];
      updateSummary();
      renderDashboard();
      renderExpenses();
      renderReminders();
      showNotification("All data has been reset successfully!", "success");
    } catch (error) {
      showError("Failed to reset data: " + error.message);
    }
  }
}

// Handle page visibility for notifications
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    checkReminders();
  }
});

// Load theme on startup
loadTheme();

// Handle 404 errors (simulate routing)
window.addEventListener("hashchange", function () {
  const hash = window.location.hash.slice(1);
  const validSections = ["dashboard", "expenses", "reminders"];

  if (hash && !validSections.includes(hash)) {
    showError("404 - Page Not Found: The requested page does not exist.");
    window.location.hash = "#dashboard";
  }
});

// Service Worker for offline support (optional enhancement)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    // Service worker registration would go here
    console.log("App loaded successfully");
  });
}

// Toogle notification
  function toggleReminderInfo() {
    const infoBox = document.getElementById("reminder-info-box");
    infoBox.style.display = infoBox.style.display === "block" ? "none" : "block";
  }

  function toggleReportMenu() {
    const dropdown = document.getElementById("report-dropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  }

  function openReportForm(type) {

    document.getElementById("report-dropdown").style.display = "none";

    document.getElementById("report-form-container").style.display = "block";
    document.getElementById("report-form-title").innerText = `Report ${type}`;
    
    document.getElementById("report-message").value = "";
    document.getElementById("report-status").style.display = "none";
  }

  function submitReportForm() {
    const message = document.getElementById("report-message").value.trim();
    if (!message) {
      alert("Please enter a message before submitting.");
      return;
    }

    document.getElementById("report-status").style.color = "#555";
    document.getElementById("report-status").innerText = "⏳ Submitting your report...";
    document.getElementById("report-status").style.display = "block";

    setTimeout(() => {
      document.getElementById("report-status").style.color = "green";
      document.getElementById("report-status").innerText = "✅ Thank you! Your report has been received.";
      document.getElementById("report-form-container").style.display = "none";
    }, 2000);
  }

  document.addEventListener("click", function (event) {
    const isReportBtn = event.target.closest(".btn.btn-secondary");
    const isDropdown = event.target.closest("#report-dropdown");
    if (!isReportBtn && !isDropdown) {
      document.getElementById("report-dropdown").style.display = "none";
    }
  });

  function openModal(id) {
    alert("Reminder modal will open (stub function).");
  }
