const path = require("node:path");

// In local dev, prefer values from .env over machine-level env vars.
const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
require("dotenv").config({ override: !isProd });

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Ajv = require("ajv");

const { loadSkills } = require("./skills");
const { selectSkills } = require("./selectSkills");
const {
  buildSystemPrompt,
  buildPreflightSystemPrompt,
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  buildSkillGenerationSystemPrompt,
  buildSkillGenerationUserPrompt,
  buildUserPrompt,
  buildPreflightUserPrompt,
  schemaHintText,
  analysisSchemaHintText
} = require("./prompt");
const { generateText } = require("./llm");
const {
  safeJsonParse,
  extractFirstJsonObject,
  extractFirstJsonValue,
  clampNumber,
  truncateText,
  postProcessSuite,
  postProcessPreflight,
  mergeSuites,
  normalizeSuiteCandidate
} = require("./util");
const { analysisSchema, testSuiteSchema, preflightSchema } = require("./schema");
const jira = require("./jira");
const {
  normalizeBaseUrl,
  getOrCreateCaseFolderHierarchy,
  getCasePriorityList,
  getTestScriptTypeList,
  pickPriorityIdByP,
  pickScriptTypeId,
  createOrGetTags,
  buildAioCaseBody,
  createTestCase
} = require("./aio");

const PORT = Number(process.env.PORT || 3001);
const MAX_UPLOAD_MB = clampNumber(Number(process.env.MAX_UPLOAD_MB || 2), 1, 20);
const LLM_TIMEOUT_MS = clampNumber(Number(process.env.LLM_TIMEOUT_MS || 90000), 5000, 300000);
const MAX_TEST_CASES = clampNumber(Number(process.env.MAX_TEST_CASES || 160), 20, 500);

const app = express();

function parseCorsOrigins(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw === "*") return "*";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const corsOrigins =
  parseCorsOrigins(process.env.CORS_ORIGINS) ||
  ["http://localhost:5173", "http://127.0.0.1:5173", `http://localhost:${PORT}`];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (corsOrigins === "*") return cb(null, true);
      if (Array.isArray(corsOrigins) && corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    }
  })
);

app.use(
  helmet({
    // Dev server + Vite proxy works best with this relaxed.
    crossOriginResourcePolicy: false,
    // The `web/` static UI uses inline script + CDN in its HTML.
    contentSecurityPolicy: false
  })
);

app.set("trust proxy", 1);
app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    limit: clampNumber(Number(process.env.RATE_LIMIT_PER_MINUTE || 90), 10, 600),
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.use(express.json({ limit: "6mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }
});

const skills = loadSkills();

const ajv = new Ajv({ allErrors: true, strict: false });
const validateAnalysis = ajv.compile(analysisSchema);
const validateSuite = ajv.compile(testSuiteSchema);
const validatePreflight = ajv.compile(preflightSchema);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/skills", (req, res) => {
  res.json({
    count: skills.length,
    skills: skills.map((s) => ({ id: s.id, title: s.title, tags: s.tags }))
  });
});

// ─── Jira integration routes ───

app.get("/api/jira/status", (req, res) => {
  res.json({ configured: jira.isConfigured() });
});

app.get("/api/jira/projects", async (req, res) => {
  try {
    if (!jira.isConfigured()) return res.status(400).json({ error: "Jira is not configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env" });
    const projects = await jira.getProjects();
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch projects" });
  }
});

app.get("/api/jira/epics", async (req, res) => {
  try {
    if (!jira.isConfigured()) return res.status(400).json({ error: "Jira not configured" });
    const project = String(req.query.project || "").trim();
    if (!project) return res.status(400).json({ error: "project query param required" });
    const epics = await jira.getEpics(project);
    res.json({ epics });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch epics" });
  }
});

app.get("/api/jira/sprints", async (req, res) => {
  try {
    if (!jira.isConfigured()) return res.status(400).json({ error: "Jira not configured" });
    const project = String(req.query.project || "").trim();
    if (!project) return res.status(400).json({ error: "project query param required" });
    const sprints = await jira.getSprints(project);
    res.json({ sprints });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch sprints" });
  }
});

