const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "db.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const STATUSES = ["todo", "in-progress", "review", "done"];
const PRIORITIES = ["low", "medium", "high"];
const ROLES = ["admin", "manager", "member"];

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return hashPassword(password, salt).split(":")[1] === hash;
}

function now() {
  return new Date().toISOString();
}

function seedDb() {
  const adminId = id("usr");
  const managerId = id("usr");
  const memberId = id("usr");
  const projectA = id("prj");
  const projectB = id("prj");

  return {
    users: [
      {
        id: adminId,
        name: "Aarav Admin",
        email: "admin@ethara.ai",
        role: "admin",
        passwordHash: hashPassword("Admin@123"),
        createdAt: now()
      },
      {
        id: managerId,
        name: "Meera Manager",
        email: "manager@ethara.ai",
        role: "manager",
        passwordHash: hashPassword("Manager@123"),
        createdAt: now()
      },
      {
        id: memberId,
        name: "Rajat Member",
        email: "member@ethara.ai",
        role: "member",
        passwordHash: hashPassword("Member@123"),
        createdAt: now()
      }
    ],
    projects: [
      {
        id: projectA,
        name: "Ethara Launch Workspace",
        description: "Coordinate launch work across design, backend, and QA.",
        status: "active",
        ownerId: managerId,
        dueDate: "2026-05-18",
        createdAt: now()
      },
      {
        id: projectB,
        name: "Candidate Review Portal",
        description: "Build review screens, scorecards, and operational reports.",
        status: "planning",
        ownerId: adminId,
        dueDate: "2026-05-24",
        createdAt: now()
      }
    ],
    tasks: [
      {
        id: id("tsk"),
        projectId: projectA,
        title: "Create authenticated dashboard shell",
        description: "Protected routes with responsive navigation and role-aware actions.",
        status: "done",
        priority: "high",
        assigneeId: memberId,
        dueDate: "2026-05-09",
        createdAt: now()
      },
      {
        id: id("tsk"),
        projectId: projectA,
        title: "Add API validation and error responses",
        description: "Return useful messages for missing fields and invalid role actions.",
        status: "review",
        priority: "high",
        assigneeId: managerId,
        dueDate: "2026-05-10",
        createdAt: now()
      },
      {
        id: id("tsk"),
        projectId: projectB,
        title: "Prepare analytics cards",
        description: "Show completion, workload, overdue, and priority breakdowns.",
        status: "in-progress",
        priority: "medium",
        assigneeId: memberId,
        dueDate: "2026-05-12",
        createdAt: now()
      },
      {
        id: id("tsk"),
        projectId: projectB,
        title: "Mobile polish pass",
        description: "Tighten spacing, empty states, and compact form layout.",
        status: "todo",
        priority: "low",
        assigneeId: managerId,
        dueDate: "2026-05-16",
        createdAt: now()
      }
    ],
    sessions: []
  };
}

function ensureDb() {
  if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(seedDb(), null, 2));
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Invalid JSON body"), { status: 400 }));
      }
    });
  });
}

