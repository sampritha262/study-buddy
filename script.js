const $ = (id) => document.getElementById(id);

// Tabs
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    $(tab.dataset.panel).classList.add("active");
  });
});

// Study planner
$("plannerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const subjects = $("subjects").value.split(",").map(s => s.trim()).filter(Boolean);
  const hours = Number($("hours").value);
  const breakMinutes = Number($("breakMinutes").value);
  const output = $("planOutput");
  if (!subjects.length || !hours || hours < 1 || hours > 12) {
    output.textContent = "Please enter at least one subject and between 1 and 12 study hours.";
    return;
  }

  const totalMinutes = hours * 60;
  const studyMinutes = Math.max(15, Math.floor((totalMinutes - breakMinutes * (subjects.length - 1)) / subjects.length));
  let start = 9 * 60;
  const items = [];
  subjects.forEach((subject, index) => {
    const end = start + studyMinutes;
    items.push({ time: `${formatTime(start)} – ${formatTime(end)}`, subject, detail: `${studyMinutes} minutes of focused study` });
    start = end;
    if (index < subjects.length - 1) {
      items.push({ time: `${formatTime(start)} – ${formatTime(start + breakMinutes)}`, subject: "Short break", detail: "Stretch, drink water, and rest your eyes" });
      start += breakMinutes;
    }
  });
  output.classList.remove("empty-state");
  output.innerHTML = items.map(item => `<div class="plan-item"><div class="plan-time">${escapeHTML(item.time)}</div><div><div class="plan-subject">${escapeHTML(item.subject)}</div><div class="plan-detail">${escapeHTML(item.detail)}</div></div></div>`).join("");
  localStorage.setItem("studyPlan", JSON.stringify({ subjects, hours, breakMinutes }));
  $("sessionCount").textContent = String(Number(localStorage.getItem("sessionCount") || 0) + 1);
  localStorage.setItem("sessionCount", $("sessionCount").textContent);
});

function formatTime(minutes) {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

// Assignment tracker, persisted in localStorage
let tasks = JSON.parse(localStorage.getItem("studyTasks") || "[]");
function saveTasks() {
  localStorage.setItem("studyTasks", JSON.stringify(tasks));
  renderTasks();
}
function renderTasks() {
  const list = $("taskList");
  $("totalTasks").textContent = tasks.length;
  $("completedTasks").textContent = tasks.filter(task => task.done).length;
  if (!tasks.length) {
    list.innerHTML = '<div class="no-tasks">No assignments yet. Add your first task above ✨</div>';
    return;
  }
  list.innerHTML = tasks.map(task => `
    <div class="task-item ${task.done ? "done" : ""}">
      <input type="checkbox" aria-label="Mark task complete" data-action="toggle" data-id="${task.id}" ${task.done ? "checked" : ""}>
      <div class="task-main"><div class="task-title">${escapeHTML(task.name)}</div><div class="task-meta">${escapeHTML(task.subject || "General")} · ${task.due ? "Due " + escapeHTML(task.due) : "No due date"}</div></div>
      <button class="delete-btn" data-action="delete" data-id="${task.id}" aria-label="Delete task">✕</button>
    </div>`).join("");
}
$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  tasks.unshift({ id: Date.now(), name: $("taskName").value.trim(), subject: $("taskSubject").value.trim(), due: $("taskDate").value, done: false });
  saveTasks();
  $("taskForm").reset();
});
$("taskList").addEventListener("change", event => {
  if (event.target.dataset.action === "toggle") {
    const task = tasks.find(item => item.id === Number(event.target.dataset.id));
    if (task) { task.done = event.target.checked; saveTasks(); }
  }
});
$("taskList").addEventListener("click", event => {
  const button = event.target.closest('[data-action="delete"]');
  if (button) { tasks = tasks.filter(task => task.id !== Number(button.dataset.id)); saveTasks(); }
});