app.get("/api/jira/stories", async (req, res) => {
  try {
    if (!jira.isConfigured()) return res.status(400).json({ error: "Jira not configured" });
    const project = String(req.query.project || "").trim();
    if (!project) return res.status(400).json({ error: "project query param required" });
    const stories = await jira.getStories(project, {
      epic: req.query.epic || "",
      sprint: req.query.sprint || "",
      status: req.query.status || "",
      search: req.query.search || "",
    });
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch stories" });
  }
});

app.post("/api/jira/story-details", async (req, res) => {
  try {
    if (!jira.isConfigured()) return res.status(400).json({ error: "Jira not configured" });
    const keys = Array.isArray(req.body.keys) ? req.body.keys : [];
    if (!keys.length) return res.status(400).json({ error: "keys array required" });
    const details = await jira.getStoryDetails(keys);
    const formatted = jira.formatStoriesAsRequirement(details);
    res.json({ stories: details, formatted });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch story details" });
  }
});

// ─── AIO push ───

app.post("/api/aio/push", async (req, res) => {
  try {
    const jiraProjectId = String(req.body && req.body.jiraProjectId ? req.body.jiraProjectId : "").trim();
    const folderPath = String(req.body && req.body.folderPath ? req.body.folderPath : "").trim();
    const includeCoverageTags = Boolean(req.body && req.body.includeCoverageTags);
    const aioToken = String(req.body && req.body.aioToken ? req.body.aioToken : process.env.AIO_TOKEN || "").trim();
    const baseUrl = normalizeBaseUrl(process.env.AIO_BASE_URL);

    const suite = req.body && req.body.suite;
    const testCases = suite && Array.isArray(suite.testCases) ? suite.testCases : [];
    const suiteTitle = suite && suite.suiteTitle ? String(suite.suiteTitle) : "";

    if (!jiraProjectId) return res.status(400).json({ error: "jiraProjectId is required" });
    if (!suite || testCases.length === 0) return res.status(400).json({ error: "suite with testCases is required" });
    if (!aioToken) return res.status(400).json({ error: "AIO token is required (aioToken or AIO_TOKEN env var)" });

    const folder = folderPath
      ? await getOrCreateCaseFolderHierarchy({ baseUrl, token: aioToken, jiraProjectId, folderPath })
      : null;
    const folderId = folder && Number.isFinite(folder.ID) ? folder.ID : null;

    const priorities = await getCasePriorityList({ baseUrl, token: aioToken, jiraProjectId });
    const scriptTypes = await getTestScriptTypeList({ baseUrl, token: aioToken, jiraProjectId });
    const scriptTypeId = pickScriptTypeId(scriptTypes);

    const tagNames = new Set();
    tagNames.add("AI-Generated");
    if (includeCoverageTags) {
      for (const tc of testCases) {
        for (const t of Array.isArray(tc.coverageTags) ? tc.coverageTags : []) {
          const name = String(t || "").trim();
          if (name) tagNames.add(name.slice(0, 80));
        }
      }
    }

    const tags = await createOrGetTags({ baseUrl, token: aioToken, jiraProjectId }, Array.from(tagNames));
    const tagIds = Array.isArray(tags)
      ? tags
          .map((t) => (t && Number.isFinite(t.ID) ? t.ID : null))
          .filter((x) => x !== null)
      : [];

    const created = [];
    for (const tc of testCases) {
      const priorityId = pickPriorityIdByP(tc.priority, priorities);
      const body = buildAioCaseBody(tc, { folderId, priorityId, scriptTypeId, tagIds, suiteTitle });
      const resp = await createTestCase({ baseUrl, token: aioToken, jiraProjectId }, body);
      created.push({
        id: tc.id,
        title: tc.title,
        aioCaseId: resp && resp.ID ? resp.ID : null,
        aioCaseKey: resp && resp.key ? resp.key : null
      });
    }

    res.json({
      ok: true,
      jiraProjectId,
      folder: folderId ? { ID: folderId, name: folder.name || folderPath } : null,
      createdCount: created.length,
      created
    });
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

function getProviderConfig(provider) {
  const p = String(provider || process.env.LLM_PROVIDER || "openai").toLowerCase();

  if (p === "openai") {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini"
    };
  }

  if (p === "anthropic") {
    return {
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest"
    };
  }

  if (p === "gemini") {
    return {
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
    };
  }

  return { provider: p };
}

function validateProviderAndKey(cfg) {
  const p = String(cfg && cfg.provider ? cfg.provider : "").toLowerCase();
  if (p !== "openai" && p !== "anthropic" && p !== "gemini") {
    return { ok: false, error: `Unsupported provider: ${p || "(empty)"}` };
  }
  if (p === "openai" && !cfg.apiKey) return { ok: false, error: "Missing OPENAI_API_KEY" };
  if (p === "anthropic" && !cfg.apiKey) return { ok: false, error: "Missing ANTHROPIC_API_KEY" };
  if (p === "gemini" && !cfg.apiKey) return { ok: false, error: "Missing GEMINI_API_KEY" };
  return { ok: true };
}

function normalizeDepth(raw) {
  const d = String(raw || "standard").toLowerCase();
  if (d === "smoke" || d === "standard" || d === "deep") return d;
  return "standard";
}

function maxCasesForDepth(depth) {
  const d = normalizeDepth(depth);
  const byDepth = d === "smoke" ? 30 : d === "deep" ? 220 : 120;
  return Math.min(MAX_TEST_CASES, byDepth);
}

function normalizeReqText(text) {
  const t = String(text || "").replace(/\r\n/g, "\n").trim();
  return t;
}

async function fileTextFromUpload(file) {
  if (!file) return "";

  const original = String(file.originalname || "");
  const ext = original.toLowerCase().split(".").pop();

  // Keep parsing server-side so we don't ship files to the client.
  if (ext === "txt" || ext === "md") {
    return file.buffer.toString("utf8");
  }

  if (ext === "pdf") {
    const pdfParse = require("pdf-parse");
    const PDFParse = pdfParse && pdfParse.PDFParse;
    if (typeof PDFParse !== "function") {
      throw new Error("PDF parser load failed (pdf-parse.PDFParse not found)");
    }

    const parser = new PDFParse({ data: file.buffer });
    try {
      const r = await parser.getText();
      return String(r && r.text ? r.text : "");
    } finally {
      try {
        await parser.destroy();
      } catch {
        // ignore
      }
    }
  }

  if (ext === "docx") {
    const mammoth = require("mammoth");
    const r = await mammoth.extractRawText({ buffer: file.buffer });
    return String(r && r.value ? r.value : "");
  }

  if (ext === "html" || ext === "htm") {
    const cheerio = require("cheerio");
    const html = file.buffer.toString("utf8");
    const $ = cheerio.load(html);
    $("script,style,noscript").remove();
    const text = $("body").text() || $.root().text() || "";
    return String(text)
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  throw new Error("Supported uploads: .txt, .md, .pdf, .docx, .html");
}

function formatAjvErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return "(no details)";
  return errors
    .slice(0, 12)
    .map((e) => `${e.instancePath || "(root)"} ${e.message || "invalid"}`)
    .join("; ");
}

async function generateAndValidatePreflight(ctx) {
  const system = buildPreflightSystemPrompt();
  const user = buildPreflightUserPrompt({
    requirements: ctx.requirements,
    skillsMarkdown: ctx.skillsMarkdown
  });

  const first = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user,
    temperature: 0.2,
    maxTokens: 1200,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? preflightSchema : undefined
  });

  const attemptParse = (text) => {
    const direct = safeJsonParse(text);
    if (direct.ok) return { ok: true, obj: direct.value };
    const extracted = extractFirstJsonValue(text);
    if (!extracted) return { ok: false, reason: "no-json-found" };
    const second = safeJsonParse(extracted);
    if (!second.ok) return { ok: false, reason: "json-parse-failed" };
    return { ok: true, obj: second.value };
  };

  const parsed1 = attemptParse(first.text);
  if (parsed1.ok && validatePreflight(parsed1.obj)) {
    const processed = postProcessPreflight(parsed1.obj);
    return { preflight: processed, rawText: first.text, repaired: false };
  }

  const errors1 = formatAjvErrors(validatePreflight.errors);
  const repairPrompt = [
    "Your previous output did not match the required JSON shape.",
    "Fix it and return ONLY the corrected JSON object.",
    "Required keys: assumptions, missingInfoQuestions, notes (optional).",
    "No extra keys.",
    "\nValidation errors:\n" + errors1,
    "\nPrevious output:\n" + first.text
  ].join("\n");

  const repaired = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user: repairPrompt,
    temperature: 0.1,
    maxTokens: 1200,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? preflightSchema : undefined
  });

  const parsed2 = attemptParse(repaired.text);
  if (parsed2.ok && validatePreflight(parsed2.obj)) {
    const processed = postProcessPreflight(parsed2.obj);
    return { preflight: processed, rawText: repaired.text, repaired: true };
  }

  const errors2 = formatAjvErrors(validatePreflight.errors);
  const reason = parsed2.ok ? "schema-validation-failed" : parsed2.reason;
  const details =
    parsed2.ok
      ? errors2
      : parsed2.reason === "no-json-found"
        ? "No JSON detected in model output: " + truncateText(repaired.text, 600)
        : errors1;
  const err = new Error(`Model preflight output invalid (${reason}): ${details}`);
  err.raw = repaired.text;
  throw err;
}