function send(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function fail(res, status, message, details = {}) {
  send(res, status, { error: message, details });
}

function getAuth(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = db.sessions.find(item => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  return db.users.find(user => user.id === session.userId) || null;
}

function requireAuth(req, res, db) {
  const user = getAuth(req, db);
  if (!user) fail(res, 401, "Authentication required");
  return user;
}

function requireRole(res, user, roles) {
  if (!roles.includes(user.role)) {
    fail(res, 403, "You do not have permission to perform this action", { requiredRoles: roles });
    return false;
  }
  return true;
}

function validateRequired(body, fields) {
  return fields.filter(field => !String(body[field] || "").trim());
}

function taskVisibleTo(user, task, projects) {
  if (user.role === "admin" || user.role === "manager") return true;
  const project = projects.find(item => item.id === task.projectId);
  return task.assigneeId === user.id || project?.ownerId === user.id;
}

function projectVisibleTo(user, project, tasks) {
  if (user.role === "admin" || user.role === "manager") return true;
  return project.ownerId === user.id || tasks.some(task => task.projectId === project.id && task.assigneeId === user.id);
}

function enrichProject(project, db) {
  const tasks = db.tasks.filter(task => task.projectId === project.id);
  const done = tasks.filter(task => task.status === "done").length;
  return {
    ...project,
    owner: publicUser(db.users.find(user => user.id === project.ownerId)),
    taskCount: tasks.length,
    completedTasks: done,
    progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0
  };
}

function enrichTask(task, db) {
  return {
    ...task,
    assignee: publicUser(db.users.find(user => user.id === task.assigneeId)),
    project: db.projects.find(project => project.id === task.projectId) || null
  };
}

function dashboardFor(user, db) {
  const projects = db.projects.filter(project => projectVisibleTo(user, project, db.tasks));
  const tasks = db.tasks.filter(task => taskVisibleTo(user, task, db.projects));
  const overdue = tasks.filter(task => task.status !== "done" && task.dueDate < new Date().toISOString().slice(0, 10));
  const statusCounts = Object.fromEntries(STATUSES.map(status => [status, tasks.filter(task => task.status === status).length]));
  const priorityCounts = Object.fromEntries(PRIORITIES.map(priority => [priority, tasks.filter(task => task.priority === priority).length]));
  const completion = tasks.length ? Math.round((statusCounts.done / tasks.length) * 100) : 0;

  return {
    totals: {
      projects: projects.length,
      tasks: tasks.length,
      completed: statusCounts.done,
      overdue: overdue.length,
      completion
    },
    statusCounts,
    priorityCounts,
    recentTasks: tasks
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6)
      .map(task => enrichTask(task, db))
  };
}

async function handleApi(req, res, url) {
  const db = readDb();
  const method = req.method;
  const parts = url.pathname.split("/").filter(Boolean);

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const body = await parseBody(req);
    const user = db.users.find(item => item.email.toLowerCase() === String(body.email || "").trim().toLowerCase());
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) {
      return fail(res, 401, "Invalid email or password");
    }
    const token = crypto.randomBytes(32).toString("hex");
    db.sessions.push({ token, userId: user.id, createdAt: now(), expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() });
    writeDb(db);
    return send(res, 200, { token, user: publicUser(user) });
  }

  if (method === "POST" && url.pathname === "/api/auth/register") {
    const body = await parseBody(req);
    const missing = validateRequired(body, ["name", "email", "password"]);
    if (missing.length) return fail(res, 400, "Missing required fields", { fields: missing });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return fail(res, 400, "Please enter a valid email address");
    if (String(body.password).length < 8) return fail(res, 400, "Password must be at least 8 characters");
    if (db.users.some(user => user.email.toLowerCase() === body.email.toLowerCase())) return fail(res, 409, "Email is already registered");
    const user = {
      id: id("usr"),
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      role: "member",
      passwordHash: hashPassword(String(body.password)),
      createdAt: now()
    };
    db.users.push(user);
    writeDb(db);
    return send(res, 201, { user: publicUser(user) });
  }

  const user = requireAuth(req, res, db);
  if (!user) return;

  if (method === "GET" && url.pathname === "/api/me") return send(res, 200, { user: publicUser(user) });

  if (method === "GET" && url.pathname === "/api/users") {
    return send(res, 200, { users: db.users.map(publicUser) });
  }

  if (method === "GET" && url.pathname === "/api/dashboard") {
    return send(res, 200, dashboardFor(user, db));
  }

  if (method === "GET" && url.pathname === "/api/projects") {
    const projects = db.projects.filter(project => projectVisibleTo(user, project, db.tasks)).map(project => enrichProject(project, db));
    return send(res, 200, { projects });
  }

  if (method === "POST" && url.pathname === "/api/projects") {
    if (!requireRole(res, user, ["admin", "manager"])) return;
    const body = await parseBody(req);
    const missing = validateRequired(body, ["name", "description", "dueDate"]);
    if (missing.length) return fail(res, 400, "Missing required fields", { fields: missing });
    const project = {
      id: id("prj"),
      name: String(body.name).trim(),
      description: String(body.description).trim(),
      status: ["planning", "active", "paused", "completed"].includes(body.status) ? body.status : "planning",
      ownerId: body.ownerId && db.users.some(item => item.id === body.ownerId) ? body.ownerId : user.id,
      dueDate: String(body.dueDate),
      createdAt: now()
    };
    db.projects.push(project);
    writeDb(db);
    return send(res, 201, { project: enrichProject(project, db) });
  }

  if (parts[0] === "api" && parts[1] === "projects" && parts[2]) {
    const project = db.projects.find(item => item.id === parts[2]);
    if (!project) return fail(res, 404, "Project not found");
    if (!projectVisibleTo(user, project, db.tasks)) return fail(res, 403, "You cannot access this project");

    if (method === "GET") return send(res, 200, { project: enrichProject(project, db) });

    if (method === "PUT") {
      if (!requireRole(res, user, ["admin", "manager"])) return;
      const body = await parseBody(req);
      project.name = String(body.name || project.name).trim();
      project.description = String(body.description || project.description).trim();
      project.status = ["planning", "active", "paused", "completed"].includes(body.status) ? body.status : project.status;
      project.ownerId = body.ownerId && db.users.some(item => item.id === body.ownerId) ? body.ownerId : project.ownerId;
      project.dueDate = body.dueDate || project.dueDate;
      writeDb(db);
      return send(res, 200, { project: enrichProject(project, db) });
    }

    if (method === "DELETE") {
      if (!requireRole(res, user, ["admin"])) return;
      db.projects = db.projects.filter(item => item.id !== project.id);
      db.tasks = db.tasks.filter(task => task.projectId !== project.id);
      writeDb(db);
      return send(res, 200, { ok: true });
    }
  }

  if (method === "GET" && url.pathname === "/api/tasks") {
    const tasks = db.tasks.filter(task => taskVisibleTo(user, task, db.projects)).map(task => enrichTask(task, db));
    return send(res, 200, { tasks });
  }

  if (method === "POST" && url.pathname === "/api/tasks") {
    if (!requireRole(res, user, ["admin", "manager"])) return;
    const body = await parseBody(req);
    const missing = validateRequired(body, ["projectId", "title", "description", "assigneeId", "dueDate"]);
    if (missing.length) return fail(res, 400, "Missing required fields", { fields: missing });
    if (!db.projects.some(project => project.id === body.projectId)) return fail(res, 400, "Selected project does not exist");
    if (!db.users.some(item => item.id === body.assigneeId)) return fail(res, 400, "Selected assignee does not exist");
    const task = {
      id: id("tsk"),
      projectId: body.projectId,
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      status: STATUSES.includes(body.status) ? body.status : "todo",
      priority: PRIORITIES.includes(body.priority) ? body.priority : "medium",
      assigneeId: body.assigneeId,
      dueDate: String(body.dueDate),
      createdAt: now()
    };
    db.tasks.push(task);
    writeDb(db);
    return send(res, 201, { task: enrichTask(task, db) });
  }

  if (parts[0] === "api" && parts[1] === "tasks" && parts[2]) {
    const task = db.tasks.find(item => item.id === parts[2]);
    if (!task) return fail(res, 404, "Task not found");
    if (!taskVisibleTo(user, task, db.projects)) return fail(res, 403, "You cannot access this task");

    if (method === "PUT") {
      const body = await parseBody(req);
      const fullEdit = user.role === "admin" || user.role === "manager";
      if (!fullEdit && Object.keys(body).some(key => !["status"].includes(key))) {
        return fail(res, 403, "Members can only update task status");
      }
      task.status = STATUSES.includes(body.status) ? body.status : task.status;
      if (fullEdit) {
        task.title = String(body.title || task.title).trim();
        task.description = String(body.description || task.description).trim();
        task.priority = PRIORITIES.includes(body.priority) ? body.priority : task.priority;
        task.projectId = body.projectId && db.projects.some(project => project.id === body.projectId) ? body.projectId : task.projectId;
        task.assigneeId = body.assigneeId && db.users.some(item => item.id === body.assigneeId) ? body.assigneeId : task.assigneeId;
        task.dueDate = body.dueDate || task.dueDate;
      }
      writeDb(db);
      return send(res, 200, { task: enrichTask(task, db) });
    }

    if (method === "DELETE") {
      if (!requireRole(res, user, ["admin", "manager"])) return;
      db.tasks = db.tasks.filter(item => item.id !== task.id);
      writeDb(db);
      return send(res, 200, { ok: true });
    }
  }

  fail(res, 404, "API route not found");
}

function serveStatic(req, res, url) {
  let filePath = url.pathname === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(PUBLIC_DIR, "index.html");
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }
    serveStatic(req, res, url);
  } catch (error) {
    fail(res, error.status || 500, error.message || "Something went wrong");
  }
});

ensureDb();
server.listen(PORT, () => {
  console.log(`Ethara assessment app running at http://localhost:${PORT}`);
});
