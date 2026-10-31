const display = document.querySelector("#display");
const expressionDisplay = document.querySelector("#expression");
const buttons = document.querySelector(".buttons");
const historyToggle = document.querySelector("#history-toggle");
const historyPanel = document.querySelector("#history-panel");
const historyList = document.querySelector("#history-list");
const clearHistoryButton = document.querySelector("#clear-history");
const themeToggle = document.querySelector("#theme-toggle");

let currentNumber = "0";
let storedNumber = null;
let selectedOperator = null;
let shouldResetDisplay = false;
let currentExpression = "";
let calculationHistory = loadHistory();

// Keep both display lines in sync with the calculator state.
function updateDisplay() {
  display.textContent = currentNumber;
  expressionDisplay.textContent = currentExpression;
}

function setExpression(expression) {
  currentExpression = expression;
  expressionDisplay.textContent = expression;
}

// Read saved calculations without stopping the calculator if storage is unavailable.
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("calculator-history")) || [];
  } catch (error) {
    return [];
  }
}

function saveHistory(expression, result) {
  calculationHistory.unshift({ expression, result });
  calculationHistory = calculationHistory.slice(0, 50);
  try {
    localStorage.setItem("calculator-history", JSON.stringify(calculationHistory));
  } catch (error) {
    // History still works for the current session when storage is unavailable.
  }
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (calculationHistory.length === 0) {
    historyList.innerHTML = '<p class="empty-history">No calculations yet.</p>';
    return;
  }

  calculationHistory.forEach((item) => {
    const historyItem = document.createElement("button");
    historyItem.className = "history-item";
    historyItem.type = "button";
    historyItem.textContent = `${item.expression} = ${item.result}`;
    historyItem.addEventListener("click", () => {
      currentNumber = item.result;
      storedNumber = null;
      selectedOperator = null;
      shouldResetDisplay = true;
      setExpression("");
      updateDisplay();
    });
    historyList.appendChild(historyItem);
  });
}

// Start a new number after an operation has been completed.
function enterNumber(number) {
  if (currentNumber === "Error" || shouldResetDisplay) {
    currentNumber = number === "." ? "0." : number;
    shouldResetDisplay = false;
  } else if (number === "." && currentNumber.includes(".")) {
    return;
  } else if (currentNumber === "0" && number !== ".") {
    currentNumber = number;
  } else {
    currentNumber += number;
  }

  if (storedNumber !== null && selectedOperator !== null) {
    setExpression(`${storedNumber} ${selectedOperator} ${currentNumber}`);
  }
  updateDisplay();
}

function chooseOperator(operator) {
  if (currentNumber === "Error") {
    return;
  }

  if (selectedOperator && storedNumber !== null && !shouldResetDisplay) {
    calculate();
  }

  storedNumber = Number(currentNumber);
  selectedOperator = operator;
  shouldResetDisplay = true;
  setExpression(`${storedNumber} ${selectedOperator}`);
}

function calculate() {
  if (storedNumber === null || selectedOperator === null) {
    return;
  }

  const secondNumber = Number(currentNumber);
  const expression = `${storedNumber} ${selectedOperator} ${secondNumber}`;
  let result;

  if (selectedOperator === "+") {
    result = storedNumber + secondNumber;
  } else if (selectedOperator === "-") {
    result = storedNumber - secondNumber;
  } else if (selectedOperator === "×") {
    result = storedNumber * secondNumber;
  } else if (selectedOperator === "÷") {
    if (secondNumber === 0) {
      currentNumber = "Error";
      storedNumber = null;
      selectedOperator = null;
      shouldResetDisplay = true;
      setExpression("");
      updateDisplay();
      return;
    }
    result = storedNumber / secondNumber;
  }

  currentNumber = String(Number(result.toFixed(10)));
  saveHistory(expression, currentNumber);
  storedNumber = null;
  selectedOperator = null;
  shouldResetDisplay = true;
  setExpression("");
  updateDisplay();
}

function clearCalculator() {
  currentNumber = "0";
  storedNumber = null;
  selectedOperator = null;
  shouldResetDisplay = false;
  setExpression("");
  updateDisplay();
}

function deleteLastDigit() {
  if (currentNumber === "Error" || shouldResetDisplay) {
    clearCalculator();
    return;
  }

  currentNumber = currentNumber.length > 1
    ? currentNumber.slice(0, -1)
    : "0";
  if (storedNumber !== null && selectedOperator !== null) {
    setExpression(`${storedNumber} ${selectedOperator} ${currentNumber}`);
  }
  updateDisplay();
}

// Handle clicks for all calculator buttons.
buttons.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  if (button.dataset.number !== undefined) {
    enterNumber(button.dataset.number);
  } else if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action === "equals") {
    calculate();
  } else if (button.dataset.action === "clear") {
    clearCalculator();
  } else if (button.dataset.action === "delete") {
    deleteLastDigit();
  }
});

historyToggle.addEventListener("click", () => {
  const isOpen = historyPanel.classList.toggle("open");
  historyToggle.setAttribute("aria-expanded", isOpen);
});

clearHistoryButton.addEventListener("click", () => {
  calculationHistory = [];
  try {
    localStorage.removeItem("calculator-history");
  } catch (error) {
    // The visible history is still cleared for the current session.
  }
  renderHistory();
});

themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-theme");
  themeToggle.textContent = isLight ? "Dark" : "Light";
});

// Support the requested keyboard shortcuts.
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[0-9.]$/.test(event.key)) {
    enterNumber(event.key);
  } else if (["+", "-", "*", "/", "×", "÷", "−"].includes(event.key)) {
    const operators = {
      "+": "+", "-": "-", "*": "×", "/": "÷",
      "×": "×", "÷": "÷", "−": "-"
    };
    chooseOperator(operators[event.key]);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  } else if (event.key === "Backspace") {
    event.preventDefault();
    deleteLastDigit();
  } else if (event.key.toLowerCase() === "c" || event.key === "Escape") {
    clearCalculator();
  }
});

renderHistory();