async function generateAndValidateSuite(ctx) {
  const system = buildSystemPrompt();
  const user = buildUserPrompt({
    requirements: ctx.requirements,
    skillsMarkdown: ctx.skillsMarkdown,
    depth: ctx.depth,
    schemaHint: schemaHintText()
  });

  const minCases = ctx.depth === "smoke" ? 8 : ctx.depth === "deep" ? 40 : 18;

  const first = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user,
    temperature: 0.2,
    maxTokens: 4096,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? testSuiteSchema : undefined
  });

  const attemptParse = (text) => {
    const direct = safeJsonParse(text);
    if (direct.ok) return { ok: true, obj: direct.value };
    const extracted = extractFirstJsonValue(text);
    if (!extracted) return { ok: false, reason: "no-json-found" };
    const second = safeJsonParse(extracted);
    if (!second.ok) return { ok: false, reason: "json-parse-failed" };
    return { ok: true, obj: second.value };
  };

  const coerceSuiteObject = (obj) => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    if (Array.isArray(obj)) {
      return {
        suiteTitle: "Generated Test Suite",
        assumptions: [],
        risks: [],
        missingInfoQuestions: [],
        testCases: obj
      };
    }
    return obj;
  };

  const parsed1 = attemptParse(first.text);
  if (parsed1.ok) {
    const suiteObj1 = coerceSuiteObject(parsed1.obj);
    if (validateSuite(suiteObj1)) {
      const processed = postProcessSuite(suiteObj1, { maxTestCases: ctx.maxTestCases });
      return { suite: processed, rawText: first.text, repaired: false };
    }
  }

  const errors1 = formatAjvErrors(validateSuite.errors);
  const repairPrompt = [
    "Your previous output did not match the required JSON schema.",
    "Fix it and return ONLY the corrected JSON object.",
    "Do not add any extra keys.",
    `testCases must contain at least ${minCases} items and MUST NOT be empty.`,
    "\nSchema hint:\n" + schemaHintText(),
    "\nValidation errors:\n" + errors1,
    "\nPrevious output:\n" + first.text
  ].join("\n");

  const repaired = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user: repairPrompt,
    temperature: 0.1,
    maxTokens: 4096,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? testSuiteSchema : undefined
  });

  const parsed2 = attemptParse(repaired.text);
  if (parsed2.ok) {
    const suiteObj2 = coerceSuiteObject(parsed2.obj);
    if (validateSuite(suiteObj2)) {
      const processed = postProcessSuite(suiteObj2, { maxTestCases: ctx.maxTestCases });
      return { suite: processed, rawText: repaired.text, repaired: true };
    }
  }

  const errors2 = formatAjvErrors(validateSuite.errors);
  const reason = parsed2.ok ? "schema-validation-failed" : parsed2.reason;
  const details =
    parsed2.ok
      ? errors2
      : parsed2.reason === "no-json-found"
        ? "No JSON detected in model output: " + truncateText(repaired.text, 600)
        : errors1;
  const err = new Error(`Model output invalid (${reason}): ${details}`);
  err.raw = repaired.text;
  throw err;
}

