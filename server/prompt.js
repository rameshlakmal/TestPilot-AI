function buildSystemPrompt() {
  return [
    "You are a senior QA engineer and test designer.",
    "You generate high-quality, atomic test cases from requirements.",
    "You MUST output strictly valid JSON only (no markdown, no commentary).",
    "Your entire response must be a single JSON object: it must start with '{' and end with '}'.",
    "Use the provided QA skills (markdown playbooks) as guidance.",
    "If the requirements are ambiguous, add assumptions and missingInfoQuestions.",
    "Prefer deterministic IDs (TC-001, TC-002, ...).",
    "Every test case title MUST start with 'Verify that' (e.g. 'Verify that login fails with invalid password').",
    "Never return an empty testCases array; always include test cases even if you must state assumptions."
  ].join(" \n");
}

function buildPreflightSystemPrompt() {
  return [
    "You are a senior QA engineer and business analyst.",
    "Given requirements, you identify ambiguity and missing information needed to generate test cases.",
    "You MUST output strictly valid JSON only (no markdown, no commentary).",
    "Your entire response must be a single JSON object: it must start with '{' and end with '}'.",
    "Keep questions concise and actionable.",
    "Avoid asking questions already answered in the requirements."
  ].join(" \n");
}

function buildAnalysisSystemPrompt() {
  return [
    "You are a senior QA engineer and test architect.",
    "Your job is to analyze a software requirement and determine which test design techniques are most applicable.",
    "You MUST output strictly valid JSON only (no markdown, no commentary).",
    "Your entire response must be a single JSON object: it must start with '{' and end with '}'.",
    "",
    "For each requirement you must:",
    "1. Write a brief summary of what the requirement describes.",
    "2. Extract all testable elements (inputs, outputs, states, rules, boundaries, constraints, actions, integrations).",
    "3. Recommend which test design techniques (skills) should be used, with a confidence level (high/medium/low) and rationale.",
    "4. Assess the overall complexity (simple/moderate/complex).",
    "",
    "Only recommend techniques that genuinely apply. Do not force-fit techniques.",
    "A technique with 'high' confidence means the requirement clearly contains elements that technique targets.",
    "'medium' means likely applicable. 'low' means marginally useful.",
    "Estimate the number of scenarios each technique would produce.",
    "",
    "IMPORTANT: Keep descriptions and rationales SHORT (1-2 sentences max). Be concise.",
    "Limit extractedElements to the most important ones (max 15).",
    "Only recommend techniques that truly apply (typically 3-6 techniques, not all of them)."
  ].join("\n");
}

function buildAnalysisUserPrompt(input) {
  const skillSummaries = input.skillSummaries || "";
  return [
    "Return a single JSON object matching the required schema.",
    "",
    "AVAILABLE TEST DESIGN TECHNIQUES (skills):",
    "Use only skillId values from this list in your recommendations.",
    skillSummaries,
    "",
    "REQUIREMENTS (user provided):",
    input.requirements,
    "",
    "REQUIRED JSON SCHEMA (informal):",
    input.schemaHint
  ].join("\n");
}

function buildSkillGenerationSystemPrompt(skillTitle, opts) {
  const includeDiagram = opts && opts.includeDiagram;
  const lines = [
    `You are a senior QA engineer specializing in the "${skillTitle}" test design technique.`,
    "You generate high-quality, atomic test cases by applying this specific technique to the given requirement.",
    "You MUST output strictly valid JSON only (no markdown, no commentary).",
    "Your entire response must be a single JSON object: it must start with '{' and end with '}'.",
    "Focus ONLY on scenarios that this technique is designed to uncover.",
    "Do not duplicate generic happy-path scenarios unless they are specific to this technique.",
    "Prefer deterministic IDs (TC-001, TC-002, ...).",
    "Every test case title MUST start with 'Verify that' (e.g. 'Verify that boundary value triggers validation error').",
    "Never return an empty testCases array."
  ];

  if (includeDiagram) {
    lines.push(
      "",
      "MERMAID DIAGRAM: You MUST also include a 'mermaidDiagram' field in your JSON response.",
      "This field should contain a valid Mermaid.js diagram string that visually represents the test design technique applied to this requirement.",
      "Use the appropriate Mermaid diagram type for the technique:",
      "- State Transition Testing → stateDiagram-v2 (show states, transitions, and invalid transitions)",
      "- Decision Tables → flowchart TD (show conditions branching to outcomes)",
      "- Equivalence Partitioning → flowchart LR (show input partitions as boxes: valid in green, invalid in red)",
      "- Boundary Value Analysis → flowchart LR (show boundary points on a number line with pass/fail zones)",
      "- Pairwise / Combinatorial → flowchart TD (show parameter combinations as a tree or matrix)",
      "- Feature Decomposition → mindmap (show decomposed dimensions: actors, data, rules, states, integrations)",
      "- Other techniques → flowchart TD (show the logical flow of the technique applied to this requirement)",
      "Keep the diagram concise (max ~30 nodes). Use descriptive labels. Do NOT wrap in markdown code fences.",
    "",
    "IMPORTANT STYLING RULES for diagrams:",
    "- For Equivalence Partitioning, Boundary Value Analysis, and Decision Tables: you MUST add classDef styles to distinguish valid vs invalid.",
    "- Use these exact classDef definitions at the end of your flowchart:",
    "  classDef valid fill:#065f46,stroke:#10b981,color:#d1fae5,stroke-width:2px",
    "  classDef invalid fill:#7f1d1d,stroke:#ef4444,color:#fecaca,stroke-width:2px",
    "  classDef boundary fill:#713f12,stroke:#f59e0b,color:#fef3c7,stroke-width:2px",
    "- Apply classes to nodes: e.g., A[\"Valid: 3-50 chars\"]:::valid  B[\"Invalid: empty\"]:::invalid  C[\"Boundary: exactly 3\"]:::boundary",
    "- For State Transition diagrams: no extra styling needed (Mermaid handles state colors).",
    "- For all diagrams: use high-contrast text. Avoid light text on light backgrounds."
    );
  }

  return lines.join("\n");
}

