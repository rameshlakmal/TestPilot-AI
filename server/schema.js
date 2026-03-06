const analysisSchema = {
  $id: "https://example.local/schemas/analysis.json",
  type: "object",
  additionalProperties: false,
  required: ["summary", "extractedElements", "techniqueRecommendations", "complexity"],
  properties: {
    summary: { type: "string", minLength: 1 },
    extractedElements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type", "description"],
        properties: {
          name: { type: "string", minLength: 1 },
          type: {
            type: "string",
            enum: ["input", "output", "state", "rule", "boundary", "constraint", "action", "integration"]
          },
          description: { type: "string", minLength: 1 },
          values: { type: "array", items: { type: "string" } }
        }
      }
    },
    techniqueRecommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skillId", "confidence", "rationale", "estimatedScenarios"],
        properties: {
          skillId: { type: "string", minLength: 1 },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          rationale: { type: "string", minLength: 1 },
          estimatedScenarios: { type: "integer", minimum: 1 }
        }
      }
    },
    complexity: { type: "string", enum: ["simple", "moderate", "complex"] }
  }
};

const testSuiteSchema = {
  $id: "https://example.local/schemas/test-suite.json",
  type: "object",
  additionalProperties: false,
  required: ["suiteTitle", "assumptions", "risks", "missingInfoQuestions", "testCases"],
  properties: {
    suiteTitle: { type: "string", minLength: 1 },
    assumptions: { type: "array", items: { type: "string", minLength: 1 } },
    risks: { type: "array", items: { type: "string", minLength: 1 } },
    missingInfoQuestions: { type: "array", items: { type: "string", minLength: 1 } },
    mermaidDiagram: { type: "string" },
    testCases: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "type",
          "priority",
          "preconditions",
          "steps",
          "expected",
          "coverageTags",
          "requirementRefs"
        ],
        properties: {
          id: { type: "string", minLength: 1 },
          title: { type: "string", minLength: 1 },
          type: {
            type: "string",
            enum: [
              "functional",
              "negative",
              "boundary",
              "security",
              "accessibility",
              "performance",
              "usability",
              "compatibility",
              "resilience"
            ]
          },
          priority: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
          preconditions: { type: "array", items: { type: "string", minLength: 1 } },
          steps: { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 },
          expected: { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 },
          coverageTags: { type: "array", items: { type: "string", minLength: 1 } },
          requirementRefs: { type: "array", items: { type: "string", minLength: 1 } }
        }
      }
    }
  }
};

const preflightSchema = {
  $id: "https://example.local/schemas/preflight.json",
  type: "object",
  additionalProperties: false,
  required: ["assumptions", "missingInfoQuestions"],
  properties: {
    assumptions: { type: "array", items: { type: "string", minLength: 1 } },
    missingInfoQuestions: { type: "array", items: { type: "string", minLength: 1 } },
    notes: { type: "array", items: { type: "string", minLength: 1 } }
  }
};

module.exports = {
  analysisSchema,
  testSuiteSchema,
  preflightSchema
};