async function generateAndValidateAnalysis(ctx) {
  const system = buildAnalysisSystemPrompt();
  const user = buildAnalysisUserPrompt({
    requirements: ctx.requirements,
    skillSummaries: ctx.skillSummaries,
    schemaHint: analysisSchemaHintText()
  });

  const first = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user,
    temperature: 0.2,
    maxTokens: 4096,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? analysisSchema : undefined
  });

  const attemptParse = (text) => {
    const direct = safeJsonParse(text);
    if (direct.ok) return { ok: true, obj: direct.value };
    const extracted = extractFirstJsonValue(text);
    if (!extracted) return { ok: false, reason: "no-json-found" };
    const second = safeJsonParse(extracted);
    if (!second.ok) return { ok: false, reason: "json-parse-failed" };
    return { ok: true, obj: second.value };
  };

  const parsed1 = attemptParse(first.text);
  if (parsed1.ok && validateAnalysis(parsed1.obj)) {
    return { analysis: parsed1.obj, rawText: first.text, repaired: false };
  }

  const errors1 = formatAjvErrors(validateAnalysis.errors);
  const repairPrompt = [
    "Your previous output did not match the required JSON shape.",
    "Fix it and return ONLY the corrected JSON object.",
    "Required keys: summary, extractedElements, techniqueRecommendations, complexity.",
    "techniqueRecommendations[].skillId must be one of the available skill IDs.",
    "\nValidation errors:\n" + errors1,
    "\nPrevious output:\n" + first.text
  ].join("\n");

  const repaired = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user: repairPrompt,
    temperature: 0.1,
    maxTokens: 4096,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? analysisSchema : undefined
  });

  const parsed2 = attemptParse(repaired.text);
  if (parsed2.ok && validateAnalysis(parsed2.obj)) {
    return { analysis: parsed2.obj, rawText: repaired.text, repaired: true };
  }

  const errors2 = formatAjvErrors(validateAnalysis.errors);
  const reason = parsed2.ok ? "schema-validation-failed" : parsed2.reason;
  const details = parsed2.ok
    ? errors2
    : parsed2.reason === "no-json-found"
      ? "No JSON detected in model output: " + truncateText(repaired.text, 600)
      : errors1;
  const err = new Error(`Model analysis output invalid (${reason}): ${details}`);
  err.raw = repaired.text;
  throw err;
}

