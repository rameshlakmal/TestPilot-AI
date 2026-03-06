/**
 * Jira Cloud REST API integration.
 * Uses Basic Auth (email + API token) against Jira Cloud v2/v3 endpoints.
 */

function getConfig() {
  return {
    baseUrl: (process.env.JIRA_BASE_URL || "").replace(/\/+$/, ""),
    email: process.env.JIRA_EMAIL || "",
    token: process.env.JIRA_API_TOKEN || "",
  };
}

function isConfigured() {
  const c = getConfig();
  return Boolean(c.baseUrl && c.email && c.token);
}

function authHeader() {
  const c = getConfig();
  const encoded = Buffer.from(`${c.email}:${c.token}`).toString("base64");
  return `Basic ${encoded}`;
}

async function jiraFetch(path, opts) {
  const url = `${getConfig().baseUrl}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(opts && opts.headers ? opts.headers : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jira API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Search issues using the new POST /rest/api/3/search/jql endpoint.
 * Returns array of issue objects.
 */
async function jiraSearchJql(jql, fields, maxResults) {
  const data = await jiraFetch("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql,
      fields: fields || ["summary"],
      maxResults: maxResults || 100,
    }),
  });
  return Array.isArray(data.issues) ? data.issues : [];
}

/**
 * List all accessible projects.
 * Returns [{ key, name, avatarUrl }]
 */
async function getProjects() {
  const data = await jiraFetch("/rest/api/3/project/search?maxResults=100&orderBy=name");
  const projects = Array.isArray(data.values) ? data.values : [];
  return projects.map((p) => ({
    key: p.key,
    name: p.name,
    avatarUrl: p.avatarUrls && p.avatarUrls["24x24"] ? p.avatarUrls["24x24"] : "",
  }));
}

/**
 * List epics for a project.
 * Returns [{ key, summary }]
 */
async function getEpics(projectKey) {
  const jql = `project = "${projectKey}" AND issuetype = Epic ORDER BY created DESC`;
  const data = await jiraSearchJql(jql, ["summary"], 100);
  return data.map((i) => ({
    key: i.key,
    summary: i.fields && i.fields.summary ? i.fields.summary : "",
  }));
}

/**
 * List sprints for a project (via board).
 * Returns [{ id, name, state }]
 */
async function getSprints(projectKey) {
  // First find the board for the project
  const boardData = await jiraFetch(
    `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=1`
  );
  const boards = Array.isArray(boardData.values) ? boardData.values : [];
  if (!boards.length) return [];

  const boardId = boards[0].id;
  const sprintData = await jiraFetch(
    `/rest/agile/1.0/board/${boardId}/sprint?maxResults=50&state=active,future`
  );
  const sprints = Array.isArray(sprintData.values) ? sprintData.values : [];
  return sprints.map((s) => ({
    id: s.id,
    name: s.name,
    state: s.state,
  }));
}

/**
 * Search user stories for a project with optional filters.
 * Returns [{ key, summary, status, priority, epic, labels }]
 */
async function getStories(projectKey, opts) {
  const epic = opts && opts.epic ? opts.epic : "";
  const sprint = opts && opts.sprint ? opts.sprint : "";
  const status = opts && opts.status ? opts.status : "";
  const search = opts && opts.search ? opts.search : "";

  const conditions = [`project = "${projectKey}"`, `issuetype = Story`];
  if (epic) conditions.push(`"Epic Link" = "${epic}"`);
  if (sprint) conditions.push(`sprint = "${sprint}"`);
  if (status) conditions.push(`status = "${status}"`);
  if (search) conditions.push(`summary ~ "${search}"`);

  const jql = conditions.join(" AND ") + " ORDER BY created DESC";
  const issues = await jiraSearchJql(jql, ["summary", "status", "priority", "labels", "customfield_10014"], 100);

  return issues.map((i) => {
    const f = i.fields || {};
    return {
      key: i.key,
      summary: f.summary || "",
      status: f.status && f.status.name ? f.status.name : "",
      priority: f.priority && f.priority.name ? f.priority.name : "",
      epic: f.customfield_10014 || "",
      labels: Array.isArray(f.labels) ? f.labels : [],
    };
  });
}

/**
 * Fetch full details for multiple stories by key.
 * Returns [{ key, summary, description, acceptanceCriteria }]
 */
async function getStoryDetails(keys) {
  if (!keys.length) return [];

  const jql = `key in (${keys.map((k) => `"${k}"`).join(",")}) ORDER BY key ASC`;
  const issues = await jiraSearchJql(jql, ["summary", "description", "customfield_10014"], keys.length);

  return issues.map((i) => {
    const f = i.fields || {};
    return {
      key: i.key,
      summary: f.summary || "",
      description: adfToText(f.description),
    };
  });
}

/**
 * Convert Atlassian Document Format (ADF) to plain text.
 * Handles the nested JSON structure Jira Cloud uses for description fields.
 */
function adfToText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;

  // Simple text node
  if (node.type === "text") {
    return node.text || "";
  }

  // Recursively process content array
  const children = Array.isArray(node.content) ? node.content : [];
  const parts = children.map((child) => adfToText(child));

  switch (node.type) {
    case "paragraph":
      return parts.join("") + "\n";
    case "heading":
      return parts.join("") + "\n";
    case "bulletList":
      return children.map((li) => "- " + adfToText(li).trim()).join("\n") + "\n";
    case "orderedList":
      return children.map((li, idx) => `${idx + 1}. ` + adfToText(li).trim()).join("\n") + "\n";
    case "listItem":
      return parts.join("");
    case "codeBlock":
      return parts.join("") + "\n";
    case "blockquote":
      return parts.map((p) => "> " + p.trim()).join("\n") + "\n";
    case "table":
      return parts.join("");
    case "tableRow":
      return "| " + children.map((cell) => adfToText(cell).trim()).join(" | ") + " |\n";
    case "tableHeader":
    case "tableCell":
      return parts.join("");
    case "hardBreak":
      return "\n";
    case "rule":
      return "---\n";
    default:
      return parts.join("");
  }
}

/**
 * Format multiple stories into structured requirement text.
 */
function formatStoriesAsRequirement(stories) {
  return stories
    .map((s) => {
      const lines = [`USER STORY: ${s.key} — ${s.summary}`];
      if (s.description && s.description.trim()) {
        lines.push("Description:");
        lines.push(s.description.trim());
      }
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

module.exports = {
  isConfigured,
  getProjects,
  getEpics,
  getSprints,
  getStories,
  getStoryDetails,
  formatStoriesAsRequirement,
};
