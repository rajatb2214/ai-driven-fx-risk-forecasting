const app = document.querySelector("#app");

const state = {
  token: localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user") || "null"),
  view: "dashboard",
  data: {
    dashboard: null,
    users: [],
    projects: [],
    tasks: []
  },
  loading: false,
  toast: ""
};

const icons = {
  dashboard: "▦",
  projects: "□",
  tasks: "✓",
  logout: "↳",
  plus: "+",
  trash: "×"
};

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

function toast(message) {
  state.toast = message;
  render();
  setTimeout(() => {
    state.toast = "";
    render();
  }, 2800);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function loadAll() {
  if (!state.token) return;
  state.loading = true;
  renderShell();
  try {
    const [dashboard, users, projects, tasks] = await Promise.all([
      api("/api/dashboard"),
      api("/api/users"),
      api("/api/projects"),
      api("/api/tasks")
    ]);
    state.data.dashboard = dashboard;
    state.data.users = users.users;
    state.data.projects = projects.projects;
    state.data.tasks = tasks.tasks;
  } catch (error) {
    toast(error.message);
    if (error.message === "Authentication required") logout();
  } finally {
    state.loading = false;
    render();
  }
}

function serialize(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function canManage() {
  return ["admin", "manager"].includes(state.user?.role);
}

function canDeleteProject() {
  return state.user?.role === "admin";
}

function formatStatus(value) {
  return String(value).replace("-", " ");
}

function authView(mode = "login", error = "") {
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-hero">
        <div class="brand-mark">E</div>
        <h1>Ethara Workbench</h1>
        <p>Plan projects, assign work, track delivery health, and review role-based progress in one focused workspace.</p>
      </div>
      <div class="auth-panel">
        <div class="auth-box">
          <h2>${mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p>${mode === "login" ? "Use a demo account or register as a member." : "New registrations are created with member access."}</p>
          <div class="tabs">
            <button class="tab ${mode === "login" ? "active" : ""}" data-auth-tab="login">Sign in</button>
            <button class="tab ${mode === "register" ? "active" : ""}" data-auth-tab="register">Register</button>
          </div>
          ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
          <form class="form" id="authForm">
            ${mode === "register" ? `
              <div class="field">
                <label for="name">Name</label>
                <input id="name" name="name" minlength="2" required placeholder="Your name" />
              </div>
            ` : ""}
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required value="${mode === "login" ? "admin@ethara.ai" : ""}" placeholder="you@example.com" />
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" minlength="8" required value="${mode === "login" ? "Admin@123" : ""}" placeholder="Minimum 8 characters" />
            </div>
            <button class="button" type="submit">${mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <div class="demo-box">
            <strong>Demo users</strong><br />
            admin@ethara.ai / Admin@123<br />
            manager@ethara.ai / Manager@123<br />
            member@ethara.ai / Member@123
          </div>
        </div>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    button.addEventListener("click", () => authView(button.dataset.authTab));
  });

  document.querySelector("#authForm").addEventListener("submit", async event => {
    event.preventDefault();
    const body = serialize(event.currentTarget);
    try {
      if (mode === "register") {
        await api("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
        authView("login");
        return toast("Account created. Please sign in.");
      }
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify(body) });
      setAuth(data.token, data.user);
      await loadAll();
    } catch (err) {
      authView(mode, err.message);
    }
  });
}

function shell(content) {
  app.innerHTML = `
    <section class="shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-mark">E</div>
          <div>
            <h1>Ethara Workbench</h1>
            <p>Project operations</p>
          </div>
        </div>
        <nav class="nav">
          ${navButton("dashboard", "Dashboard")}
          ${navButton("projects", "Projects")}
          ${navButton("tasks", "Tasks")}
        </nav>
        <div class="side-footer">
          <div class="profile">
            <strong>${escapeHtml(state.user.name)}</strong>
            <span>${escapeHtml(state.user.email)} · ${escapeHtml(state.user.role)}</span>
          </div>
          <button class="button secondary" id="logoutBtn">${icons.logout} Sign out</button>
        </div>
      </aside>
      <div class="main">
        <div class="mobile-top">
          <strong>${escapeHtml(state.user.name)} <span class="badge">${escapeHtml(state.user.role)}</span></strong>
          <button class="button secondary" id="mobileLogout">${icons.logout}</button>
        </div>
        ${content}
      </div>
    </section>
    ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
  `;

  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);
  document.querySelector("#mobileLogout")?.addEventListener("click", logout);
}