async function generateForSingleSkill(ctx) {
  const system = buildSkillGenerationSystemPrompt(ctx.skillTitle, { includeDiagram: ctx.includeDiagram });
  const user = buildSkillGenerationUserPrompt({
    requirements: ctx.requirements,
    skillMarkdown: ctx.skillMarkdown,
    depth: ctx.depth,
    analysisContext: ctx.analysisContext,
    schemaHint: schemaHintText({ includeDiagram: ctx.includeDiagram })
  });

  const first = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user,
    temperature: 0.2,
    maxTokens: 4096,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? testSuiteSchema : undefined
  });

  const attemptParse = (text) => {
    const direct = safeJsonParse(text);
    if (direct.ok) return { ok: true, obj: direct.value };
    const extracted = extractFirstJsonValue(text);
    if (!extracted) return { ok: false, reason: "no-json-found" };
    const second = safeJsonParse(extracted);
    if (!second.ok) return { ok: false, reason: "json-parse-failed" };
    return { ok: true, obj: second.value };
  };

  const coerceSuiteObject = (obj) => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    if (Array.isArray(obj)) {
      return {
        suiteTitle: `${ctx.skillTitle} Scenarios`,
        assumptions: [],
        risks: [],
        missingInfoQuestions: [],
        testCases: obj
      };
    }
    return obj;
  };

  const parsed1 = attemptParse(first.text);
  if (parsed1.ok) {
    const suiteObj1 = coerceSuiteObject(parsed1.obj);
    if (validateSuite(suiteObj1)) {
      const processed = normalizeSuiteCandidate(suiteObj1, { maxTestCases: 60 });
      // Tag each test case with the skill that generated it
      processed.testCases = processed.testCases.map((tc) => ({
        ...tc,
        coverageTags: [...(Array.isArray(tc.coverageTags) ? tc.coverageTags : []), ctx.skillId]
      }));
      return { suite: processed, skillId: ctx.skillId, repaired: false };
    }
  }

  const errors1 = formatAjvErrors(validateSuite.errors);
  const repairPrompt = [
    "Your previous output did not match the required JSON schema.",
    "Fix it and return ONLY the corrected JSON object.",
    "Do not add any extra keys.",
    "testCases MUST NOT be empty.",
    "\nSchema hint:\n" + schemaHintText(),
    "\nValidation errors:\n" + errors1,
    "\nPrevious output:\n" + first.text
  ].join("\n");

  const repaired = await generateText({
    provider: ctx.provider,
    apiKey: ctx.apiKey,
    model: ctx.model,
    system,
    user: repairPrompt,
    temperature: 0.1,
    maxTokens: 4096,
    timeoutMs: LLM_TIMEOUT_MS,
    jsonSchema: ctx.provider === "openai" || ctx.provider === "gemini" ? testSuiteSchema : undefined
  });

  const parsed2 = attemptParse(repaired.text);
  if (parsed2.ok) {
    const suiteObj2 = coerceSuiteObject(parsed2.obj);
    if (validateSuite(suiteObj2)) {
      const processed = normalizeSuiteCandidate(suiteObj2, { maxTestCases: 60 });
      processed.testCases = processed.testCases.map((tc) => ({
        ...tc,
        coverageTags: [...(Array.isArray(tc.coverageTags) ? tc.coverageTags : []), ctx.skillId]
      }));
      return { suite: processed, skillId: ctx.skillId, repaired: true };
    }
  }

  // If both attempts fail, return empty suite rather than crashing the whole generation
  return {
    suite: {
      suiteTitle: `${ctx.skillTitle} Scenarios`,
      assumptions: [],
      risks: [],
      missingInfoQuestions: [],
      testCases: []
    },
    skillId: ctx.skillId,
    repaired: false,
    error: `Failed to generate valid output for skill: ${ctx.skillTitle}`
  };
}