function buildSkillGenerationUserPrompt(input) {
  const depth = input.depth || "standard";

  const depthRule =
    depth === "smoke"
      ? "Generate a compact set focused on the most critical scenarios for this technique. Aim for ~3-6 test cases."
      : depth === "deep"
        ? "Generate thorough coverage for this technique including edge cases and combinations. Aim for ~10-20 test cases."
        : "Generate balanced coverage for this technique. Aim for ~5-10 test cases.";

  const minCases = depth === "smoke" ? 3 : depth === "deep" ? 8 : 5;

  const parts = [
    "Return a single JSON object that matches the required schema.",
    depthRule,
    `Generate at least ${minCases} testCases (do not return an empty array).`,
    "Do not include any keys that are not in the schema.",
    "Use arrays for preconditions/steps/expected even when there's only one item.",
    "Make steps actionable and short.",
    ""
  ];

  if (input.analysisContext) {
    parts.push("ANALYSIS CONTEXT (extracted elements from this requirement):");
    parts.push(input.analysisContext);
    parts.push("");
  }

  parts.push("REQUIREMENTS (user provided):");
  parts.push(input.requirements);
  parts.push("");
  parts.push("TEST DESIGN TECHNIQUE (apply this skill):");
  parts.push(input.skillMarkdown);
  parts.push("");
  parts.push("REQUIRED JSON SCHEMA (informal):");
  parts.push(input.schemaHint);

  return parts.join("\n");
}

function buildUserPrompt(input) {
  const depth = input.depth || "standard";

  const depthRule =
    depth === "smoke"
      ? "Generate a compact smoke suite focused on P0/P1 happy paths plus a few critical negatives. Aim for ~8-12 test cases."
      : depth === "deep"
        ? "Generate a deep suite with broad coverage including negatives, boundaries, and state/rule paths. Aim for ~50-80 test cases (cap with meaningful variety; avoid duplicates)."
        : "Generate a standard suite with balanced functional, negative, and boundary coverage. Aim for ~20-30 test cases.";

  const minCases = depth === "smoke" ? 8 : depth === "deep" ? 40 : 18;

  return [
    "Return a single JSON object that matches the required schema.",
    depthRule,
    `Generate at least ${minCases} testCases (do not return an empty array).`,
    "Do not include any keys that are not in the schema.",
    "Use arrays for preconditions/steps/expected even when there's only one item.",
    "Make steps actionable and short.",
    "\nREQUIREMENTS (user provided):\n" + input.requirements,
    "\nSELECTED QA SKILLS (markdown; use as guidance):\n" + input.skillsMarkdown,
    "\nREQUIRED JSON SCHEMA (informal):\n" + input.schemaHint
  ].join("\n");
}

function buildPreflightUserPrompt(input) {
  return [
    "Return a single JSON object with exactly these keys:",
    "- assumptions: string[]",
    "- missingInfoQuestions: string[]",
    "- notes: string[] (optional; keep short)",
    "Do not include any other keys.",
    "Ask only the minimum questions that materially affect test design.",
    "\nREQUIREMENTS (user provided):\n" + input.requirements,
    "\nSELECTED QA SKILLS (markdown; use as guidance):\n" + input.skillsMarkdown
  ].join("\n");
}

function schemaHintText(opts) {
  const includeDiagram = opts && opts.includeDiagram;
  const lines = [
    "{",
    "  suiteTitle: string,",
    "  assumptions: string[],",
    "  risks: string[],",
    "  missingInfoQuestions: string[],"
  ];
  if (includeDiagram) {
    lines.push("  mermaidDiagram: string (valid Mermaid.js diagram for this technique),");
  }
  lines.push(
    "  testCases: [",
    "    {",
    "      id: string, title: string,",
    "      type: functional|negative|boundary|security|accessibility|performance|usability|compatibility|resilience,",
    "      priority: P0|P1|P2|P3,",
    "      preconditions: string[], steps: string[], expected: string[],",
    "      coverageTags: string[], requirementRefs: string[]",
    "    }",
    "  ]",
    "}"
  );
  return lines.join("\n");
}

function analysisSchemaHintText() {
  return [
    "{",
    "  summary: string,",
    "  extractedElements: [",
    "    { name: string, type: input|output|state|rule|boundary|constraint|action|integration, description: string, values?: string[] }",
    "  ],",
    "  techniqueRecommendations: [",
    "    { skillId: string, confidence: high|medium|low, rationale: string, estimatedScenarios: integer }",
    "  ],",
    "  complexity: simple|moderate|complex",
    "}"
  ].join("\n");
}

module.exports = {
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
};