function navButton(view, label) {
  return `<button class="${state.view === view ? "active" : ""}" data-view="${view}"><span>${icons[view]}</span><span>${label}</span></button>`;
}

function dashboardView() {
  const d = state.data.dashboard;
  if (!d) return page("Dashboard", "Delivery health across your visible workspace.", `<div class="loading">Loading dashboard...</div>`);
  const maxStatus = Math.max(1, ...Object.values(d.statusCounts));
  const maxPriority = Math.max(1, ...Object.values(d.priorityCounts));
  return page("Dashboard", "Delivery health across your visible workspace.", `
    <div class="grid stats">
      ${stat("Projects", d.totals.projects)}
      ${stat("Tasks", d.totals.tasks)}
      ${stat("Completed", d.totals.completed)}
      ${stat("Overdue", d.totals.overdue)}
      ${stat("Completion", `${d.totals.completion}%`)}
    </div>
    <div class="grid content-grid">
      <section class="panel">
        <div class="panel-head"><h3>Status breakdown</h3><span class="badge">Live</span></div>
        <div class="bars">
          ${Object.entries(d.statusCounts).map(([key, value]) => bar(key, value, maxStatus)).join("")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>Priority load</h3><span class="badge">Risk</span></div>
        <div class="bars">
          ${Object.entries(d.priorityCounts).map(([key, value]) => bar(key, value, maxPriority)).join("")}
        </div>
      </section>
    </div>
    <section class="panel" style="margin-top:16px">
      <div class="panel-head"><h3>Upcoming work</h3><button class="button secondary" data-view="tasks">Open tasks</button></div>
      ${d.recentTasks.length ? `<div class="grid cards">${d.recentTasks.map(taskCard).join("")}</div>` : empty("No tasks are visible yet.")}
    </section>
  `);
}

function projectsView() {
  const projects = state.data.projects;
  return page("Projects", "Create delivery spaces, track progress, and keep ownership clear.", `
    <div class="split">
      ${canManage() ? projectForm() : `<div class="empty">Members can view assigned projects and update their task status.</div>`}
      <div class="grid cards">
        ${projects.length ? projects.map(projectCard).join("") : empty("No projects available.")}
      </div>
    </div>
  `, bindProjects);
}

function tasksView() {
  const tasks = state.data.tasks;
  return page("Tasks", "Manage assignments with status, priority, assignee, and due dates.", `
    <div class="split">
      ${canManage() ? taskForm() : `<div class="empty">Members can update status on tasks assigned to them.</div>`}
      <div class="grid cards">
        ${tasks.length ? tasks.map(taskCard).join("") : empty("No tasks available.")}
      </div>
    </div>
  `, bindTasks);
}

function page(title, subtitle, body, bind) {
  shell(`
    <header class="topbar">
      <div class="section-title">
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <span class="badge">${escapeHtml(state.user.role)}</span>
    </header>
    ${state.loading ? `<div class="loading">Loading workspace...</div>` : body}
  `);
  if (!state.loading && bind) bind();
}