// Run multiple skill generations in parallel with concurrency limit
async function generateParallel(tasks, maxConcurrency) {
  const results = [];
  const queue = [...tasks];

  async function runNext() {
    while (queue.length > 0) {
      const task = queue.shift();
      const result = await generateForSingleSkill(task);
      results.push(result);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(maxConcurrency, tasks.length); i++) {
    workers.push(runNext());
  }
  await Promise.all(workers);

  return results;
}

app.post(
  "/api/analyze",
  upload.single("requirementFile"),
  async (req, res) => {
    let debug = null;
    try {
      const requirementText = normalizeReqText(req.body && req.body.requirementText);
      const uploadedText = normalizeReqText(await fileTextFromUpload(req.file));
      const combined = [uploadedText, requirementText].filter(Boolean).join("\n\n---\n\n");

      if (!combined) {
        return res.status(400).json({
          error: "Provide requirementText or upload a requirementFile (.txt/.md/.pdf/.docx/.html)"
        });
      }

      const provider = String((req.body && req.body.provider) || "");
      const modelOverride = String((req.body && req.body.model) || "").trim();
      const cfg = getProviderConfig(provider);
      const model = modelOverride || cfg.model;

      const okProvider = validateProviderAndKey(cfg);
      if (!okProvider.ok) {
        return res.status(400).json({ error: okProvider.error });
      }

      debug = { provider: cfg.provider, model };

      // Build a summary of available skills for the AI to choose from
      const skillSummaries = skills
        .map((s) => `- ${s.id}: ${s.title} (tags: ${s.tags.join(", ")})`)
        .join("\n");

      const result = await generateAndValidateAnalysis({
        provider: cfg.provider,
        apiKey: cfg.apiKey,
        model,
        requirements: combined,
        skillSummaries
      });

      // Filter recommendations to only include valid skill IDs
      const validSkillIds = new Set(skills.map((s) => s.id));
      const analysis = result.analysis;
      analysis.techniqueRecommendations = analysis.techniqueRecommendations.filter(
        (r) => validSkillIds.has(r.skillId)
      );

      // Ensure general-fallback is always present
      const hasGeneralFallback = analysis.techniqueRecommendations.some(
        (r) => r.skillId === "general-fallback"
      );
      if (!hasGeneralFallback) {
        analysis.techniqueRecommendations.push({
          skillId: "general-fallback",
          confidence: "high",
          rationale: "Always included as baseline to cover happy path and general functional scenarios.",
          estimatedScenarios: 6
        });
      }

      res.json({
        provider: cfg.provider,
        model,
        repaired: result.repaired,
        analysis
      });
    } catch (err) {
      res.status(500).json({
        error: err && err.message ? err.message : String(err),
        debug,
        hint: "Check provider key, model name, and ensure the LLM returns strict JSON."
      });
    }
  }
);

app.post(
  "/api/preflight",
  upload.single("requirementFile"),
  async (req, res) => {
    let debug = null;
    try {
      const requirementText = normalizeReqText(req.body && req.body.requirementText);
      const uploadedText = normalizeReqText(await fileTextFromUpload(req.file));
      const combined = [uploadedText, requirementText].filter(Boolean).join("\n\n---\n\n");

      if (!combined) {
        return res.status(400).json({
          error: "Provide requirementText or upload a requirementFile (.txt/.md/.pdf/.docx/.html)"
        });
      }

      const provider = String((req.body && req.body.provider) || "");
      const modelOverride = String((req.body && req.body.model) || "").trim();
      const cfg = getProviderConfig(provider);
      const model = modelOverride || cfg.model;

       const okProvider = validateProviderAndKey(cfg);
       if (!okProvider.ok) {
         return res.status(400).json({ error: okProvider.error });
       }

      debug = { provider: cfg.provider, model };

      const selected = selectSkills(skills, combined, { maxExtra: 6, withScores: true });
      const skillsMarkdown = selected
        .map((s) => `\n\n===== SKILL: ${s.id} (${s.title}) =====\n\n${s.markdown}`)
        .join("\n");

      const result = await generateAndValidatePreflight({
        provider: cfg.provider,
        apiKey: cfg.apiKey,
        model,
        requirements: combined,
        skillsMarkdown
      });

      res.json({
        provider: cfg.provider,
        model,
        selectedSkills: selected.map((s) => ({
          id: s.id,
          title: s.title,
          tags: s.tags,
          score: s.score,
          reason: s.reason || null
        })),
        repaired: result.repaired,
        preflight: result.preflight
      });
    } catch (err) {
      res.status(500).json({
        error: err && err.message ? err.message : String(err),
        debug,
        hint:
          "Check provider key, model name, and ensure the LLM returns strict JSON."
      });
    }
  }
);

app.post(
  "/api/generate-tests",
  upload.single("requirementFile"),
  async (req, res) => {
    let debug = null;
    try {
      const requirementText = normalizeReqText(req.body && req.body.requirementText);
      const uploadedText = normalizeReqText(await fileTextFromUpload(req.file));
      const combined = [uploadedText, requirementText].filter(Boolean).join("\n\n---\n\n");

      if (!combined) {
        return res.status(400).json({
          error: "Provide requirementText or upload a requirementFile (.txt/.md/.pdf/.docx/.html)"
        });
      }

      const depth = normalizeDepth((req.body && req.body.depth) || "standard");
      const clarifications = normalizeReqText(req.body && req.body.clarifications);

      const provider = String((req.body && req.body.provider) || "");
      const modelOverride = String((req.body && req.body.model) || "").trim();
      const cfg = getProviderConfig(provider);
      const model = modelOverride || cfg.model;

      const okProvider = validateProviderAndKey(cfg);
      if (!okProvider.ok) {
        return res.status(400).json({ error: okProvider.error });
      }

      debug = { provider: cfg.provider, model };

      const requirementsWithClarifications = clarifications
        ? combined + "\n\nCLARIFICATIONS (user answers to missing info questions):\n" + clarifications
        : combined;

      // Check if client sent selected skills from the analysis step
      let selectedSkillIds = null;
      let analysisContext = "";

      if (req.body && req.body.selectedSkills) {
        try {
          const parsed = typeof req.body.selectedSkills === "string"
            ? JSON.parse(req.body.selectedSkills)
            : req.body.selectedSkills;
          if (Array.isArray(parsed)) {
            selectedSkillIds = parsed;
          }
        } catch {
          // ignore parse error, fall back to old behavior
        }
      }

      if (req.body && req.body.analysisContext) {
        analysisContext = typeof req.body.analysisContext === "string"
          ? req.body.analysisContext
          : JSON.stringify(req.body.analysisContext);
      }

      let diagramSkillIds = null;
      if (req.body && req.body.diagramSkills) {
        try {
          const parsed = typeof req.body.diagramSkills === "string"
            ? JSON.parse(req.body.diagramSkills)
            : req.body.diagramSkills;
          if (Array.isArray(parsed)) {
            diagramSkillIds = new Set(parsed);
          }
        } catch {
          // ignore parse error
        }
      }

      // NEW PATH: Per-skill generation (when analysis step was used)
      if (selectedSkillIds && selectedSkillIds.length > 0) {
        const skillsById = new Map(skills.map((s) => [s.id, s]));

        // Always ensure general-fallback is included
        if (!selectedSkillIds.includes("general-fallback")) {
          selectedSkillIds.push("general-fallback");
        }

        const validSkills = selectedSkillIds
          .map((id) => skillsById.get(id))
          .filter(Boolean);

        if (validSkills.length === 0) {
          return res.status(400).json({ error: "No valid skills found for the given selectedSkills IDs." });
        }

        // Build per-skill generation tasks
        const tasks = validSkills.map((skill) => ({
          provider: cfg.provider,
          apiKey: cfg.apiKey,
          model,
          requirements: requirementsWithClarifications,
          skillId: skill.id,
          skillTitle: skill.title,
          skillMarkdown: `===== SKILL: ${skill.id} (${skill.title}) =====\n\n${skill.markdown}`,
          depth,
          analysisContext,
          includeDiagram: Boolean(diagramSkillIds && diagramSkillIds.has(skill.id))
        }));

        // Gemini free tier: 5 req/min — run sequentially to avoid 429 storms
        const concurrency = cfg.provider === "gemini" ? 1 : 3;
        const results = await generateParallel(tasks, concurrency);

        const suites = results.map((r) => r.suite);
        const errors = results.filter((r) => r.error).map((r) => ({
          skillId: r.skillId,
          error: r.error
        }));
        const anyRepaired = results.some((r) => r.repaired);

        // Extract Mermaid diagrams from each skill's suite before merging
        const skillDiagrams = results
          .filter((r) => r.suite && typeof r.suite.mermaidDiagram === "string" && r.suite.mermaidDiagram.trim())
          .map((r) => {
            const skill = skillsById.get(r.skillId);
            return {
              skillId: r.skillId,
              skillTitle: skill ? skill.title : r.skillId,
              diagram: r.suite.mermaidDiagram.trim()
            };
          });

        const merged = mergeSuites(suites, { maxTestCases: maxCasesForDepth(depth) });

        res.json({
          provider: cfg.provider,
          model,
          depth,
          mode: "per-skill",
          selectedSkills: validSkills.map((s) => ({
            id: s.id,
            title: s.title,
            tags: s.tags
          })),
          repaired: anyRepaired,
          skillErrors: errors.length > 0 ? errors : undefined,
          duplicateGroups: merged.duplicateGroups,
          skillDiagrams: skillDiagrams.length > 0 ? skillDiagrams : undefined,
          suite: merged.suite
        });
        return;
      }

      // LEGACY PATH: single mega-prompt (when no analysis step was used)
      const selected = selectSkills(skills, combined, { maxExtra: 6, withScores: true });
      const skillsMarkdown = selected
        .map((s) => `\n\n===== SKILL: ${s.id} (${s.title}) =====\n\n${s.markdown}`)
        .join("\n");

      const result = await generateAndValidateSuite({
        provider: cfg.provider,
        apiKey: cfg.apiKey,
        model,
        requirements: requirementsWithClarifications,
        skillsMarkdown,
        depth,
        maxTestCases: maxCasesForDepth(depth)
      });

      res.json({
        provider: cfg.provider,
        model,
        depth,
        mode: "legacy",
        selectedSkills: selected.map((s) => ({
          id: s.id,
          title: s.title,
          tags: s.tags,
          score: s.score,
          reason: s.reason || null
        })),
        repaired: result.repaired,
        suite: result.suite
      });
    } catch (err) {
      res.status(500).json({
        error: err && err.message ? err.message : String(err),
        debug,
        hint:
          "Check provider API key, model name, and ensure the LLM returns strict JSON."
      });
    }
  }
);

app.use(express.static(path.join(__dirname, "..", "web")));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running: http://localhost:${PORT}`);
});