// Study Buddy demo chatbot
function getReply(question) {
  const q = question.toLowerCase();
  if (q.includes("tip") || q.includes("concentrat")) return "Try these study tips:\n1. Study one topic at a time.\n2. Keep notifications off while studying.\n3. Use 25-minute focus sessions with short breaks.\n4. Practise questions instead of only rereading notes.\n5. Review what you learned at the end of the day.";
  if (q.includes("exam") || q.includes("revision")) return "For exam preparation:\n1. List all the topics you need to cover.\n2. Start with the topics you find hardest.\n3. Make short notes of key ideas.\n4. Practise past questions.\n5. Keep time for sleep and a final review.";
  if (q.includes("html")) return "HTML means HyperText Markup Language. It provides the structure of a web page. For example, <h1>Hello</h1> creates a main heading.";
  if (q.includes("css")) return "CSS means Cascading Style Sheets. It controls how a web page looks, including colours, spacing, layout, and fonts.";
  if (q.includes("javascript") || q.includes(" js")) return "JavaScript adds interactivity to websites. It can respond to button clicks, validate forms, update content, and save data in the browser.";
  if (q.includes("python")) return 'Python is a beginner-friendly programming language. Example: print("Hello, world!") displays Hello, world! in the output.';
  if (q.includes("timetable") || q.includes("schedule") || q.includes("plan")) return "Open the Study Planner tab, enter your subjects separated by commas, choose your available hours, and select “Create my timetable.”";
  if (q.includes("hello") || q === "hi" || q.includes("hey")) return "Hello! 😊 What are you studying today? You can ask me about study tips, exam preparation, HTML, CSS, or JavaScript.";
  if (q.includes("stress") || q.includes("tired")) return "Try breaking your work into one small task, taking a short break, and asking a teacher or friend for help if you feel stuck. You don't have to finish everything at once.";
  return "I can help with built-in topics for this demo: study tips, exam preparation, HTML, CSS, JavaScript, Python, and making a timetable. For answers to any question, this prototype would need to be connected to a real AI service.";
}
function addMessage(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type === "user" ? "user-bubble" : "bot-bubble"}`;
  bubble.textContent = text;
  $("chatMessages").appendChild(bubble);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
}
$("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const question = $("chatInput").value.trim();
  if (!question) return;
  addMessage(question, "user");
  addMessage(getReply(question), "bot");
  $("chatInput").value = "";
});
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => {
    $("chatInput").value = button.dataset.prompt;
    $("chatForm").requestSubmit();
  });
});

// Quick quiz
const questions = [
  { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "Hyper Transfer Main Link"], answer: 0, explain: "HTML stands for HyperText Markup Language." },
  { question: "Which technology is mainly used to style a web page?", options: ["SQL", "CSS", "Python"], answer: 1, explain: "CSS styles a page with colours, spacing, fonts, and layout." },
  { question: "Which JavaScript method selects an element by its ID?", options: ["getElementById()", "selectByClass()", "findHTML()"], answer: 0, explain: "document.getElementById() selects an element by its ID." }
];
let questionIndex = 0, score = 0, answered = false;
function renderQuestion() {
  const q = questions[questionIndex];
  $("quizProgress").textContent = `Question ${questionIndex + 1} of ${questions.length}`;
  $("quizScore").textContent = `Score: ${score}`;
  $("progressFill").style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
  $("quizQuestion").textContent = q.question;
  $("quizFeedback").textContent = "";
  $("nextQuestion").disabled = true;
  $("nextQuestion").textContent = questionIndex === questions.length - 1 ? "See result ↗" : "Next question →";
  answered = false;
  $("quizOptions").innerHTML = "";
  q.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.textContent = option;
    button.addEventListener("click", () => chooseAnswer(index));
    $("quizOptions").appendChild(button);
  });
}
function chooseAnswer(selected) {
  if (answered) return;
  answered = true;
  const q = questions[questionIndex];
  const buttons = [...$("quizOptions").querySelectorAll("button")];
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === q.answer) button.classList.add("correct");
    if (index === selected && selected !== q.answer) button.classList.add("wrong");
  });
  if (selected === q.answer) score++;
  $("quizScore").textContent = `Score: ${score}`;
  $("quizFeedback").textContent = `${selected === q.answer ? "Correct! 🎉 " : "Not quite. "} ${q.explain}`;
  $("nextQuestion").disabled = false;
}
$("nextQuestion").addEventListener("click", () => {
  if (questionIndex < questions.length - 1) {
    questionIndex++;
    renderQuestion();
  } else {
    $("quizQuestion").textContent = `You scored ${score} out of ${questions.length}!`;
    $("quizOptions").innerHTML = "";
    $("quizFeedback").textContent = score === questions.length ? "Excellent work. Keep it up!" : "Good effort! Review the answers and try again.";
    $("nextQuestion").textContent = "Try again ↻";
    $("nextQuestion").disabled = false;
    $("nextQuestion").onclick = () => { questionIndex = 0; score = 0; $("nextQuestion").onclick = null; renderQuestion(); };
  }
});

// Restore dashboard counts and first question on load
$("sessionCount").textContent = localStorage.getItem("sessionCount") || "0";
renderTasks();
renderQuestion();