function stat(label, value) {
  return `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function bar(label, value, max) {
  return `
    <div class="bar-row">
      <div class="bar-label"><span>${formatStatus(label)}</span><span>${value}</span></div>
      <div class="bar"><i style="--w:${Math.max(4, (value / max) * 100)}%"></i></div>
    </div>
  `;
}

function projectForm() {
  return `
    <section class="panel">
      <div class="panel-head"><h3>New project</h3><span class="badge">${icons.plus}</span></div>
      <form class="form" id="projectForm">
        <div class="field"><label>Name</label><input name="name" required minlength="3" placeholder="Project name" /></div>
        <div class="field"><label>Description</label><textarea name="description" required minlength="10" placeholder="What will this project deliver?"></textarea></div>
        <div class="field"><label>Status</label><select name="status"><option value="planning">Planning</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></div>
        <div class="field"><label>Owner</label><select name="ownerId">${state.data.users.map(userOption).join("")}</select></div>
        <div class="field"><label>Due date</label><input name="dueDate" type="date" required /></div>
        <button class="button" type="submit">${icons.plus} Create project</button>
      </form>
    </section>
  `;
}

function taskForm() {
  return `
    <section class="panel">
      <div class="panel-head"><h3>New task</h3><span class="badge">${icons.plus}</span></div>
      <form class="form" id="taskForm">
        <div class="field"><label>Project</label><select name="projectId" required>${state.data.projects.map(projectOption).join("")}</select></div>
        <div class="field"><label>Title</label><input name="title" required minlength="3" placeholder="Task title" /></div>
        <div class="field"><label>Description</label><textarea name="description" required minlength="8" placeholder="Task details"></textarea></div>
        <div class="field"><label>Assignee</label><select name="assigneeId" required>${state.data.users.map(userOption).join("")}</select></div>
        <div class="field"><label>Status</label><select name="status">${statusOptions()}</select></div>
        <div class="field"><label>Priority</label><select name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select></div>
        <div class="field"><label>Due date</label><input name="dueDate" type="date" required /></div>
        <button class="button" type="submit">${icons.plus} Create task</button>
      </form>
    </section>
  `;
}

function projectCard(project) {
  return `
    <article class="card">
      <div>
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.description)}</p>
      </div>
      <div class="meta">
        <span class="badge project-${project.status}">${escapeHtml(project.status)}</span>
        <span class="badge">${project.progress}% complete</span>
        <span class="badge">${project.taskCount} tasks</span>
      </div>
      <div class="bar"><i style="--w:${project.progress || 4}%"></i></div>
      <p>Owner: ${escapeHtml(project.owner?.name || "Unassigned")} · Due ${escapeHtml(project.dueDate)}</p>
      ${canDeleteProject() ? `<div class="actions"><button class="button danger" data-delete-project="${project.id}">${icons.trash} Delete</button></div>` : ""}
    </article>
  `;
}

function taskCard(task) {
  return `
    <article class="card">
      <div>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description)}</p>
      </div>
      <div class="meta">
        <span class="badge status ${task.status}">${formatStatus(task.status)}</span>
        <span class="badge priority-${task.priority}">${escapeHtml(task.priority)}</span>
      </div>
      <p>${escapeHtml(task.project?.name || "No project")} · ${escapeHtml(task.assignee?.name || "Unassigned")} · Due ${escapeHtml(task.dueDate)}</p>
      <div class="actions">
        <select data-status-task="${task.id}">
          ${statusOptions(task.status)}
        </select>
        ${canManage() ? `<button class="button danger" data-delete-task="${task.id}">${icons.trash} Delete</button>` : ""}
      </div>
    </article>
  `;
}

function userOption(user) {
  return `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.role)})</option>`;
}

function projectOption(project) {
  return `<option value="${project.id}">${escapeHtml(project.name)}</option>`;
}

function statusOptions(selected = "todo") {
  return ["todo", "in-progress", "review", "done"]
    .map(status => `<option value="${status}" ${selected === status ? "selected" : ""}>${formatStatus(status)}</option>`)
    .join("");
}

function empty(message) {
  return `<div class="empty">${message}</div>`;
}

function bindProjects() {
  document.querySelector("#projectForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await api("/api/projects", { method: "POST", body: JSON.stringify(serialize(event.currentTarget)) });
      event.currentTarget.reset();
      toast("Project created");
      await loadAll();
    } catch (error) {
      toast(error.message);
    }
  });

  document.querySelectorAll("[data-delete-project]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/projects/${button.dataset.deleteProject}`, { method: "DELETE" });
        toast("Project deleted");
        await loadAll();
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function bindTasks() {
  document.querySelector("#taskForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await api("/api/tasks", { method: "POST", body: JSON.stringify(serialize(event.currentTarget)) });
      event.currentTarget.reset();
      toast("Task created");
      await loadAll();
    } catch (error) {
      toast(error.message);
    }
  });

  document.querySelectorAll("[data-status-task]").forEach(select => {
    select.addEventListener("change", async () => {
      try {
        await api(`/api/tasks/${select.dataset.statusTask}`, { method: "PUT", body: JSON.stringify({ status: select.value }) });
        toast("Task status updated");
        await loadAll();
      } catch (error) {
        toast(error.message);
      }
    });
  });

  document.querySelectorAll("[data-delete-task]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/tasks/${button.dataset.deleteTask}`, { method: "DELETE" });
        toast("Task deleted");
        await loadAll();
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function renderShell() {
  if (!state.token) return authView();
  const views = {
    dashboard: dashboardView,
    projects: projectsView,
    tasks: tasksView
  };
  views[state.view]();
}

function render() {
  if (!state.token) return authView();
  renderShell();
}

function logout() {
  setAuth(null, null);
  state.data = { dashboard: null, users: [], projects: [], tasks: [] };
  authView();
}

if (state.token) {
  loadAll();
} else {
  authView();
}
