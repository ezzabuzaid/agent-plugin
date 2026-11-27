import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@alwaysmeticulous/agent-traces/dist/types/atif.types.js
var require_atif_types = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/types/atif.types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ATIF_SCHEMA_VERSION = void 0;
    exports.ATIF_SCHEMA_VERSION = "ATIF-v1.7";
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/types/constants.js
var require_constants = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/types/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AGENT_TRACE_CONTENT_SHA256_REGEX = exports.AGENT_TRACE_SESSION_ID_REGEX = exports.AGENT_TRACE_ENVIRONMENTS = exports.MAX_AGENT_TRACE_OBJECT_BYTES = exports.AGENT_TRACE_METADATA_OBJECT_FILENAME = exports.AGENT_TRACE_RAW_OBJECT_FILENAME = exports.AGENT_TRACE_ATIF_OBJECT_FILENAME = exports.isAgentTraceAgent = exports.AGENT_TRACE_AGENTS = void 0;
    exports.AGENT_TRACE_AGENTS = [
      "claude-code",
      "devin",
      "pi",
      "opencode",
      "codex",
      "cursor",
      "other"
    ];
    var isAgentTraceAgent = (value) => exports.AGENT_TRACE_AGENTS.includes(value);
    exports.isAgentTraceAgent = isAgentTraceAgent;
    exports.AGENT_TRACE_ATIF_OBJECT_FILENAME = "trajectory.atif.json.gz";
    exports.AGENT_TRACE_RAW_OBJECT_FILENAME = "raw.json.gz";
    exports.AGENT_TRACE_METADATA_OBJECT_FILENAME = "metadata.json";
    exports.MAX_AGENT_TRACE_OBJECT_BYTES = 100 * 1024 * 1024;
    exports.AGENT_TRACE_ENVIRONMENTS = [
      "local",
      "conductor-local",
      "conductor-cloud",
      "claude-code-web",
      "cursor-cloud",
      "devin-cloud",
      "github-actions",
      "ci",
      "imported"
    ];
    exports.AGENT_TRACE_SESSION_ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;
    exports.AGENT_TRACE_CONTENT_SHA256_REGEX = /^[a-f0-9]{64}$/;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/types/ingest-api.types.js
var require_ingest_api_types = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/types/ingest-api.types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/types/raw-envelope.types.js
var require_raw_envelope_types = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/types/raw-envelope.types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/types/summary.types.js
var require_summary_types = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/types/summary.types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/step-token-breakdown.js
var require_step_token_breakdown = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/step-token-breakdown.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAtifCacheCreationTokens = exports.getAtifStepTokens = void 0;
    var getAtifStepTokens = (metrics) => {
      if (!metrics) {
        return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      }
      const cacheRead = metrics.cached_tokens ?? 0;
      const cacheWrite = (0, exports.getAtifCacheCreationTokens)(metrics);
      return {
        input: Math.max(0, (metrics.prompt_tokens ?? 0) - cacheRead - cacheWrite),
        output: metrics.completion_tokens ?? 0,
        cacheRead,
        cacheWrite
      };
    };
    exports.getAtifStepTokens = getAtifStepTokens;
    var getAtifCacheCreationTokens = (metrics) => {
      const cacheCreation = metrics.extra?.["cache_creation_input_tokens"];
      return typeof cacheCreation === "number" ? cacheCreation : 0;
    };
    exports.getAtifCacheCreationTokens = getAtifCacheCreationTokens;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/tool-result-duration.js
var require_tool_result_duration = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/tool-result-duration.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getToolResultDurationMs = exports.ATIF_EXTRA_DURATION_MS = void 0;
    exports.ATIF_EXTRA_DURATION_MS = "duration_ms";
    var getToolResultDurationMs = (result) => {
      const value = result.extra?.[exports.ATIF_EXTRA_DURATION_MS];
      return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
    };
    exports.getToolResultDurationMs = getToolResultDurationMs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/walk-trajectories.js
var require_walk_trajectories = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/walk-trajectories.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.walkAtifTrajectories = void 0;
    var walkAtifTrajectories = (root) => {
      const result = [];
      const visit = (trajectory, isSubagent) => {
        result.push({ index: result.length, isSubagent, trajectory });
        for (const subagent of trajectory.subagent_trajectories ?? []) {
          visit(subagent, true);
        }
      };
      visit(root, false);
      return result;
    };
    exports.walkAtifTrajectories = walkAtifTrajectories;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/git/branch-names.js
var require_branch_names = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/git/branch-names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normaliseBranchName = exports.isDefaultBranchName = exports.DEFAULT_BRANCH_NAMES = void 0;
    exports.DEFAULT_BRANCH_NAMES = /* @__PURE__ */ new Set([
      "main",
      "master",
      "develop",
      "development",
      "dev",
      "trunk",
      "staging",
      "production",
      "prod",
      "release",
      "head"
    ]);
    var isDefaultBranchName = (name) => exports.DEFAULT_BRANCH_NAMES.has(name.toLowerCase());
    exports.isDefaultBranchName = isDefaultBranchName;
    var REF_PREFIX_REGEX = /^(?:refs\/heads\/|refs\/remotes\/[^/]+\/|origin\/)/;
    var INVALID_BRANCH_REGEX = /[\s~^:?*[\\]|\.\.|@\{|^[-/.]|[/.]$|\.lock$/;
    var MAX_BRANCH_NAME_LENGTH = 255;
    var normaliseBranchName = (ref) => {
      const name = ref.trim().replace(/^\+/, "").replace(REF_PREFIX_REGEX, "");
      if (name.length === 0 || name.length > MAX_BRANCH_NAME_LENGTH || INVALID_BRANCH_REGEX.test(name) || (0, exports.isDefaultBranchName)(name)) {
        return null;
      }
      return name;
    };
    exports.normaliseBranchName = normaliseBranchName;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/git/normalize-git-remote-url.js
var require_normalize_git_remote_url = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/git/normalize-git-remote-url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeGitRemoteUrl = void 0;
    var normalizeGitRemoteUrl = (url) => {
      const location = parseRemoteLocation(url.trim());
      if (!location) {
        return null;
      }
      const path = location.path.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
      if (!location.host || !path) {
        return null;
      }
      return `${location.host.toLowerCase()}/${path}`;
    };
    exports.normalizeGitRemoteUrl = normalizeGitRemoteUrl;
    var SCP_LIKE_REMOTE_REGEX = /^(?:[^@/]+@)?([^:/]{2,}):(?!\/\/)(.+)$/;
    var parseRemoteLocation = (url) => {
      if (!url.includes("://")) {
        const match = SCP_LIKE_REMOTE_REGEX.exec(url);
        return match ? { host: match[1] ?? "", path: match[2] ?? "" } : null;
      }
      try {
        const parsed = new URL(url);
        return { host: parsed.hostname, path: decodeURIComponent(parsed.pathname) };
      } catch {
        return null;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/git/pull-request-url.js
var require_pull_request_url = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/git/pull-request-url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parsePullRequestUrl = exports.findPullRequestUrls = void 0;
    var PULL_REQUEST_URL_REGEX = /https?:\/\/([A-Za-z0-9.-]+)(?::\d+)?\/([\w.~-]+(?:\/[\w.~-]+)+?)(?:\/-)?\/(?:pull|merge_requests|pull-requests)\/(\d{1,9})(?!\d)/g;
    var findPullRequestUrls = (text) => {
      const results = [];
      for (const match of text.matchAll(PULL_REQUEST_URL_REGEX)) {
        const [, host, path, number] = match;
        if (host && path && number) {
          results.push({
            repository: `${host}/${path}`.toLowerCase(),
            number: Number(number)
          });
        }
      }
      return results;
    };
    exports.findPullRequestUrls = findPullRequestUrls;
    var parsePullRequestUrl = (url) => (0, exports.findPullRequestUrls)(url)[0] ?? null;
    exports.parsePullRequestUrl = parsePullRequestUrl;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/utils/json-guards.js
var require_json_guards = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/utils/json-guards.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.asArray = exports.asNumber = exports.asNonEmptyString = exports.asString = exports.asRecord = void 0;
    var asRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
    exports.asRecord = asRecord;
    var asString = (value) => typeof value === "string" ? value : null;
    exports.asString = asString;
    var asNonEmptyString = (value) => typeof value === "string" && value.length > 0 ? value : null;
    exports.asNonEmptyString = asNonEmptyString;
    var asNumber = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
    exports.asNumber = asNumber;
    var asArray = (value) => Array.isArray(value) ? value : null;
    exports.asArray = asArray;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/activity-stats.js
var require_activity_stats = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/activity-stats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeActivityStats = void 0;
    var computeActivityStats = (root, allTrajectories) => {
      const userSteps = root.steps.filter((step) => step.source === "user");
      const compactions = userSteps.filter((step) => step.extra?.["is_compact_summary"] === true);
      const prompts = userSteps.filter((step) => step.extra?.["is_compact_summary"] !== true && step.extra?.["origin_kind"] === void 0);
      const toolCallCounts = /* @__PURE__ */ new Map();
      let toolErrorCount = 0;
      for (const step of allTrajectories.flatMap((t) => t.steps)) {
        for (const call of step.tool_calls ?? []) {
          toolCallCounts.set(call.function_name, (toolCallCounts.get(call.function_name) ?? 0) + 1);
        }
        for (const result of step.observation?.results ?? []) {
          if (result.extra?.["is_error"] === true) {
            toolErrorCount++;
          }
        }
      }
      return {
        userPromptCount: prompts.length,
        compactionCount: compactions.length,
        toolCallCount: [...toolCallCounts.values()].reduce((a, b) => a + b, 0),
        toolErrorCount,
        toolCallCounts: [...toolCallCounts.entries()].map(([toolName, count]) => ({ toolName, count })).sort((a, b) => b.count - a.count || a.toolName.localeCompare(b.toolName))
      };
    };
    exports.computeActivityStats = computeActivityStats;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/title-from-prompt.js
var require_title_from_prompt = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/title-from-prompt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.titleFromPrompt = void 0;
    var MAX_TITLE_CHARS = 200;
    var titleFromPrompt = (prompt) => {
      const firstLine = prompt?.split("\n").map((line) => line.trim()).find((line) => line.length > 0);
      if (!firstLine) {
        return null;
      }
      return firstLine.length > MAX_TITLE_CHARS ? `${firstLine.slice(0, MAX_TITLE_CHARS - 1)}\u2026` : firstLine;
    };
    exports.titleFromPrompt = titleFromPrompt;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/token-totals.js
var require_token_totals = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/token-totals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.countModels = exports.addTokenTotals = exports.sumStepTokens = void 0;
    var step_token_breakdown_1 = require_step_token_breakdown();
    var ZERO_TOKEN_TOTALS = {
      promptTokens: 0,
      completionTokens: 0,
      cachedTokens: 0,
      cacheCreationTokens: 0
    };
    var sumStepTokens = (steps) => steps.reduce((totals, step) => {
      const metrics = step.metrics;
      if (!metrics) {
        return totals;
      }
      return (0, exports.addTokenTotals)(totals, {
        promptTokens: metrics.prompt_tokens ?? 0,
        completionTokens: metrics.completion_tokens ?? 0,
        cachedTokens: metrics.cached_tokens ?? 0,
        cacheCreationTokens: (0, step_token_breakdown_1.getAtifCacheCreationTokens)(metrics)
      });
    }, ZERO_TOKEN_TOTALS);
    exports.sumStepTokens = sumStepTokens;
    var addTokenTotals = (a, b) => ({
      promptTokens: a.promptTokens + b.promptTokens,
      completionTokens: a.completionTokens + b.completionTokens,
      cachedTokens: a.cachedTokens + b.cachedTokens,
      cacheCreationTokens: a.cacheCreationTokens + b.cacheCreationTokens
    });
    exports.addTokenTotals = addTokenTotals;
    var countModels = (trajectories) => {
      const counts = /* @__PURE__ */ new Map();
      for (const trajectory of trajectories) {
        for (const step of trajectory.steps) {
          if (step.source === "agent" && step.model_name) {
            counts.set(step.model_name, (counts.get(step.model_name) ?? 0) + 1);
          }
        }
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    };
    exports.countModels = countModels;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/stats-from-atif.js
var require_stats_from_atif = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/stats-from-atif.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.statsFromAtif = void 0;
    var json_guards_1 = require_json_guards();
    var activity_stats_1 = require_activity_stats();
    var title_from_prompt_1 = require_title_from_prompt();
    var token_totals_1 = require_token_totals();
    var walk_trajectories_1 = require_walk_trajectories();
    var statsFromAtif = (root) => {
      const all = (0, walk_trajectories_1.walkAtifTrajectories)(root).map(({ trajectory }) => trajectory);
      const extra = root.extra ?? {};
      const gitBranch = (0, json_guards_1.asNonEmptyString)(extra["gitBranch"]);
      const timestamps = all.flatMap((trajectory) => trajectory.steps).flatMap(({ timestamp }) => timestamp && !Number.isNaN(Date.parse(timestamp)) ? [new Date(timestamp).toISOString()] : []).sort();
      const models = (0, token_totals_1.countModels)(all).map(([model]) => model);
      const rootModel = (0, json_guards_1.asNonEmptyString)(root.agent.model_name);
      return {
        cwd: (0, json_guards_1.asNonEmptyString)(extra["cwd"]),
        gitBranch,
        gitBranches: gitBranch ? [gitBranch] : [],
        pullRequests: [],
        agentVersion: (0, json_guards_1.asNonEmptyString)(root.agent.version),
        entrypoint: null,
        permissionModes: [],
        title: (0, json_guards_1.asNonEmptyString)(extra["title"]) ?? (0, title_from_prompt_1.titleFromPrompt)(firstPrompt(root)),
        models: models.length === 0 && rootModel ? [rootModel] : models,
        startedAt: timestamps[0] ?? null,
        endedAt: timestamps.at(-1) ?? null,
        stepCount: root.steps.length,
        subagentCount: all.length - 1,
        totals: tokenTotals(root, all),
        reportedCostUsd: (0, json_guards_1.asNumber)(root.final_metrics?.total_cost_usd),
        activity: (0, activity_stats_1.computeActivityStats)(root, all)
      };
    };
    exports.statsFromAtif = statsFromAtif;
    var tokenTotals = (root, all) => {
      const summed = all.map((trajectory) => (0, token_totals_1.sumStepTokens)(trajectory.steps)).reduce(token_totals_1.addTokenTotals);
      const metrics = root.final_metrics;
      return {
        promptTokens: Math.round((0, json_guards_1.asNumber)(metrics?.total_prompt_tokens) ?? summed.promptTokens),
        completionTokens: Math.round((0, json_guards_1.asNumber)(metrics?.total_completion_tokens) ?? summed.completionTokens),
        cachedTokens: Math.round((0, json_guards_1.asNumber)(metrics?.total_cached_tokens) ?? summed.cachedTokens),
        cacheCreationTokens: Math.round((0, json_guards_1.asNumber)((0, json_guards_1.asRecord)(metrics?.extra)?.["total_cache_creation_tokens"]) ?? summed.cacheCreationTokens)
      };
    };
    var firstPrompt = (root) => {
      const message = root.steps.find((step) => step.source === "user")?.message;
      if (typeof message === "string") {
        return message;
      }
      return message?.flatMap((part) => part.type === "text" ? [part.text] : []).join("\n") ?? null;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/validate-atif-trajectory.js
var require_validate_atif_trajectory = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/validate-atif-trajectory.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAtifTrajectory = void 0;
    var json_guards_1 = require_json_guards();
    var STEP_SOURCES = /* @__PURE__ */ new Set(["system", "user", "agent"]);
    var validateAtifTrajectory = (value) => {
      const record2 = (0, json_guards_1.asRecord)(value);
      const schemaVersion = (0, json_guards_1.asNonEmptyString)(record2?.["schema_version"]);
      if (!record2 || !schemaVersion?.startsWith("ATIF-")) {
        return invalid('schema_version must be a string starting "ATIF-"');
      }
      const error = findTrajectoryError(record2, "");
      return error ? invalid(error) : { trajectory: record2, error: null };
    };
    exports.validateAtifTrajectory = validateAtifTrajectory;
    var findTrajectoryError = (record2, path) => {
      if (!(0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(record2["agent"])?.["name"])) {
        return `${path}agent.name must be a non-empty string`;
      }
      const steps = (0, json_guards_1.asArray)(record2["steps"]);
      if (!steps) {
        return `${path}steps must be an array`;
      }
      for (const [index, step] of steps.entries()) {
        const error = findStepError(step, `${path}steps[${index}]`);
        if (error) {
          return error;
        }
      }
      const subagents = record2["subagent_trajectories"];
      if (subagents === void 0) {
        return null;
      }
      if (!Array.isArray(subagents)) {
        return `${path}subagent_trajectories must be an array`;
      }
      for (const [index, subagent] of subagents.entries()) {
        const subagentPath = `${path}subagent_trajectories[${index}]`;
        const subagentRecord = (0, json_guards_1.asRecord)(subagent);
        const error = subagentRecord ? findTrajectoryError(subagentRecord, `${subagentPath}.`) : `${subagentPath} must be an object`;
        if (error) {
          return error;
        }
      }
      return null;
    };
    var findStepError = (value, path) => {
      const step = (0, json_guards_1.asRecord)(value);
      if (!step) {
        return `${path} must be an object`;
      }
      if (typeof step["step_id"] !== "number") {
        return `${path}.step_id must be a number`;
      }
      if (!STEP_SOURCES.has(step["source"])) {
        return `${path}.source must be "system", "user" or "agent"`;
      }
      const message = step["message"];
      if (typeof message !== "string" && !Array.isArray(message)) {
        return `${path}.message must be a string or an array`;
      }
      if (!isArrayOf(step["tool_calls"], isToolCall)) {
        return `${path}.tool_calls must be an array of calls with a tool_call_id and function_name`;
      }
      const observation = step["observation"];
      if (observation !== void 0 && !isArrayOf((0, json_guards_1.asRecord)(observation)?.["results"] ?? null, isObject)) {
        return `${path}.observation.results must be an array of objects`;
      }
      return null;
    };
    var isArrayOf = (value, isItem) => value === void 0 || Array.isArray(value) && value.every(isItem);
    var isObject = (value) => (0, json_guards_1.asRecord)(value) !== null;
    var isToolCall = (value) => {
      const call = (0, json_guards_1.asRecord)(value);
      return typeof call?.["tool_call_id"] === "string" && typeof call["function_name"] === "string";
    };
    var invalid = (error) => ({
      trajectory: null,
      error
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/link-subagent.js
var require_link_subagent = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/link-subagent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.linkSubagentToToolCall = void 0;
    var linkSubagentToToolCall = (trajectories, toolCallId, ref) => {
      const step = trajectories.flatMap((trajectory) => trajectory.steps).find((candidate) => candidate.tool_calls?.some((call) => call.tool_call_id === toolCallId));
      if (!step) {
        return false;
      }
      step.observation ??= { results: [] };
      let result = step.observation.results.find((candidate) => candidate.source_call_id === toolCallId);
      if (!result) {
        result = { source_call_id: toolCallId };
        step.observation.results.push(result);
      }
      result.subagent_trajectory_ref = [
        ...result.subagent_trajectory_ref ?? [],
        ref
      ];
      return true;
    };
    exports.linkSubagentToToolCall = linkSubagentToToolCall;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/build-leaf-trajectory.js
var require_build_leaf_trajectory = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/build-leaf-trajectory.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildLeafTrajectory = void 0;
    var atif_types_1 = require_atif_types();
    var token_totals_1 = require_token_totals();
    var buildLeafTrajectory = ({ sessionId, trajectoryId, agentName, agentVersion, steps, totals, extra, totalCostUsd }) => {
      const trajectory = {
        schema_version: atif_types_1.ATIF_SCHEMA_VERSION,
        session_id: sessionId,
        ...trajectoryId ? { trajectory_id: trajectoryId } : {},
        agent: { name: agentName, version: agentVersion },
        steps,
        final_metrics: {
          total_prompt_tokens: totals.promptTokens,
          total_completion_tokens: totals.completionTokens,
          total_cached_tokens: totals.cachedTokens,
          ...totalCostUsd !== void 0 ? { total_cost_usd: totalCostUsd } : {},
          total_steps: steps.length,
          extra: { total_cache_creation_tokens: totals.cacheCreationTokens }
        },
        extra
      };
      const mostUsedModel = (0, token_totals_1.countModels)([trajectory])[0]?.[0];
      if (mostUsedModel) {
        trajectory.agent.model_name = mostUsedModel;
      }
      return trajectory;
    };
    exports.buildLeafTrajectory = buildLeafTrajectory;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/utils/assert-never.js
var require_assert_never = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/utils/assert-never.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertNever = void 0;
    var assertNever = (value, message) => {
      throw new Error(message ?? `Unexpected value: ${JSON.stringify(value)}`);
    };
    exports.assertNever = assertNever;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/usage-to-metrics.js
var require_usage_to_metrics = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/usage-to-metrics.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isZeroUsage = exports.usageToMetrics = exports.SYNTHETIC_MODEL = void 0;
    exports.SYNTHETIC_MODEL = "<synthetic>";
    var usageToMetrics = (usage) => ({
      prompt_tokens: usage.inputTokens + usage.cacheCreationInputTokens + usage.cacheReadInputTokens,
      completion_tokens: usage.outputTokens,
      cached_tokens: usage.cacheReadInputTokens,
      extra: {
        input_tokens: usage.inputTokens,
        cache_creation_input_tokens: usage.cacheCreationInputTokens,
        cache_read_input_tokens: usage.cacheReadInputTokens,
        ...usage.thinkingTokens !== null ? { thinking_tokens: usage.thinkingTokens } : {},
        ...usage.serviceTier ? { service_tier: usage.serviceTier } : {},
        ...usage.cacheCreation ? { cache_creation: usage.cacheCreation } : {}
      }
    });
    exports.usageToMetrics = usageToMetrics;
    var isZeroUsage = (usage) => usage.inputTokens === 0 && usage.outputTokens === 0 && usage.cacheCreationInputTokens === 0 && usage.cacheReadInputTokens === 0;
    exports.isZeroUsage = isZeroUsage;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/agent-step-accumulator.js
var require_agent_step_accumulator = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/agent-step-accumulator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.finalizeAgentStep = exports.addAssistantEntry = exports.createAgentStepAccumulator = void 0;
    var usage_to_metrics_1 = require_usage_to_metrics();
    var createAgentStepAccumulator = (messageId, timestamp) => ({
      step: {
        step_id: 0,
        ...timestamp ? { timestamp } : {},
        source: "agent",
        message: ""
      },
      messageId,
      texts: [],
      reasoning: [],
      toolCalls: [],
      usage: null,
      model: null,
      stopReason: null,
      requestId: null,
      otherBlockTypes: /* @__PURE__ */ new Set()
    });
    exports.createAgentStepAccumulator = createAgentStepAccumulator;
    var addAssistantEntry = (accumulator, entry) => {
      const newToolCallIds = [];
      for (const block of entry.blocks) {
        switch (block.type) {
          case "text":
            accumulator.texts.push(block.text);
            break;
          case "thinking":
            accumulator.reasoning.push(block.thinking);
            break;
          case "tool_use":
            accumulator.toolCalls.push({
              tool_call_id: block.id,
              function_name: block.name,
              arguments: block.input
            });
            newToolCallIds.push(block.id);
            break;
          case "other":
            accumulator.otherBlockTypes.add(block.originalType);
            break;
        }
      }
      accumulator.usage = entry.usage ?? accumulator.usage;
      accumulator.model = entry.model ?? accumulator.model;
      accumulator.stopReason = entry.stopReason ?? accumulator.stopReason;
      accumulator.requestId = entry.requestId ?? accumulator.requestId;
      return newToolCallIds;
    };
    exports.addAssistantEntry = addAssistantEntry;
    var finalizeAgentStep = (accumulator) => {
      const { step, usage, model } = accumulator;
      const isSynthetic = model === usage_to_metrics_1.SYNTHETIC_MODEL;
      step.message = joinNonEmpty(accumulator.texts);
      const reasoning = joinNonEmpty(accumulator.reasoning);
      if (reasoning) {
        step.reasoning_content = reasoning;
      }
      if (model && !isSynthetic) {
        step.model_name = model;
      }
      if (accumulator.toolCalls.length > 0) {
        step.tool_calls = accumulator.toolCalls;
      }
      if (usage && !(isSynthetic && (0, usage_to_metrics_1.isZeroUsage)(usage))) {
        step.metrics = (0, usage_to_metrics_1.usageToMetrics)(usage);
      }
      if (!isSynthetic) {
        step.llm_call_count = 1;
      }
      step.extra = {
        ...step.extra,
        message_id: accumulator.messageId,
        ...accumulator.requestId ? { request_id: accumulator.requestId } : {},
        ...accumulator.stopReason ? { stop_reason: accumulator.stopReason } : {},
        ...isSynthetic ? { synthetic: true } : {},
        ...accumulator.otherBlockTypes.size > 0 ? { unconverted_block_types: [...accumulator.otherBlockTypes] } : {}
      };
    };
    exports.finalizeAgentStep = finalizeAgentStep;
    var joinNonEmpty = (parts) => parts.filter((part) => part.length > 0).join("\n\n");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/elapsed-ms.js
var require_elapsed_ms = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/elapsed-ms.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getElapsedMs = void 0;
    var getElapsedMs = (from, to) => {
      if (!from || !to) {
        return null;
      }
      const elapsedMs = Date.parse(to) - Date.parse(from);
      return Number.isFinite(elapsedMs) && elapsedMs >= 0 ? elapsedMs : null;
    };
    exports.getElapsedMs = getElapsedMs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/atif/truncate-observation-content.js
var require_truncate_observation_content = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/atif/truncate-observation-content.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.truncateObservationContent = exports.MAX_OBSERVATION_CONTENT_CHARS = void 0;
    exports.MAX_OBSERVATION_CONTENT_CHARS = 256 * 1024;
    var truncateObservationContent = (content) => {
      if (content.length <= exports.MAX_OBSERVATION_CONTENT_CHARS) {
        return { content, originalLength: null };
      }
      return {
        content: `${content.slice(0, exports.MAX_OBSERVATION_CONTENT_CHARS)}
[truncated]`,
        originalLength: content.length
      };
    };
    exports.truncateObservationContent = truncateObservationContent;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/build-steps.js
var require_build_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/build-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildSteps = void 0;
    var tool_result_duration_1 = require_tool_result_duration();
    var assert_never_1 = require_assert_never();
    var agent_step_accumulator_1 = require_agent_step_accumulator();
    var elapsed_ms_1 = require_elapsed_ms();
    var truncate_observation_content_1 = require_truncate_observation_content();
    var buildSteps = (entries2) => {
      const context = {
        steps: [],
        accumulatorsByMessageId: /* @__PURE__ */ new Map(),
        stepsByToolCallId: /* @__PURE__ */ new Map(),
        toolCallTimestamps: /* @__PURE__ */ new Map(),
        anonymousMessageCount: 0
      };
      for (const entry of entries2) {
        switch (entry.kind) {
          case "assistant":
            addAssistant(context, entry);
            break;
          case "user":
            addUser(context, entry);
            break;
          default:
            (0, assert_never_1.assertNever)(entry);
        }
      }
      context.accumulatorsByMessageId.forEach(agent_step_accumulator_1.finalizeAgentStep);
      context.steps.forEach((step, index) => {
        step.step_id = index + 1;
      });
      return context.steps;
    };
    exports.buildSteps = buildSteps;
    var addAssistant = (context, entry) => {
      const messageId = entry.messageId ?? `anonymous-${++context.anonymousMessageCount}`;
      let accumulator = context.accumulatorsByMessageId.get(messageId);
      if (!accumulator) {
        accumulator = (0, agent_step_accumulator_1.createAgentStepAccumulator)(messageId, entry.timestamp);
        context.accumulatorsByMessageId.set(messageId, accumulator);
        context.steps.push(accumulator.step);
      }
      for (const toolCallId of (0, agent_step_accumulator_1.addAssistantEntry)(accumulator, entry)) {
        context.stepsByToolCallId.set(toolCallId, accumulator.step);
        if (entry.timestamp) {
          context.toolCallTimestamps.set(toolCallId, entry.timestamp);
        }
      }
    };
    var addUser = (context, entry) => {
      const texts = [];
      for (const block of entry.blocks) {
        if (block.type === "text") {
          texts.push(block.text);
        } else if (block.type === "tool_result") {
          attachToolResult(context, block, entry.timestamp);
        }
      }
      if (entry.isMeta || texts.length === 0) {
        return;
      }
      context.steps.push({
        step_id: 0,
        ...entry.timestamp ? { timestamp: entry.timestamp } : {},
        source: "user",
        message: texts.join("\n\n"),
        extra: {
          ...entry.uuid ? { uuid: entry.uuid } : {},
          ...entry.originKind ? { origin_kind: entry.originKind } : {},
          ...entry.isCompactSummary ? { is_compact_summary: true } : {}
        }
      });
    };
    var attachToolResult = (context, block, timestamp) => {
      const { content, originalLength } = (0, truncate_observation_content_1.truncateObservationContent)(block.content);
      const durationMs = (0, elapsed_ms_1.getElapsedMs)(context.toolCallTimestamps.get(block.toolUseId), timestamp);
      const extra = {
        is_error: block.isError,
        ...originalLength !== null ? { truncated: true, original_length_chars: originalLength } : {},
        ...durationMs !== null ? { [tool_result_duration_1.ATIF_EXTRA_DURATION_MS]: durationMs } : {}
      };
      const step = context.stepsByToolCallId.get(block.toolUseId);
      if (step) {
        step.observation ??= { results: [] };
        step.observation.results.push({
          source_call_id: block.toolUseId,
          content,
          extra
        });
        return;
      }
      context.steps.push({
        step_id: 0,
        ...timestamp ? { timestamp } : {},
        source: "system",
        message: "",
        observation: {
          results: [
            { content, extra: { ...extra, orphan_tool_use_id: block.toolUseId } }
          ]
        }
      });
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-pull-request-link.js
var require_parse_pull_request_link = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-pull-request-link.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parsePullRequestLink = void 0;
    var json_guards_1 = require_json_guards();
    var parsePullRequestLink = (line) => {
      const number = (0, json_guards_1.asNumber)(line["prNumber"]);
      const url = (0, json_guards_1.asNonEmptyString)(line["prUrl"]);
      if (number === null || url === null) {
        return null;
      }
      return {
        number,
        url,
        repository: (0, json_guards_1.asNonEmptyString)(line["prRepository"])
      };
    };
    exports.parsePullRequestLink = parsePullRequestLink;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/transcript.types.js
var require_transcript_types = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/transcript.types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMAGE_PLACEHOLDER = void 0;
    exports.IMAGE_PLACEHOLDER = "[image omitted]";
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/tool-result-content.js
var require_tool_result_content = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/tool-result-content.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flattenToolResultContent = void 0;
    var json_guards_1 = require_json_guards();
    var transcript_types_1 = require_transcript_types();
    var flattenToolResultContent = (content) => {
      if (typeof content === "string") {
        return content;
      }
      if (!Array.isArray(content)) {
        return content === null || content === void 0 ? "" : JSON.stringify(content);
      }
      return content.map(flattenContentItem).join("\n");
    };
    exports.flattenToolResultContent = flattenToolResultContent;
    var flattenContentItem = (item) => {
      const record2 = (0, json_guards_1.asRecord)(item);
      switch ((0, json_guards_1.asString)(record2?.["type"])) {
        case "text":
          return (0, json_guards_1.asString)(record2?.["text"]) ?? "";
        case "image":
          return transcript_types_1.IMAGE_PLACEHOLDER;
        case "tool_reference":
          return `[tool_reference: ${(0, json_guards_1.asString)(record2?.["tool_name"]) ?? "unknown"}]`;
        default:
          return typeof item === "string" ? item : JSON.stringify(item);
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-message-lines.js
var require_parse_message_lines = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-message-lines.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseUserLine = exports.parseAssistantLine = void 0;
    var json_guards_1 = require_json_guards();
    var tool_result_content_1 = require_tool_result_content();
    var transcript_types_1 = require_transcript_types();
    var parseAssistantLine = (line) => {
      const message = (0, json_guards_1.asRecord)(line["message"]);
      if (!message) {
        return null;
      }
      return {
        kind: "assistant",
        timestamp: (0, json_guards_1.asNonEmptyString)(line["timestamp"]),
        messageId: (0, json_guards_1.asNonEmptyString)(message["id"]),
        model: (0, json_guards_1.asNonEmptyString)(message["model"]),
        stopReason: (0, json_guards_1.asNonEmptyString)(message["stop_reason"]),
        requestId: (0, json_guards_1.asNonEmptyString)(line["requestId"]),
        blocks: ((0, json_guards_1.asArray)(message["content"]) ?? []).flatMap(parseAssistantBlock),
        usage: parseUsage(message["usage"])
      };
    };
    exports.parseAssistantLine = parseAssistantLine;
    var parseUserLine = (line) => {
      const message = (0, json_guards_1.asRecord)(line["message"]);
      if (!message) {
        return null;
      }
      const content = message["content"];
      const blocks = typeof content === "string" ? [{ type: "text", text: content }] : ((0, json_guards_1.asArray)(content) ?? []).flatMap(parseUserBlock);
      return {
        kind: "user",
        uuid: (0, json_guards_1.asNonEmptyString)(line["uuid"]),
        timestamp: (0, json_guards_1.asNonEmptyString)(line["timestamp"]),
        isMeta: line["isMeta"] === true,
        isCompactSummary: line["isCompactSummary"] === true,
        originKind: injectedOriginKind((0, json_guards_1.asRecord)(line["origin"])?.["kind"]),
        blocks
      };
    };
    exports.parseUserLine = parseUserLine;
    var injectedOriginKind = (value) => {
      const kind = (0, json_guards_1.asNonEmptyString)(value);
      return kind === "human" ? null : kind;
    };
    var parseAssistantBlock = (value) => {
      const block = (0, json_guards_1.asRecord)(value);
      const type = (0, json_guards_1.asString)(block?.["type"]);
      if (!block || !type) {
        return [];
      }
      switch (type) {
        case "text":
          return [{ type: "text", text: (0, json_guards_1.asString)(block["text"]) ?? "" }];
        case "thinking":
          return [
            { type: "thinking", thinking: (0, json_guards_1.asString)(block["thinking"]) ?? "" }
          ];
        case "tool_use": {
          const id = (0, json_guards_1.asNonEmptyString)(block["id"]);
          if (!id) {
            return [];
          }
          return [
            {
              type: "tool_use",
              id,
              name: (0, json_guards_1.asString)(block["name"]) ?? "unknown",
              input: (0, json_guards_1.asRecord)(block["input"]) ?? {}
            }
          ];
        }
        default:
          return [{ type: "other", originalType: type }];
      }
    };
    var parseUserBlock = (value) => {
      const block = (0, json_guards_1.asRecord)(value);
      const type = (0, json_guards_1.asString)(block?.["type"]);
      if (!block || !type) {
        return [];
      }
      switch (type) {
        case "text":
          return [{ type: "text", text: (0, json_guards_1.asString)(block["text"]) ?? "" }];
        case "image":
          return [{ type: "text", text: transcript_types_1.IMAGE_PLACEHOLDER }];
        case "tool_result": {
          const toolUseId = (0, json_guards_1.asNonEmptyString)(block["tool_use_id"]);
          if (!toolUseId) {
            return [];
          }
          return [
            {
              type: "tool_result",
              toolUseId,
              content: (0, tool_result_content_1.flattenToolResultContent)(block["content"]),
              isError: block["is_error"] === true
            }
          ];
        }
        default:
          return [{ type: "other", originalType: type }];
      }
    };
    var parseUsage = (value) => {
      const usage = (0, json_guards_1.asRecord)(value);
      if (!usage) {
        return null;
      }
      return {
        inputTokens: (0, json_guards_1.asNumber)(usage["input_tokens"]) ?? 0,
        outputTokens: (0, json_guards_1.asNumber)(usage["output_tokens"]) ?? 0,
        cacheCreationInputTokens: (0, json_guards_1.asNumber)(usage["cache_creation_input_tokens"]) ?? 0,
        cacheReadInputTokens: (0, json_guards_1.asNumber)(usage["cache_read_input_tokens"]) ?? 0,
        thinkingTokens: (0, json_guards_1.asNumber)((0, json_guards_1.asRecord)(usage["output_tokens_details"])?.["thinking_tokens"]),
        serviceTier: (0, json_guards_1.asNonEmptyString)(usage["service_tier"]),
        cacheCreation: (0, json_guards_1.asRecord)(usage["cache_creation"])
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-transcript.js
var require_parse_transcript = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-transcript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseTranscript = void 0;
    var json_guards_1 = require_json_guards();
    var parse_pull_request_link_1 = require_parse_pull_request_link();
    var parse_message_lines_1 = require_parse_message_lines();
    var parseTranscript = (text) => {
      const entries2 = [];
      const metadata = createEmptyMetadata();
      for (const rawLine of text.split("\n")) {
        if (!rawLine.trim()) {
          continue;
        }
        const line = parseJsonLine(rawLine);
        if (!line) {
          metadata.malformedLineCount++;
          continue;
        }
        updateMetadata(metadata, line);
        const entry = toEntry(line);
        if (entry) {
          entries2.push(entry);
        }
      }
      return { entries: entries2, metadata };
    };
    exports.parseTranscript = parseTranscript;
    var toEntry = (line) => {
      switch (line["type"]) {
        case "assistant":
          return (0, parse_message_lines_1.parseAssistantLine)(line);
        case "user":
          return (0, parse_message_lines_1.parseUserLine)(line);
        default:
          return null;
      }
    };
    var updateMetadata = (metadata, line) => {
      metadata.cwd ??= (0, json_guards_1.asNonEmptyString)(line["cwd"]);
      metadata.slug ??= (0, json_guards_1.asNonEmptyString)(line["slug"]);
      metadata.entrypoint ??= (0, json_guards_1.asNonEmptyString)(line["entrypoint"]);
      const gitBranch = (0, json_guards_1.asNonEmptyString)(line["gitBranch"]);
      metadata.gitBranch = gitBranch ?? metadata.gitBranch;
      addUnique(metadata.gitBranches, gitBranch);
      addUnique(metadata.permissionModes, (0, json_guards_1.asNonEmptyString)(line["permissionMode"]));
      metadata.version = (0, json_guards_1.asNonEmptyString)(line["version"]) ?? metadata.version;
      const timestamp = (0, json_guards_1.asNonEmptyString)(line["timestamp"]);
      if (timestamp && !Number.isNaN(Date.parse(timestamp))) {
        if (!metadata.startedAt || timestamp < metadata.startedAt) {
          metadata.startedAt = timestamp;
        }
        if (!metadata.endedAt || timestamp > metadata.endedAt) {
          metadata.endedAt = timestamp;
        }
      }
      switch (line["type"]) {
        case "ai-title":
          metadata.aiTitle = (0, json_guards_1.asNonEmptyString)(line["aiTitle"]) ?? metadata.aiTitle;
          break;
        case "custom-title":
          metadata.customTitle = (0, json_guards_1.asNonEmptyString)(line["customTitle"]) ?? metadata.customTitle;
          break;
        case "summary":
          metadata.summaryTitle = (0, json_guards_1.asNonEmptyString)(line["summary"]) ?? metadata.summaryTitle;
          break;
        case "cost-state":
          metadata.reportedCostUsd = (0, json_guards_1.asNumber)(line["totalCostUSD"]) ?? metadata.reportedCostUsd;
          break;
        case "pr-link": {
          const pullRequest = (0, parse_pull_request_link_1.parsePullRequestLink)(line);
          if (pullRequest && !metadata.pullRequests.some(({ url }) => url === pullRequest.url)) {
            metadata.pullRequests.push(pullRequest);
          }
          break;
        }
      }
    };
    var addUnique = (values, value) => {
      if (value !== null && !values.includes(value)) {
        values.push(value);
      }
    };
    var parseJsonLine = (rawLine) => {
      try {
        const parsed = (0, json_guards_1.asRecord)(JSON.parse(rawLine));
        return parsed && (0, json_guards_1.asString)(parsed["type"]) !== null ? parsed : null;
      } catch {
        return null;
      }
    };
    var createEmptyMetadata = () => ({
      cwd: null,
      gitBranch: null,
      gitBranches: [],
      entrypoint: null,
      permissionModes: [],
      pullRequests: [],
      version: null,
      slug: null,
      startedAt: null,
      endedAt: null,
      aiTitle: null,
      customTitle: null,
      summaryTitle: null,
      reportedCostUsd: null,
      malformedLineCount: 0
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/convert-transcript.js
var require_convert_transcript = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/convert-transcript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertTranscript = void 0;
    var build_leaf_trajectory_1 = require_build_leaf_trajectory();
    var token_totals_1 = require_token_totals();
    var build_steps_1 = require_build_steps();
    var parse_transcript_1 = require_parse_transcript();
    var CLAUDE_CODE_AGENT_NAME = "claude-code";
    var convertTranscript = ({ text, sessionId, trajectoryId, extra }) => {
      const { entries: entries2, metadata } = (0, parse_transcript_1.parseTranscript)(text);
      const steps = (0, build_steps_1.buildSteps)(entries2);
      const totals = (0, token_totals_1.sumStepTokens)(steps);
      const trajectory = (0, build_leaf_trajectory_1.buildLeafTrajectory)({
        sessionId,
        trajectoryId,
        agentName: CLAUDE_CODE_AGENT_NAME,
        agentVersion: metadata.version ?? "unknown",
        steps,
        totals,
        extra: {
          ...extra,
          ...metadata.malformedLineCount > 0 ? { malformed_line_count: metadata.malformedLineCount } : {}
        }
      });
      return { trajectory, metadata, totals };
    };
    exports.convertTranscript = convertTranscript;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-subagent-meta.js
var require_parse_subagent_meta = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/parse-subagent-meta.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSubagentMeta = void 0;
    var json_guards_1 = require_json_guards();
    var parseSubagentMeta = (text) => {
      let record2 = null;
      try {
        record2 = text ? (0, json_guards_1.asRecord)(JSON.parse(text)) : null;
      } catch {
        record2 = null;
      }
      return {
        agentType: (0, json_guards_1.asNonEmptyString)(record2?.["agentType"]),
        description: (0, json_guards_1.asNonEmptyString)(record2?.["description"]),
        toolUseId: (0, json_guards_1.asNonEmptyString)(record2?.["toolUseId"]),
        spawnDepth: (0, json_guards_1.asNumber)(record2?.["spawnDepth"])
      };
    };
    exports.parseSubagentMeta = parseSubagentMeta;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/convert-session.js
var require_convert_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/convert-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertClaudeCodeSession = void 0;
    var activity_stats_1 = require_activity_stats();
    var link_subagent_1 = require_link_subagent();
    var token_totals_1 = require_token_totals();
    var convert_transcript_1 = require_convert_transcript();
    var parse_subagent_meta_1 = require_parse_subagent_meta();
    var convertClaudeCodeSession = (transcripts, converterVersion) => {
      const { sessionId } = transcripts;
      const main = (0, convert_transcript_1.convertTranscript)({
        text: transcripts.mainText,
        sessionId,
        trajectoryId: null,
        extra: {}
      });
      const subagents = transcripts.subagents.map((subagent) => convertSubagent(sessionId, subagent));
      const subagentTrajectories = subagents.map(({ converted }) => converted.trajectory);
      const allTrajectories = [main.trajectory, ...subagentTrajectories];
      for (const { trajectoryId, meta } of subagents) {
        if (meta.toolUseId) {
          (0, link_subagent_1.linkSubagentToToolCall)(allTrajectories, meta.toolUseId, {
            trajectory_id: trajectoryId,
            session_id: sessionId,
            extra: { agent_type: meta.agentType, description: meta.description }
          });
        }
      }
      const all = [main, ...subagents.map(({ converted }) => converted)];
      const totals = all.map((c) => c.totals).reduce(token_totals_1.addTokenTotals);
      const metadata = main.metadata;
      const title = metadata.customTitle ?? metadata.aiTitle ?? metadata.summaryTitle;
      const root = {
        ...main.trajectory,
        notes: `Converted from Claude Code transcripts by meticulous-agent-traces ${converterVersion}. final_metrics totals include every embedded subagent trajectory; total_steps counts root steps only.`,
        final_metrics: {
          total_prompt_tokens: totals.promptTokens,
          total_completion_tokens: totals.completionTokens,
          total_cached_tokens: totals.cachedTokens,
          total_steps: main.trajectory.steps.length,
          extra: {
            includes_subagent_trajectories: true,
            total_cache_creation_tokens: totals.cacheCreationTokens,
            total_steps_including_subagents: allTrajectories.reduce((sum, trajectory) => sum + trajectory.steps.length, 0),
            ...metadata.reportedCostUsd !== null ? { claude_code_reported_cost_usd: metadata.reportedCostUsd } : {}
          }
        },
        extra: {
          ...main.trajectory.extra,
          cwd: metadata.cwd,
          gitBranch: metadata.gitBranch,
          title,
          slug: metadata.slug
        },
        ...subagentTrajectories.length > 0 ? { subagent_trajectories: subagentTrajectories } : {}
      };
      return {
        trajectory: root,
        stats: {
          cwd: metadata.cwd,
          gitBranch: metadata.gitBranch,
          gitBranches: metadata.gitBranches,
          pullRequests: metadata.pullRequests,
          agentVersion: metadata.version,
          entrypoint: metadata.entrypoint,
          permissionModes: metadata.permissionModes,
          title,
          models: (0, token_totals_1.countModels)(allTrajectories).map(([model]) => model),
          ...getTimeRange(all.map((c) => c.metadata)),
          stepCount: main.trajectory.steps.length,
          subagentCount: subagents.length,
          totals,
          reportedCostUsd: metadata.reportedCostUsd,
          activity: (0, activity_stats_1.computeActivityStats)(root, allTrajectories)
        }
      };
    };
    exports.convertClaudeCodeSession = convertClaudeCodeSession;
    var convertSubagent = (sessionId, subagent) => {
      const meta = (0, parse_subagent_meta_1.parseSubagentMeta)(subagent.metaText);
      const trajectoryId = `agent-${subagent.agentId}`;
      const converted = (0, convert_transcript_1.convertTranscript)({
        text: subagent.text,
        sessionId,
        trajectoryId,
        extra: {
          agent_id: subagent.agentId,
          agent_type: meta.agentType,
          description: meta.description,
          parent_tool_use_id: meta.toolUseId,
          spawn_depth: meta.spawnDepth
        }
      });
      return { converted, meta, trajectoryId };
    };
    var getTimeRange = (metadatas) => {
      const starts = metadatas.flatMap((m) => m.startedAt ? [m.startedAt] : []);
      const ends = metadatas.flatMap((m) => m.endedAt ? [m.endedAt] : []);
      return {
        startedAt: starts.sort()[0] ?? null,
        endedAt: ends.sort().at(-1) ?? null
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/build-claude-code-payload.js
var require_build_claude_code_payload = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/build-claude-code-payload.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildClaudeCodePayload = void 0;
    var convert_session_1 = require_convert_session();
    var buildClaudeCodePayload = ({ sessionId, projectDirName, main, subagents }, converterVersion) => {
      const { trajectory, stats } = (0, convert_session_1.convertClaudeCodeSession)({
        sessionId,
        mainText: main.content,
        subagents: subagents.map(({ agentId, jsonl, meta }) => ({
          agentId,
          text: jsonl.content,
          metaText: meta?.content ?? null
        }))
      }, converterVersion);
      return {
        envelope: {
          envelopeVersion: 1,
          agent: "claude-code",
          sessionId,
          projectDirName,
          files: [
            main,
            ...subagents.flatMap(({ jsonl, meta }) => meta ? [jsonl, meta] : [jsonl])
          ]
        },
        trajectory,
        stats
      };
    };
    exports.buildClaudeCodePayload = buildClaudeCodePayload;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/rewrite-raw-file.js
var require_rewrite_raw_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/rewrite-raw-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.keepOnly = exports.forEachObject = exports.rewriteJsonFile = exports.rewriteJsonLinesFile = void 0;
    var rewriteJsonLinesFile = (file, rewrite) => {
      let changed = false;
      const lines = file.content.split("\n").map((line) => {
        const parsed = parseJson(line);
        if (parsed === void 0 || !rewrite(parsed)) {
          return line;
        }
        changed = true;
        return JSON.stringify(parsed);
      });
      return changed ? withContent(file, lines.join("\n")) : file;
    };
    exports.rewriteJsonLinesFile = rewriteJsonLinesFile;
    var rewriteJsonFile = (file, rewrite, format = (value) => JSON.stringify(value)) => {
      const parsed = parseJson(file.content);
      if (parsed === void 0 || !rewrite(parsed)) {
        return file;
      }
      return withContent(file, format(parsed));
    };
    exports.rewriteJsonFile = rewriteJsonFile;
    var forEachObject = (value, visit) => {
      if (Array.isArray(value)) {
        value.forEach((item) => (0, exports.forEachObject)(item, visit));
        return;
      }
      if (typeof value !== "object" || value === null) {
        return;
      }
      const record2 = value;
      visit(record2);
      Object.values(record2).forEach((child) => (0, exports.forEachObject)(child, visit));
    };
    exports.forEachObject = forEachObject;
    var keepOnly = (record2, kept, extra) => {
      for (const key of Object.keys(record2)) {
        if (!kept.has(key)) {
          delete record2[key];
        }
      }
      Object.assign(record2, extra);
    };
    exports.keepOnly = keepOnly;
    var parseJson = (text) => {
      if (text.trim() === "") {
        return void 0;
      }
      try {
        return JSON.parse(text);
      } catch {
        return void 0;
      }
    };
    var withContent = (file, content) => ({
      ...file,
      content,
      sizeBytes: Buffer.byteLength(content, "utf8")
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/tool-output-filter.js
var require_tool_output_filter = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/tool-output-filter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.matchesAny = exports.createToolOutputFilter = exports.EXCLUDED_TOOL_OUTPUT = void 0;
    exports.EXCLUDED_TOOL_OUTPUT = "[OMITTED: tool output excluded by excludeToolOutputRegex]";
    var createToolOutputFilter = (regexes, excludedCallIds) => ({
      isExcluded: ({ names: names2 = [], callId }) => !!callId && excludedCallIds.has(callId) || names2.some((name) => !!name && (0, exports.matchesAny)(regexes, name))
    });
    exports.createToolOutputFilter = createToolOutputFilter;
    var matchesAny = (regexes, name) => regexes.some((regex) => regex.test(name));
    exports.matchesAny = matchesAny;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/strip-claude-code-tool-outputs.js
var require_strip_claude_code_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/claude-code/strip-claude-code-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripClaudeCodeToolOutputs = void 0;
    var rewrite_raw_file_1 = require_rewrite_raw_file();
    var tool_output_filter_1 = require_tool_output_filter();
    var json_guards_1 = require_json_guards();
    var KEPT_RESULT_KEYS = /* @__PURE__ */ new Set(["type", "tool_use_id", "is_error"]);
    var LINE_OUTPUT_KEYS = ["toolUseResult", "mcpMeta"];
    var AGENT_PROGRESS = "agent_progress";
    var stripClaudeCodeToolOutputs = (files, filter) => {
      const namesById = collectToolNames(files);
      const isExcluded = (id) => !!id && filter.isExcluded({ callId: id, names: [namesById.get(id)] });
      return files.map((file) => isJsonLines(file) ? (0, rewrite_raw_file_1.rewriteJsonLinesFile)(file, (line) => stripLine(line, isExcluded)) : file);
    };
    exports.stripClaudeCodeToolOutputs = stripClaudeCodeToolOutputs;
    var stripLine = (line, isExcluded) => {
      const record2 = (0, json_guards_1.asRecord)(line);
      if (!record2) {
        return false;
      }
      let changed = stripProgress(record2, isExcluded);
      (0, rewrite_raw_file_1.forEachObject)(record2, (object) => {
        const type = (0, json_guards_1.asString)(object["type"]);
        if (type?.endsWith("tool_result") && isExcluded((0, json_guards_1.asNonEmptyString)(object["tool_use_id"]))) {
          (0, rewrite_raw_file_1.keepOnly)(object, KEPT_RESULT_KEYS, { content: tool_output_filter_1.EXCLUDED_TOOL_OUTPUT });
          changed = true;
        }
      });
      if (changed) {
        for (const key of LINE_OUTPUT_KEYS) {
          if (key in record2) {
            record2[key] = tool_output_filter_1.EXCLUDED_TOOL_OUTPUT;
          }
        }
      }
      return changed;
    };
    var stripProgress = (record2, isExcluded) => {
      const data = (0, json_guards_1.asRecord)(record2["data"]);
      const dataType = (0, json_guards_1.asString)(data?.["type"]);
      if (record2["type"] !== "progress" || !data || dataType === AGENT_PROGRESS || !(isExcluded((0, json_guards_1.asNonEmptyString)(record2["parentToolUseID"])) || isExcluded((0, json_guards_1.asNonEmptyString)(record2["toolUseID"])))) {
        return false;
      }
      record2["data"] = { type: dataType, output: tool_output_filter_1.EXCLUDED_TOOL_OUTPUT };
      return true;
    };
    var collectToolNames = (files) => {
      const names2 = /* @__PURE__ */ new Map();
      for (const file of files.filter(isJsonLines)) {
        for (const line of file.content.split("\n")) {
          if (!line.includes("tool_use")) {
            continue;
          }
          try {
            (0, rewrite_raw_file_1.forEachObject)(JSON.parse(line), (object) => {
              const id = (0, json_guards_1.asNonEmptyString)(object["id"]);
              const name = (0, json_guards_1.asNonEmptyString)(object["name"]);
              if (id && name && (0, json_guards_1.asString)(object["type"])?.endsWith("tool_use")) {
                names2.set(id, name);
              }
            });
          } catch {
          }
        }
      }
      return names2;
    };
    var isJsonLines = (file) => file.relativePath.endsWith(".jsonl");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/find-git-dirs.js
var require_find_git_dirs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/find-git-dirs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTextOrNull = exports.findGitDirs = void 0;
    var fs_1 = __require("fs");
    var path_1 = __require("path");
    var MAX_PARENT_DIRS = 64;
    var findGitDirs = (startDir) => {
      let dir = (0, path_1.resolve)(startDir);
      for (let depth = 0; depth < MAX_PARENT_DIRS; depth++) {
        const dotGit = (0, path_1.join)(dir, ".git");
        const gitDir = resolveDotGit(dotGit);
        if (gitDir) {
          return { gitDir, commonDir: readCommonDir(gitDir) };
        }
        const parent = (0, path_1.dirname)(dir);
        if (parent === dir) {
          return null;
        }
        dir = parent;
      }
      return null;
    };
    exports.findGitDirs = findGitDirs;
    var resolveDotGit = (dotGit) => {
      try {
        const stats = (0, fs_1.statSync)(dotGit);
        if (stats.isDirectory()) {
          return dotGit;
        }
        if (!stats.isFile()) {
          return null;
        }
      } catch {
        return null;
      }
      const match = /^gitdir:\s*(.+)$/m.exec((0, exports.readTextOrNull)(dotGit) ?? "");
      const target = match?.[1]?.trim();
      if (!target) {
        return null;
      }
      return (0, path_1.isAbsolute)(target) ? target : (0, path_1.resolve)((0, path_1.dirname)(dotGit), target);
    };
    var readCommonDir = (gitDir) => {
      const commonDir = (0, exports.readTextOrNull)((0, path_1.join)(gitDir, "commondir"))?.trim();
      if (!commonDir) {
        return gitDir;
      }
      return (0, path_1.isAbsolute)(commonDir) ? commonDir : (0, path_1.resolve)(gitDir, commonDir);
    };
    var readTextOrNull = (path) => {
      try {
        return (0, fs_1.readFileSync)(path, "utf8");
      } catch {
        return null;
      }
    };
    exports.readTextOrNull = readTextOrNull;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/read-git-branch.js
var require_read_git_branch = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/read-git-branch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readGitBranch = void 0;
    var path_1 = __require("path");
    var find_git_dirs_1 = require_find_git_dirs();
    var readGitBranch = (cwd) => {
      const gitDirs = cwd ? (0, find_git_dirs_1.findGitDirs)(cwd) : null;
      const head = gitDirs ? (0, find_git_dirs_1.readTextOrNull)((0, path_1.join)(gitDirs.gitDir, "HEAD")) : null;
      return /^ref: refs\/heads\/(.+)$/m.exec(head ?? "")?.[1]?.trim() || null;
    };
    exports.readGitBranch = readGitBranch;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/usage-to-metrics.js
var require_usage_to_metrics2 = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/usage-to-metrics.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.usageToMetrics = void 0;
    var usageToMetrics = (usage, responseId) => ({
      prompt_tokens: usage.inputTokens,
      completion_tokens: usage.outputTokens,
      cached_tokens: usage.cachedInputTokens,
      extra: {
        cache_creation_input_tokens: usage.cacheWriteInputTokens,
        reasoning_output_tokens: usage.reasoningOutputTokens,
        total_tokens: usage.totalTokens,
        ...responseId ? { response_id: responseId } : {}
      }
    });
    exports.usageToMetrics = usageToMetrics;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/codex-step-accumulator.js
var require_codex_step_accumulator = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/codex-step-accumulator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.finalizeStep = exports.addUsage = exports.addModelOutput = exports.createStepAccumulator = void 0;
    var usage_to_metrics_1 = require_usage_to_metrics2();
    var createStepAccumulator = (position, model, effort) => ({
      step: {
        step_id: 0,
        ...position.timestamp ? { timestamp: position.timestamp } : {},
        source: "agent",
        ...model ? { model_name: model } : {},
        ...effort ? { reasoning_effort: effort } : {},
        message: "",
        ...position.copied ? { is_copied_context: true } : {},
        ...position.reverted ? { extra: { reverted: true } } : {}
      },
      texts: [],
      reasoning: [],
      encryptedReasoning: false,
      toolCalls: [],
      messageIds: [],
      phases: [],
      sawToolOutput: false,
      metered: false
    });
    exports.createStepAccumulator = createStepAccumulator;
    var addModelOutput = (accumulator, entry) => {
      switch (entry.kind) {
        case "assistant":
          accumulator.texts.push(entry.text);
          addUnique(accumulator.messageIds, entry.messageId);
          addUnique(accumulator.phases, entry.phase);
          break;
        case "reasoning":
          accumulator.reasoning.push(entry.summary, entry.content);
          accumulator.encryptedReasoning ||= entry.encrypted;
          break;
        case "tool-call":
          accumulator.toolCalls.push(entry.call);
          break;
      }
    };
    exports.addModelOutput = addModelOutput;
    var addUsage = (accumulator, usage, responseId) => {
      accumulator.step.metrics = (0, usage_to_metrics_1.usageToMetrics)(usage, responseId);
      accumulator.metered = true;
    };
    exports.addUsage = addUsage;
    var finalizeStep = (accumulator) => {
      const { step } = accumulator;
      step.message = joinNonEmpty(accumulator.texts);
      const reasoning = joinNonEmpty(accumulator.reasoning);
      if (reasoning) {
        step.reasoning_content = reasoning;
      }
      if (accumulator.toolCalls.length > 0) {
        step.tool_calls = accumulator.toolCalls;
      }
      if (!step.is_copied_context) {
        step.llm_call_count = 1;
      }
      const isUsageOnly = accumulator.texts.length === 0 && accumulator.reasoning.length === 0 && accumulator.toolCalls.length === 0;
      const extra = {
        ...step.extra,
        ...accumulator.messageIds.length > 0 ? { message_ids: accumulator.messageIds } : {},
        ...accumulator.phases.length > 0 ? { phases: accumulator.phases } : {},
        ...accumulator.encryptedReasoning ? { encrypted_reasoning: true } : {},
        ...isUsageOnly ? { usage_only: true } : {}
      };
      if (Object.keys(extra).length > 0) {
        step.extra = extra;
      }
    };
    exports.finalizeStep = finalizeStep;
    var addUnique = (values, value) => {
      if (value !== null && !values.includes(value)) {
        values.push(value);
      }
    };
    var joinNonEmpty = (parts) => parts.filter((part) => part.length > 0).join("\n\n");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/detect-tool-error.js
var require_detect_tool_error = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/detect-tool-error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.outputLooksFailed = void 0;
    var json_guards_1 = require_json_guards();
    var HEADER_CHARS = 512;
    var EXIT_CODE_PATTERNS = [
      /^Process exited with code (-?\d+)$/m,
      /^Exit code: (-?\d+)$/m
    ];
    var outputLooksFailed = (content) => {
      const header = content.slice(0, HEADER_CHARS);
      for (const pattern of EXIT_CODE_PATTERNS) {
        const code = pattern.exec(header)?.[1];
        if (code !== void 0) {
          return Number(code) !== 0;
        }
      }
      return legacyShellExitCode(content) !== 0;
    };
    exports.outputLooksFailed = outputLooksFailed;
    var legacyShellExitCode = (content) => {
      if (!content.startsWith("{")) {
        return 0;
      }
      try {
        const parsed = (0, json_guards_1.asRecord)(JSON.parse(content));
        return (0, json_guards_1.asNumber)((0, json_guards_1.asRecord)(parsed?.["metadata"])?.["exit_code"]) ?? 0;
      } catch {
        return 0;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/build-codex-steps.js
var require_build_codex_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/build-codex-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildCodexSteps = void 0;
    var tool_result_duration_1 = require_tool_result_duration();
    var assert_never_1 = require_assert_never();
    var elapsed_ms_1 = require_elapsed_ms();
    var truncate_observation_content_1 = require_truncate_observation_content();
    var codex_step_accumulator_1 = require_codex_step_accumulator();
    var detect_tool_error_1 = require_detect_tool_error();
    var buildCodexSteps = (entries2, events) => {
      const context = {
        steps: [],
        open: null,
        stepsByCallId: /* @__PURE__ */ new Map(),
        callTimestamps: /* @__PURE__ */ new Map(),
        events,
        model: null,
        effort: null
      };
      for (const entry of entries2) {
        addEntry(context, entry);
      }
      closeStep(context);
      context.steps.forEach((step, index) => {
        step.step_id = index + 1;
      });
      return context.steps;
    };
    exports.buildCodexSteps = buildCodexSteps;
    var addEntry = (context, entry) => {
      switch (entry.kind) {
        case "turn-context":
          closeStep(context);
          context.model = entry.model ?? context.model;
          context.effort = entry.effort ?? context.effort;
          break;
        case "turn-boundary":
          closeStep(context);
          break;
        case "user":
        case "compaction":
          closeStep(context);
          context.steps.push(toUserStep(entry));
          break;
        case "assistant":
        case "reasoning":
        case "tool-call": {
          const accumulator = openStep(context, entry);
          (0, codex_step_accumulator_1.addModelOutput)(accumulator, entry);
          if (entry.kind === "tool-call") {
            context.stepsByCallId.set(entry.call.tool_call_id, accumulator.step);
            if (entry.timestamp) {
              context.callTimestamps.set(entry.call.tool_call_id, entry.timestamp);
            }
          }
          break;
        }
        case "tool-output":
          attachToolOutput(context, entry);
          break;
        case "usage":
          if (!entry.copied) {
            const accumulator = context.open && !context.open.metered ? context.open : openStep(context, entry, { fresh: true });
            (0, codex_step_accumulator_1.addUsage)(accumulator, entry.usage, entry.responseId);
            closeStep(context);
          }
          break;
        default:
          (0, assert_never_1.assertNever)(entry);
      }
    };
    var openStep = (context, entry, { fresh } = { fresh: false }) => {
      if (context.open && (fresh || context.open.sawToolOutput)) {
        closeStep(context);
      }
      if (!context.open) {
        context.open = (0, codex_step_accumulator_1.createStepAccumulator)(entry, context.model, context.effort);
        context.steps.push(context.open.step);
      }
      return context.open;
    };
    var closeStep = (context) => {
      if (context.open) {
        (0, codex_step_accumulator_1.finalizeStep)(context.open);
        context.open = null;
      }
    };
    var toUserStep = (entry) => {
      const extra = {
        ...entry.kind === "user" && entry.originKind ? { origin_kind: entry.originKind } : {},
        ...entry.kind === "compaction" ? { is_compact_summary: true } : {},
        ...entry.reverted ? { reverted: true } : {}
      };
      return {
        step_id: 0,
        ...entry.timestamp ? { timestamp: entry.timestamp } : {},
        source: "user",
        message: entry.kind === "user" ? entry.text : entry.summary,
        ...entry.copied ? { is_copied_context: true } : {},
        ...Object.keys(extra).length > 0 ? { extra } : {}
      };
    };
    var attachToolOutput = (context, entry) => {
      const { content, originalLength } = (0, truncate_observation_content_1.truncateObservationContent)(entry.content);
      const durationMs = context.events.durationMsByCallId.get(entry.callId) ?? (0, elapsed_ms_1.getElapsedMs)(context.callTimestamps.get(entry.callId), entry.timestamp);
      const extra = {
        is_error: context.events.failedCallIds.has(entry.callId) || (0, detect_tool_error_1.outputLooksFailed)(entry.content),
        ...originalLength !== null ? { truncated: true, original_length_chars: originalLength } : {},
        ...durationMs !== null ? { [tool_result_duration_1.ATIF_EXTRA_DURATION_MS]: durationMs } : {}
      };
      const step = context.stepsByCallId.get(entry.callId);
      if (step) {
        step.observation ??= { results: [] };
        step.observation.results.push({
          source_call_id: entry.callId,
          content,
          extra
        });
        if (context.open?.step === step) {
          context.open.sawToolOutput = true;
        }
        return;
      }
      context.steps.push({
        step_id: 0,
        ...entry.timestamp ? { timestamp: entry.timestamp } : {},
        source: "system",
        message: "",
        observation: {
          results: [
            { content, extra: { ...extra, orphan_tool_call_id: entry.callId } }
          ]
        }
      });
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-token-usage.js
var require_parse_token_usage = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-token-usage.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isZeroUsage = exports.parseTokenUsage = void 0;
    var json_guards_1 = require_json_guards();
    var parseTokenUsage = (value) => {
      const usage = (0, json_guards_1.asRecord)(value);
      const inputTokens = (0, json_guards_1.asNumber)(usage?.["input_tokens"]);
      const outputTokens = (0, json_guards_1.asNumber)(usage?.["output_tokens"]);
      if (!usage || inputTokens === null || outputTokens === null) {
        return null;
      }
      return {
        inputTokens,
        cachedInputTokens: (0, json_guards_1.asNumber)(usage["cached_input_tokens"]) ?? 0,
        cacheWriteInputTokens: (0, json_guards_1.asNumber)(usage["cache_write_input_tokens"]) ?? 0,
        outputTokens,
        reasoningOutputTokens: (0, json_guards_1.asNumber)(usage["reasoning_output_tokens"]) ?? 0,
        totalTokens: (0, json_guards_1.asNumber)(usage["total_tokens"]) ?? inputTokens + outputTokens
      };
    };
    exports.parseTokenUsage = parseTokenUsage;
    var isZeroUsage = (usage) => usage.inputTokens === 0 && usage.outputTokens === 0;
    exports.isZeroUsage = isZeroUsage;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-event-msg.js
var require_parse_event_msg = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-event-msg.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.recordSpawnFromOutput = exports.parseEventMsg = exports.createEventMsgState = void 0;
    var json_guards_1 = require_json_guards();
    var parse_token_usage_1 = require_parse_token_usage();
    var FAILED_STATUSES = /* @__PURE__ */ new Set(["failed", "declined", "error"]);
    var createEventMsgState = () => ({
      usageRecordPending: false,
      lastTokenCountTotal: null,
      failedCallIds: /* @__PURE__ */ new Set(),
      durationMsByCallId: /* @__PURE__ */ new Map(),
      spawnCallIds: /* @__PURE__ */ new Map(),
      spawnAgentCallIds: /* @__PURE__ */ new Set()
    });
    exports.createEventMsgState = createEventMsgState;
    var parseEventMsg = (payload, state) => {
      switch (payload["type"]) {
        case "token_count":
          return parseTokenCount(payload, state);
        case "task_started":
        case "task_complete":
        case "turn_aborted":
          return [{ kind: "turn-boundary" }];
        case "item_completed":
          recordCompletedItem((0, json_guards_1.asRecord)(payload["item"]), state);
          return [];
        case "collab_agent_spawn_end":
          recordSpawn(state, payload["new_thread_id"], payload["call_id"]);
          return [];
        case "exec_command_end":
          if (((0, json_guards_1.asNumber)(payload["exit_code"]) ?? 0) !== 0) {
            recordFailure(state, payload["call_id"]);
          }
          recordDuration(state, payload["call_id"], payload["duration"]);
          return [];
        case "patch_apply_end":
          if (payload["success"] === false) {
            recordFailure(state, payload["call_id"]);
          }
          return [];
        default:
          return [];
      }
    };
    exports.parseEventMsg = parseEventMsg;
    var recordSpawnFromOutput = (body, state) => {
      if (body.kind === "tool-call" && body.call.function_name === "spawn_agent") {
        state.spawnAgentCallIds.add(body.call.tool_call_id);
      }
      if (body.kind !== "tool-output" || !state.spawnAgentCallIds.has(body.callId)) {
        return;
      }
      const agentId = /"agent_id"\s*:\s*"([^"]+)"/.exec(body.content)?.[1];
      if (agentId && !state.spawnCallIds.has(agentId)) {
        state.spawnCallIds.set(agentId, body.callId);
      }
    };
    exports.recordSpawnFromOutput = recordSpawnFromOutput;
    var parseTokenCount = (payload, state) => {
      const info = (0, json_guards_1.asRecord)(payload["info"]);
      const total = (0, parse_token_usage_1.parseTokenUsage)(info?.["total_token_usage"]);
      if (!info || !total) {
        return [];
      }
      const totalKey = JSON.stringify(total);
      const isRepeat = totalKey === state.lastTokenCountTotal;
      const supersededByRecord = state.usageRecordPending;
      state.lastTokenCountTotal = totalKey;
      state.usageRecordPending = false;
      const last = (0, parse_token_usage_1.parseTokenUsage)(info["last_token_usage"]);
      if (isRepeat || supersededByRecord || !last || (0, parse_token_usage_1.isZeroUsage)(last)) {
        return [];
      }
      return [{ kind: "usage", usage: last, responseId: null }];
    };
    var recordCompletedItem = (item, state) => {
      const callId = (0, json_guards_1.asNonEmptyString)(item?.["id"]);
      if (!item || !callId) {
        return;
      }
      const status = (0, json_guards_1.asNonEmptyString)(item["status"]);
      const exitCode = (0, json_guards_1.asNumber)(item["exit_code"]);
      if (status !== null && FAILED_STATUSES.has(status) || exitCode !== null && exitCode !== 0 || item["success"] === false) {
        state.failedCallIds.add(callId);
      }
      if (item["type"] === "CollabAgentToolCall" && item["tool"] === "spawn_agent") {
        for (const threadId of (0, json_guards_1.asArray)(item["receiver_thread_ids"]) ?? []) {
          recordSpawn(state, threadId, callId);
        }
      }
    };
    var recordSpawn = (state, threadId, callId) => {
      const thread = (0, json_guards_1.asNonEmptyString)(threadId);
      const call = (0, json_guards_1.asNonEmptyString)(callId);
      if (thread && call) {
        state.spawnCallIds.set(thread, call);
      }
    };
    var recordFailure = (state, callId) => {
      const call = (0, json_guards_1.asNonEmptyString)(callId);
      if (call) {
        state.failedCallIds.add(call);
      }
    };
    var recordDuration = (state, callId, duration) => {
      const call = (0, json_guards_1.asNonEmptyString)(callId);
      const record2 = (0, json_guards_1.asRecord)(duration);
      const secs = (0, json_guards_1.asNumber)(record2?.["secs"]);
      if (!call || secs === null || secs < 0) {
        return;
      }
      const nanos = (0, json_guards_1.asNumber)(record2?.["nanos"]) ?? 0;
      state.durationMsByCallId.set(call, Math.round(secs * 1e3 + nanos / 1e6));
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/classify-user-message.js
var require_classify_user_message = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/classify-user-message.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.classifyUserMessage = void 0;
    var json_guards_1 = require_json_guards();
    var KEPT_KINDS = /* @__PURE__ */ new Set([
      "multi_agent.subagent_notification",
      "multi_agent.inter_agent_message",
      "multi_agent.inter_agent_completion_message",
      "shell.user_command"
    ]);
    var KEPT_TAGS = [
      "subagent_notification",
      "user_shell_command",
      "turn_aborted"
    ];
    var CONTEXT_PREFIXES = [
      "<environment_context>",
      "<user_instructions>",
      "# AGENTS.md instructions",
      "<skill>",
      "<codex_internal_context",
      "<goal_context>",
      "<agent_message_board_notification>",
      "<permissions instructions>"
    ];
    var classifyUserMessage = (text, contentItemKinds) => {
      const kinds = ((0, json_guards_1.asArray)(contentItemKinds) ?? []).flatMap((kind) => {
        const value = (0, json_guards_1.asString)(kind);
        return value ? [value] : [];
      });
      if (kinds.length > 0) {
        if (kinds.some((kind) => kind.startsWith("user."))) {
          return { kind: "prompt" };
        }
        const kept = kinds.find((kind) => KEPT_KINDS.has(kind));
        return kept ? { kind: "injected", originKind: kept } : { kind: "context" };
      }
      const trimmed = text.trimStart();
      const tag = KEPT_TAGS.find((name) => trimmed.startsWith(`<${name}>`));
      if (tag) {
        return { kind: "injected", originKind: tag };
      }
      return CONTEXT_PREFIXES.some((prefix) => trimmed.startsWith(prefix)) ? { kind: "context" } : { kind: "prompt" };
    };
    exports.classifyUserMessage = classifyUserMessage;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/content-to-text.js
var require_content_to_text = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/content-to-text.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentToText = exports.IMAGE_PLACEHOLDER = void 0;
    var json_guards_1 = require_json_guards();
    exports.IMAGE_PLACEHOLDER = "[image omitted]";
    var AUDIO_PLACEHOLDER = "[audio omitted]";
    var contentToText = (content) => {
      const text = (0, json_guards_1.asString)(content);
      if (text !== null) {
        return text;
      }
      return ((0, json_guards_1.asArray)(content) ?? []).flatMap((item) => {
        const record2 = (0, json_guards_1.asRecord)(item);
        switch (record2?.["type"]) {
          case "input_text":
          case "output_text":
          case "text":
          case "reasoning_text":
          case "summary_text":
            return [(0, json_guards_1.asString)(record2["text"]) ?? ""];
          case "input_image":
          case "image":
            return [exports.IMAGE_PLACEHOLDER];
          case "input_audio":
            return [AUDIO_PLACEHOLDER];
          default:
            return [];
        }
      }).join("\n");
    };
    exports.contentToText = contentToText;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-response-item.js
var require_parse_response_item = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-response-item.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseResponseItem = void 0;
    var json_guards_1 = require_json_guards();
    var classify_user_message_1 = require_classify_user_message();
    var content_to_text_1 = require_content_to_text();
    var parseResponseItem = (item, syntheticId) => {
      switch (item["type"]) {
        case "message":
          return parseMessage(item);
        case "reasoning":
          return [
            {
              kind: "reasoning",
              summary: (0, content_to_text_1.contentToText)(item["summary"]),
              content: (0, content_to_text_1.contentToText)(item["content"]),
              encrypted: (0, json_guards_1.asNonEmptyString)(item["encrypted_content"]) !== null
            }
          ];
        case "function_call":
          return toolCall(item, (0, json_guards_1.asString)(item["call_id"]), {
            arguments: parseArguments(item["arguments"]),
            extra: withDefined({ namespace: (0, json_guards_1.asNonEmptyString)(item["namespace"]) })
          });
        case "custom_tool_call":
          return toolCall(item, (0, json_guards_1.asString)(item["call_id"]), {
            arguments: { input: (0, json_guards_1.asString)(item["input"]) ?? "" },
            extra: withDefined({ namespace: (0, json_guards_1.asNonEmptyString)(item["namespace"]) })
          });
        case "local_shell_call":
          return toolCall(item, (0, json_guards_1.asString)(item["call_id"]) ?? (0, json_guards_1.asString)(item["id"]), {
            name: "local_shell",
            arguments: (0, json_guards_1.asRecord)(item["action"]) ?? {}
          });
        case "tool_search_call":
          return toolCall(item, (0, json_guards_1.asString)(item["call_id"]) ?? syntheticId(), {
            name: "tool_search",
            arguments: (0, json_guards_1.asRecord)(item["arguments"]) ?? {}
          });
        case "web_search_call":
          return toolCall(item, (0, json_guards_1.asString)(item["id"]) ?? syntheticId(), {
            name: "web_search",
            arguments: (0, json_guards_1.asRecord)(item["action"]) ?? {},
            extra: withDefined({ status: (0, json_guards_1.asNonEmptyString)(item["status"]) })
          });
        case "image_generation_call":
          return parseImageGeneration(item, syntheticId);
        case "function_call_output":
        case "custom_tool_call_output":
          return toolOutput((0, json_guards_1.asString)(item["call_id"]), (0, content_to_text_1.contentToText)(item["output"]));
        case "tool_search_output":
          return toolOutput((0, json_guards_1.asString)(item["call_id"]), describeTools(item["tools"]));
        case "agent_message":
          return [
            {
              kind: "user",
              text: (0, content_to_text_1.contentToText)(item["content"]),
              originKind: "agent_message"
            }
          ];
        default:
          return [];
      }
    };
    exports.parseResponseItem = parseResponseItem;
    var parseMessage = (item) => {
      const text = (0, content_to_text_1.contentToText)(item["content"]);
      if (item["role"] === "assistant") {
        return [
          {
            kind: "assistant",
            messageId: (0, json_guards_1.asNonEmptyString)(item["id"]),
            text,
            phase: (0, json_guards_1.asNonEmptyString)(item["phase"])
          }
        ];
      }
      if (item["role"] !== "user") {
        return [];
      }
      const passthrough = (0, json_guards_1.asRecord)(item["internal_chat_message_metadata_passthrough"]);
      const classified = (0, classify_user_message_1.classifyUserMessage)(text, passthrough?.["content_item_kinds"]);
      switch (classified.kind) {
        case "prompt":
          return [{ kind: "user", text, originKind: null }];
        case "injected":
          return [{ kind: "user", text, originKind: classified.originKind }];
        case "context":
          return [];
      }
    };
    var parseImageGeneration = (item, syntheticId) => {
      const callId = (0, json_guards_1.asString)(item["id"]) ?? syntheticId();
      return [
        ...toolCall(item, callId, {
          name: "image_generation",
          arguments: withDefined({
            revised_prompt: (0, json_guards_1.asNonEmptyString)(item["revised_prompt"])
          })
        }),
        ...toolOutput(callId, content_to_text_1.IMAGE_PLACEHOLDER)
      ];
    };
    var toolCall = (item, callId, call) => {
      const name = call.name ?? (0, json_guards_1.asNonEmptyString)(item["name"]);
      if (!callId || !name) {
        return [];
      }
      const toolCallEntry = {
        tool_call_id: callId,
        function_name: name,
        arguments: call.arguments,
        ...call.extra && Object.keys(call.extra).length > 0 ? { extra: call.extra } : {}
      };
      return [{ kind: "tool-call", call: toolCallEntry }];
    };
    var toolOutput = (callId, content) => callId ? [{ kind: "tool-output", callId, content }] : [];
    var parseArguments = (value) => {
      const raw = (0, json_guards_1.asString)(value);
      if (raw === null) {
        return (0, json_guards_1.asRecord)(value) ?? {};
      }
      try {
        return (0, json_guards_1.asRecord)(JSON.parse(raw)) ?? { raw_arguments: raw };
      } catch {
        return { raw_arguments: raw };
      }
    };
    var describeTools = (tools) => ((0, json_guards_1.asArray)(tools) ?? []).map((tool) => {
      const record2 = (0, json_guards_1.asRecord)(tool);
      return (0, json_guards_1.asString)(record2?.["name"]) ?? (0, json_guards_1.asString)(record2?.["type"]) ?? "";
    }).filter((name) => name.length > 0).join("\n");
    var withDefined = (values) => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null));
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-session-meta.js
var require_parse_session_meta = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-session-meta.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSessionMeta = void 0;
    var json_guards_1 = require_json_guards();
    var parseSessionMeta = (payload) => {
      const source = payload["source"];
      const threadSpawn = (0, json_guards_1.asRecord)((0, json_guards_1.asRecord)((0, json_guards_1.asRecord)(source)?.["subagent"])?.["thread_spawn"]);
      const historyBase = (0, json_guards_1.asRecord)(payload["history_base"]);
      const baseRolloutId = (0, json_guards_1.asNonEmptyString)(historyBase?.["thread_id"]);
      const baseEnd = (0, json_guards_1.asNumber)(historyBase?.["end_ordinal_exclusive"]);
      return {
        threadId: (0, json_guards_1.asNonEmptyString)(payload["id"]),
        sessionId: (0, json_guards_1.asNonEmptyString)(payload["session_id"]),
        parentThreadId: (0, json_guards_1.asNonEmptyString)(payload["parent_thread_id"]) ?? (0, json_guards_1.asNonEmptyString)(threadSpawn?.["parent_thread_id"]),
        forkedFromId: (0, json_guards_1.asNonEmptyString)(payload["forked_from_id"]),
        cwd: (0, json_guards_1.asNonEmptyString)(payload["cwd"]),
        originator: (0, json_guards_1.asNonEmptyString)(payload["originator"]),
        cliVersion: (0, json_guards_1.asNonEmptyString)(payload["cli_version"]),
        source: describeSource(source),
        agentNickname: (0, json_guards_1.asNonEmptyString)(payload["agent_nickname"]) ?? (0, json_guards_1.asNonEmptyString)(threadSpawn?.["agent_nickname"]),
        agentRole: (0, json_guards_1.asNonEmptyString)(payload["agent_role"]) ?? (0, json_guards_1.asNonEmptyString)(threadSpawn?.["agent_role"]),
        agentPath: (0, json_guards_1.asNonEmptyString)(payload["agent_path"]) ?? (0, json_guards_1.asNonEmptyString)(threadSpawn?.["agent_path"]),
        spawnDepth: (0, json_guards_1.asNumber)(threadSpawn?.["depth"]),
        gitBranch: (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(payload["git"])?.["branch"]),
        historyBase: baseRolloutId && baseEnd !== null ? { rolloutId: baseRolloutId, endOrdinalExclusive: baseEnd } : null,
        subagentHistoryStartOrdinal: (0, json_guards_1.asNumber)(payload["subagent_history_start_ordinal"])
      };
    };
    exports.parseSessionMeta = parseSessionMeta;
    var describeSource = (source) => {
      const asText = (0, json_guards_1.asNonEmptyString)(source);
      if (asText) {
        return asText;
      }
      const [variant, value] = Object.entries((0, json_guards_1.asRecord)(source) ?? {})[0] ?? [];
      if (!variant) {
        return null;
      }
      const detail = (0, json_guards_1.asString)(value) ?? Object.keys((0, json_guards_1.asRecord)(value) ?? {})[0];
      return detail ? `${variant}_${detail}` : variant;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-rollout-line.js
var require_parse_rollout_line = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-rollout-line.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSessionMetaLine = exports.parseRolloutLine = void 0;
    var json_guards_1 = require_json_guards();
    var parse_session_meta_1 = require_parse_session_meta();
    var parseRolloutLine = (rawLine) => {
      let parsed;
      try {
        parsed = (0, json_guards_1.asRecord)(JSON.parse(rawLine));
      } catch {
        return null;
      }
      const type = (0, json_guards_1.asNonEmptyString)(parsed?.["type"]);
      const payload = (0, json_guards_1.asRecord)(parsed?.["payload"]);
      if (!parsed || !type || !payload) {
        return null;
      }
      const timestamp = (0, json_guards_1.asNonEmptyString)(parsed["timestamp"]);
      return {
        timestamp: timestamp && !Number.isNaN(Date.parse(timestamp)) ? timestamp : null,
        ordinal: (0, json_guards_1.asNumber)(parsed["ordinal"]),
        type,
        payload
      };
    };
    exports.parseRolloutLine = parseRolloutLine;
    var parseSessionMetaLine2 = (rawLine) => {
      const line = rawLine ? (0, exports.parseRolloutLine)(rawLine) : null;
      return line?.type === "session_meta" ? (0, parse_session_meta_1.parseSessionMeta)(line.payload) : null;
    };
    exports.parseSessionMetaLine = parseSessionMetaLine2;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/rollout-file-context.js
var require_rollout_file_context = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/rollout-file-context.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findRevertCutoffs = exports.toPosition = void 0;
    var parse_rollout_line_1 = require_parse_rollout_line();
    var toPosition = (line, context) => ({
      timestamp: line.timestamp,
      copied: line.ordinal !== null && context.copiedBefore !== null && line.ordinal < context.copiedBefore,
      reverted: line.ordinal !== null && context.revertedFrom !== null && line.ordinal >= context.revertedFrom
    });
    exports.toPosition = toPosition;
    var findRevertCutoffs = (files) => {
      const cutoffs = /* @__PURE__ */ new Map();
      const head = files[files.length - 1];
      if (!head) {
        return cutoffs;
      }
      const byRolloutId = /* @__PURE__ */ new Map();
      for (const file of files) {
        byRolloutId.set(file.rolloutId, file);
      }
      const live = /* @__PURE__ */ new Set([head.rolloutId]);
      let current = head;
      while (true) {
        const base = (0, parse_rollout_line_1.parseSessionMetaLine)(firstLineOf(current.text))?.historyBase;
        if (!base || live.has(base.rolloutId)) {
          break;
        }
        const parent = byRolloutId.get(base.rolloutId);
        if (!parent) {
          break;
        }
        live.add(base.rolloutId);
        cutoffs.set(base.rolloutId, base.endOrdinalExclusive);
        current = parent;
      }
      for (const file of files) {
        if (!live.has(file.rolloutId)) {
          cutoffs.set(file.rolloutId, 0);
        }
      }
      return cutoffs;
    };
    exports.findRevertCutoffs = findRevertCutoffs;
    var firstLineOf = (text) => {
      const newline = text.indexOf("\n");
      return newline >= 0 ? text.slice(0, newline) : text;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/thread-metadata.js
var require_thread_metadata = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/thread-metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.recordTimestamp = exports.recordSessionMeta = exports.createEmptyMetadata = void 0;
    var createEmptyMetadata = () => ({
      meta: null,
      cliVersion: null,
      cwd: null,
      gitBranches: [],
      collaborationModes: [],
      startedAt: null,
      endedAt: null,
      malformedLineCount: 0
    });
    exports.createEmptyMetadata = createEmptyMetadata;
    var recordSessionMeta = (metadata, meta) => {
      metadata.meta ??= meta;
      metadata.cliVersion = meta.cliVersion ?? metadata.cliVersion;
      metadata.cwd ??= meta.cwd;
      if (meta.gitBranch && !metadata.gitBranches.includes(meta.gitBranch)) {
        metadata.gitBranches.push(meta.gitBranch);
      }
    };
    exports.recordSessionMeta = recordSessionMeta;
    var recordTimestamp = (metadata, timestamp) => {
      if (!timestamp) {
        return;
      }
      if (!metadata.startedAt || timestamp < metadata.startedAt) {
        metadata.startedAt = timestamp;
      }
      if (!metadata.endedAt || timestamp > metadata.endedAt) {
        metadata.endedAt = timestamp;
      }
    };
    exports.recordTimestamp = recordTimestamp;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-thread.js
var require_parse_thread = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/parse-thread.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseThread = void 0;
    var json_guards_1 = require_json_guards();
    var parse_event_msg_1 = require_parse_event_msg();
    var parse_response_item_1 = require_parse_response_item();
    var parse_rollout_line_1 = require_parse_rollout_line();
    var parse_session_meta_1 = require_parse_session_meta();
    var parse_token_usage_1 = require_parse_token_usage();
    var rollout_file_context_1 = require_rollout_file_context();
    var thread_metadata_1 = require_thread_metadata();
    var parseThread = (files) => {
      const revertCutoffs = (0, rollout_file_context_1.findRevertCutoffs)(files);
      const parsed = {
        entries: [],
        metadata: (0, thread_metadata_1.createEmptyMetadata)(),
        events: (0, parse_event_msg_1.createEventMsgState)()
      };
      let syntheticIdCount = 0;
      const syntheticId = () => `codex-item-${++syntheticIdCount}`;
      for (const file of files) {
        const context = {
          revertedFrom: revertCutoffs.get(file.rolloutId) ?? null,
          copiedBefore: null,
          sawSessionMeta: false
        };
        for (const rawLine of file.text.split("\n")) {
          if (!rawLine.trim()) {
            continue;
          }
          const line = (0, parse_rollout_line_1.parseRolloutLine)(rawLine);
          if (!line) {
            parsed.metadata.malformedLineCount++;
            continue;
          }
          const position = (0, rollout_file_context_1.toPosition)(line, context);
          if (!position.copied) {
            (0, thread_metadata_1.recordTimestamp)(parsed.metadata, line.timestamp);
          }
          for (const body of toEntries(line, parsed, context, syntheticId)) {
            (0, parse_event_msg_1.recordSpawnFromOutput)(body, parsed.events);
            parsed.entries.push({ ...body, ...position });
          }
        }
      }
      return parsed;
    };
    exports.parseThread = parseThread;
    var toEntries = (line, parsed, context, syntheticId) => {
      const { payload } = line;
      switch (line.type) {
        case "session_meta":
          if (!context.sawSessionMeta) {
            context.sawSessionMeta = true;
            const meta = (0, parse_session_meta_1.parseSessionMeta)(payload);
            context.copiedBefore = meta.subagentHistoryStartOrdinal;
            (0, thread_metadata_1.recordSessionMeta)(parsed.metadata, meta);
          }
          return [];
        case "turn_context":
          return [parseTurnContext(payload, parsed.metadata)];
        case "response_item":
          return (0, parse_response_item_1.parseResponseItem)(payload, syntheticId);
        case "event_msg":
          return (0, parse_event_msg_1.parseEventMsg)(payload, parsed.events);
        case "token_usage_record": {
          parsed.events.usageRecordPending = true;
          const usage = (0, parse_token_usage_1.parseTokenUsage)(payload["usage"]);
          const responseId = (0, json_guards_1.asNonEmptyString)(payload["response_id"]);
          return usage ? [{ kind: "usage", usage, responseId }] : [];
        }
        case "compacted":
          return [
            { kind: "compaction", summary: (0, json_guards_1.asString)(payload["message"]) ?? "" }
          ];
        case "inter_agent_communication":
          return [
            {
              kind: "user",
              text: (0, json_guards_1.asString)(payload["content"]) ?? "",
              originKind: "inter_agent_communication"
            }
          ];
        default:
          return [];
      }
    };
    var parseTurnContext = (payload, metadata) => {
      const collaborationMode = (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(payload["collaboration_mode"])?.["mode"]);
      if (collaborationMode && !metadata.collaborationModes.includes(collaborationMode)) {
        metadata.collaborationModes.push(collaborationMode);
      }
      const cwd = (0, json_guards_1.asNonEmptyString)(payload["cwd"]);
      metadata.cwd ??= cwd;
      return {
        kind: "turn-context",
        model: (0, json_guards_1.asNonEmptyString)(payload["model"]),
        effort: (0, json_guards_1.asNonEmptyString)(payload["effort"])
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/convert-codex-thread.js
var require_convert_codex_thread = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/convert-codex-thread.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertCodexThread = void 0;
    var build_leaf_trajectory_1 = require_build_leaf_trajectory();
    var token_totals_1 = require_token_totals();
    var build_codex_steps_1 = require_build_codex_steps();
    var parse_thread_1 = require_parse_thread();
    var CODEX_AGENT_NAME = "codex";
    var convertCodexThread = ({ files, sessionId, trajectoryId, extra }) => {
      const { entries: entries2, metadata, events } = (0, parse_thread_1.parseThread)(files);
      const steps = (0, build_codex_steps_1.buildCodexSteps)(entries2, events);
      const totals = (0, token_totals_1.sumStepTokens)(steps);
      const trajectory = (0, build_leaf_trajectory_1.buildLeafTrajectory)({
        sessionId,
        trajectoryId,
        agentName: CODEX_AGENT_NAME,
        agentVersion: metadata.cliVersion ?? "unknown",
        steps,
        totals,
        extra: {
          ...extra,
          ...metadata.malformedLineCount > 0 ? { malformed_line_count: metadata.malformedLineCount } : {}
        }
      });
      return { trajectory, metadata, totals, spawnCallIds: events.spawnCallIds };
    };
    exports.convertCodexThread = convertCodexThread;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/session-stats.js
var require_session_stats = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/session-stats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildSessionStats = void 0;
    var buildSessionStats = ({ main, all, gitBranch, title, models, stepCount, subagentCount, totals, activity }) => {
      const starts = all.flatMap((m) => m.startedAt ? [m.startedAt] : []);
      const ends = all.flatMap((m) => m.endedAt ? [m.endedAt] : []);
      return {
        cwd: main.cwd,
        gitBranch,
        gitBranches: main.gitBranches.length > 0 ? main.gitBranches : gitBranch ? [gitBranch] : [],
        pullRequests: [],
        agentVersion: main.cliVersion,
        entrypoint: main.meta?.originator ?? null,
        permissionModes: main.collaborationModes,
        title,
        models,
        startedAt: starts.sort()[0] ?? null,
        endedAt: ends.sort().at(-1) ?? null,
        stepCount,
        subagentCount,
        totals,
        reportedCostUsd: null,
        activity
      };
    };
    exports.buildSessionStats = buildSessionStats;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/convert-codex-session.js
var require_convert_codex_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/convert-codex-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertCodexSession = void 0;
    var activity_stats_1 = require_activity_stats();
    var link_subagent_1 = require_link_subagent();
    var title_from_prompt_1 = require_title_from_prompt();
    var token_totals_1 = require_token_totals();
    var convert_codex_thread_1 = require_convert_codex_thread();
    var session_stats_1 = require_session_stats();
    var convertCodexSession2 = (input, converterVersion) => {
      const { sessionId } = input;
      const main = (0, convert_codex_thread_1.convertCodexThread)({
        files: input.root,
        sessionId,
        trajectoryId: null,
        extra: {}
      });
      const subagents = input.subagents.map((subagent) => convertSubagent(sessionId, subagent.threadId, subagent.files));
      const all = [main, ...subagents.map(({ converted }) => converted)];
      const subagentTrajectories = subagents.map(({ converted }) => converted.trajectory);
      const allTrajectories = [main.trajectory, ...subagentTrajectories];
      linkSubagents(all, subagents, allTrajectories, sessionId);
      const totals = all.map((c) => c.totals).reduce(token_totals_1.addTokenTotals);
      const { meta } = main.metadata;
      const title = input.threadName ?? (0, title_from_prompt_1.titleFromPrompt)(firstPrompt(main.trajectory));
      const gitBranch = main.metadata.gitBranches.at(-1) ?? input.readFallbackGitBranch(main.metadata.cwd);
      const root = {
        ...main.trajectory,
        notes: `Converted from Codex rollout files by meticulous-agent-traces ${converterVersion}. final_metrics totals include every embedded subagent trajectory; total_steps counts root steps only.`,
        final_metrics: {
          total_prompt_tokens: totals.promptTokens,
          total_completion_tokens: totals.completionTokens,
          total_cached_tokens: totals.cachedTokens,
          total_steps: main.trajectory.steps.length,
          extra: {
            includes_subagent_trajectories: true,
            total_cache_creation_tokens: totals.cacheCreationTokens,
            total_steps_including_subagents: allTrajectories.reduce((sum, trajectory) => sum + trajectory.steps.length, 0)
          }
        },
        extra: {
          ...main.trajectory.extra,
          cwd: main.metadata.cwd,
          gitBranch,
          title,
          originator: meta?.originator ?? null,
          source: meta?.source ?? null,
          ...meta?.forkedFromId ? { forked_from_id: meta.forkedFromId } : {}
        },
        ...subagentTrajectories.length > 0 ? { subagent_trajectories: subagentTrajectories } : {}
      };
      return {
        trajectory: root,
        stats: (0, session_stats_1.buildSessionStats)({
          main: main.metadata,
          all: all.map((c) => c.metadata),
          gitBranch,
          title,
          models: (0, token_totals_1.countModels)(allTrajectories).map(([model]) => model),
          stepCount: main.trajectory.steps.length,
          subagentCount: subagents.length,
          totals,
          activity: (0, activity_stats_1.computeActivityStats)(root, allTrajectories)
        })
      };
    };
    exports.convertCodexSession = convertCodexSession2;
    var convertSubagent = (sessionId, threadId, files) => {
      const trajectoryId = `agent-${threadId}`;
      const converted = (0, convert_codex_thread_1.convertCodexThread)({
        files,
        sessionId,
        trajectoryId,
        extra: {}
      });
      const meta = converted.metadata.meta;
      converted.trajectory.extra = {
        ...converted.trajectory.extra,
        agent_id: threadId,
        agent_nickname: meta?.agentNickname ?? null,
        agent_role: meta?.agentRole ?? null,
        agent_path: meta?.agentPath ?? null,
        parent_thread_id: meta?.parentThreadId ?? null,
        spawn_depth: meta?.spawnDepth ?? null,
        source: meta?.source ?? null
      };
      return { threadId, trajectoryId, converted };
    };
    var linkSubagents = (all, subagents, allTrajectories, sessionId) => {
      const spawnCallIds = new Map(all.flatMap((c) => [...c.spawnCallIds]));
      for (const { threadId, trajectoryId, converted } of subagents) {
        const callId = spawnCallIds.get(threadId);
        const meta = converted.metadata.meta;
        if (callId) {
          (0, link_subagent_1.linkSubagentToToolCall)(allTrajectories, callId, {
            trajectory_id: trajectoryId,
            session_id: sessionId,
            extra: {
              agent_nickname: meta?.agentNickname ?? null,
              agent_role: meta?.agentRole ?? null
            }
          });
        }
      }
    };
    var firstPrompt = (trajectory) => {
      const step = trajectory.steps.find((candidate) => candidate.source === "user" && !candidate.is_copied_context && candidate.extra?.["origin_kind"] === void 0 && candidate.extra?.["is_compact_summary"] !== true);
      return typeof step?.message === "string" ? step.message : null;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/rollout-file-name.js
var require_rollout_file_name = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/rollout-file-name.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseRolloutFileName = void 0;
    var UUID = "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}";
    var ROLLOUT_FILE_NAME_REGEX = new RegExp(`^rollout-(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2})-(${UUID})(?:_(${UUID}))?\\.jsonl$`);
    var parseRolloutFileName3 = (name) => {
      const match = ROLLOUT_FILE_NAME_REGEX.exec(name);
      const [, timestamp, threadId, rolloutId] = match ?? [];
      if (!timestamp || !threadId) {
        return null;
      }
      return { timestamp, threadId, rolloutId: rolloutId ?? threadId };
    };
    exports.parseRolloutFileName = parseRolloutFileName3;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/build-codex-payload.js
var require_build_codex_payload = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/build-codex-payload.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildCodexPayload = void 0;
    var path_1 = __require("path");
    var read_git_branch_1 = require_read_git_branch();
    var convert_codex_session_1 = require_convert_codex_session();
    var rollout_file_name_1 = require_rollout_file_name();
    var buildCodexPayload = ({ sessionId, root, subagents, threadName }, converterVersion) => {
      const { trajectory, stats } = (0, convert_codex_session_1.convertCodexSession)({
        sessionId,
        root: toTexts(root),
        subagents: subagents.map((thread) => ({
          threadId: thread.threadId,
          files: toTexts(thread)
        })),
        threadName,
        readFallbackGitBranch: read_git_branch_1.readGitBranch
      }, converterVersion);
      return {
        envelope: {
          envelopeVersion: 1,
          agent: "codex",
          sessionId,
          projectDirName: null,
          files: [root, ...subagents].flatMap((thread) => thread.files)
        },
        trajectory,
        stats
      };
    };
    exports.buildCodexPayload = buildCodexPayload;
    var toTexts = ({ threadId, files }) => files.map((file) => ({
      rolloutId: (0, rollout_file_name_1.parseRolloutFileName)((0, path_1.basename)(file.relativePath))?.rolloutId ?? threadId,
      text: file.content
    }));
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/codex-home-layout.js
var require_codex_home_layout = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/codex-home-layout.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CODEX_SESSION_INDEX_FILE = exports.CODEX_ROLLOUT_DIRS = void 0;
    exports.CODEX_ROLLOUT_DIRS = ["sessions", "archived_sessions"];
    exports.CODEX_SESSION_INDEX_FILE = "session_index.jsonl";
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/read-codex-thread-name.js
var require_read_codex_thread_name = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/read-codex-thread-name.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readCodexThreadName = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var json_guards_1 = require_json_guards();
    var codex_home_layout_1 = require_codex_home_layout();
    var readCodexThreadName = async (codexHome, threadId) => {
      let text;
      try {
        text = await (0, promises_1.readFile)((0, path_1.join)(codexHome, codex_home_layout_1.CODEX_SESSION_INDEX_FILE), "utf8");
      } catch {
        return null;
      }
      let name = null;
      for (const line of text.split("\n")) {
        if (!line.includes(threadId)) {
          continue;
        }
        try {
          const entry = (0, json_guards_1.asRecord)(JSON.parse(line));
          if (entry?.["id"] === threadId) {
            name = (0, json_guards_1.asNonEmptyString)(entry["thread_name"]) ?? name;
          }
        } catch {
        }
      }
      return name;
    };
    exports.readCodexThreadName = readCodexThreadName;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/codex/strip-codex-tool-outputs.js
var require_strip_codex_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/codex/strip-codex-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripCodexToolOutputs = void 0;
    var rewrite_raw_file_1 = require_rewrite_raw_file();
    var tool_output_filter_1 = require_tool_output_filter();
    var json_guards_1 = require_json_guards();
    var KEPT_EVENT_KEYS = /* @__PURE__ */ new Set([
      "type",
      "id",
      "call_id",
      "turn_id",
      "status",
      "exit_code",
      "duration",
      "success",
      "process_id",
      "new_thread_id",
      "sender_thread_id",
      "receiver_thread_id",
      "internal_chat_message_metadata_passthrough"
    ]);
    var KEPT_ITEM_KEYS = /* @__PURE__ */ new Set([
      "type",
      "id",
      "status",
      "exit_code",
      "duration_ms",
      "command",
      "cwd",
      "process_id",
      "source",
      "tool",
      "server",
      "arguments",
      "sender_thread_id",
      "receiver_thread_ids"
    ]);
    var stripCodexToolOutputs = (files, filter) => {
      const namesByCallId = collectCallNames(files);
      const isExcluded = (callId) => !!callId && filter.isExcluded({ callId, names: [namesByCallId.get(callId)] });
      return files.map((file) => (0, rewrite_raw_file_1.rewriteJsonLinesFile)(file, (line) => {
        let changed = false;
        (0, rewrite_raw_file_1.forEachObject)(line, (object) => {
          changed = stripObject(object, isExcluded) || changed;
        });
        return changed;
      }));
    };
    exports.stripCodexToolOutputs = stripCodexToolOutputs;
    var stripObject = (object, isExcluded) => {
      const type = (0, json_guards_1.asString)(object["type"]) ?? "";
      const item = (0, json_guards_1.asRecord)(object["item"]);
      if (type.startsWith("item_") && item) {
        if (!isExcluded((0, json_guards_1.asNonEmptyString)(item["id"]))) {
          return false;
        }
        (0, rewrite_raw_file_1.keepOnly)(item, KEPT_ITEM_KEYS, { output: tool_output_filter_1.EXCLUDED_TOOL_OUTPUT });
        return true;
      }
      if (type.endsWith("_call") || type.endsWith("_begin") || !isExcluded((0, json_guards_1.asNonEmptyString)(object["call_id"]))) {
        return false;
      }
      (0, rewrite_raw_file_1.keepOnly)(object, KEPT_EVENT_KEYS, { output: tool_output_filter_1.EXCLUDED_TOOL_OUTPUT });
      return true;
    };
    var collectCallNames = (files) => {
      const names2 = /* @__PURE__ */ new Map();
      for (const file of files) {
        for (const line of file.content.split("\n")) {
          if (!line.includes('"call_id"')) {
            continue;
          }
          try {
            (0, rewrite_raw_file_1.forEachObject)(JSON.parse(line), (object) => {
              const callId = (0, json_guards_1.asNonEmptyString)(object["call_id"]);
              const name = (0, json_guards_1.asNonEmptyString)(object["name"]);
              if (callId && name) {
                names2.set(callId, name);
              }
            });
          } catch {
          }
        }
      }
      return names2;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/decode-project-dir-name.js
var require_decode_project_dir_name = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/decode-project-dir-name.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeProjectDirName = void 0;
    var fs_1 = __require("fs");
    var path_1 = __require("path");
    var MAX_DIRECTORIES_READ = 200;
    var decodeProjectDirName = (name) => {
      if (!name) {
        return null;
      }
      const budget = { remaining: MAX_DIRECTORIES_READ };
      const drive = /^([A-Za-z])-(.+)$/.exec(name);
      if (process.platform === "win32" && drive) {
        return findPath(`${drive[1]}:\\`, drive[2] ?? "", budget);
      }
      return findPath("/", name, budget);
    };
    exports.decodeProjectDirName = decodeProjectDirName;
    var findPath = (dir, remaining, budget) => {
      if (remaining.length === 0) {
        return dir;
      }
      if (budget.remaining-- <= 0) {
        return null;
      }
      for (const entry of listDirectories(dir)) {
        const encoded = encodeSegment(entry);
        if (encoded.length === 0) {
          continue;
        }
        const rest = remaining === encoded ? "" : remaining.startsWith(`${encoded}-`) ? remaining.slice(encoded.length + 1) : null;
        const found2 = rest === null ? null : findPath((0, path_1.join)(dir, entry), rest, budget);
        if (found2) {
          return found2;
        }
      }
      return null;
    };
    var encodeSegment = (segment) => segment.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    var listDirectories = (dir) => {
      try {
        return (0, fs_1.readdirSync)(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => entry.name).sort();
      } catch {
        return [];
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/collect-cursor-metadata.js
var require_collect_cursor_metadata = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/collect-cursor-metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.collectCursorMetadata = void 0;
    var json_guards_1 = require_json_guards();
    var decode_project_dir_name_1 = require_decode_project_dir_name();
    var collectCursorMetadata = ({ events, transcript, transcriptMtimeMs, projectDirName }) => {
      const metadata = {
        cwd: null,
        agentVersion: null,
        composerModes: [],
        startedAt: null,
        endedAt: null,
        isBackgroundAgent: false
      };
      for (const { event } of events) {
        const payload = event?.payload;
        if (!payload) {
          continue;
        }
        const workspaceRoot = (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asArray)(payload["workspace_roots"])?.[0]);
        metadata.cwd ??= event.projectDir ?? workspaceRoot;
        metadata.agentVersion = (0, json_guards_1.asNonEmptyString)(payload["cursor_version"]) ?? metadata.agentVersion;
        const mode = (0, json_guards_1.asNonEmptyString)(payload["composer_mode"]);
        if (mode && !metadata.composerModes.includes(mode)) {
          metadata.composerModes.push(mode);
        }
        metadata.isBackgroundAgent ||= payload["is_background_agent"] === true;
      }
      metadata.cwd ??= (0, decode_project_dir_name_1.decodeProjectDirName)(projectDirName);
      const activityTimes = [
        ...events.map(({ timestamp }) => timestamp),
        ...(transcript?.entries ?? []).flatMap((entry) => entry.kind === "user" && entry.timestamp ? [entry.timestamp] : [])
      ];
      const endTimes = [
        ...activityTimes,
        ...transcriptMtimeMs !== null ? [new Date(transcriptMtimeMs).toISOString()] : []
      ];
      metadata.startedAt = activityTimes.sort()[0] ?? null;
      metadata.endedAt = endTimes.sort().at(-1) ?? null;
      return metadata;
    };
    exports.collectCursorMetadata = collectCursorMetadata;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/match-weights.js
var require_match_weights = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/match-weights.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.canonicalToolName = exports.toolMatchWeight = exports.promptsMatch = exports.normalizeText = void 0;
    var MIN_CONTAINED_PROMPT_CHARS = 20;
    var TOOL_NAME_ALIASES = {
      strreplace: "write",
      edit: "write",
      multiedit: "write",
      applypatch: "write",
      editnotebook: "write",
      bash: "shell",
      runterminalcommand: "shell",
      runterminalcmd: "shell",
      readfile: "read",
      rg: "grep",
      ripgrep: "grep",
      glob: "list",
      ls: "list",
      deletefile: "delete",
      webfetch: "fetch",
      agent: "task",
      subagent: "task"
    };
    var TOOL_WEIGHT_SAME_NAME = 4;
    var TOOL_WEIGHT_ALIAS = 3;
    var TOOL_WEIGHT_POSITION_ONLY = 1;
    var normalizeText = (text) => text.replace(/\s+/g, " ").trim();
    exports.normalizeText = normalizeText;
    var promptsMatch = (transcriptText, prompt) => {
      const a = (0, exports.normalizeText)(transcriptText);
      const b = (0, exports.normalizeText)(prompt);
      if (a.length === 0 || b.length === 0) {
        return false;
      }
      const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
      return shorter === longer || shorter.length >= MIN_CONTAINED_PROMPT_CHARS && longer.includes(shorter);
    };
    exports.promptsMatch = promptsMatch;
    var toolMatchWeight = (transcriptName, hookName) => {
      if (transcriptName.toLowerCase() === hookName.toLowerCase()) {
        return TOOL_WEIGHT_SAME_NAME;
      }
      return (0, exports.canonicalToolName)(transcriptName) === (0, exports.canonicalToolName)(hookName) ? TOOL_WEIGHT_ALIAS : TOOL_WEIGHT_POSITION_ONLY;
    };
    exports.toolMatchWeight = toolMatchWeight;
    var canonicalToolName = (name) => {
      const lower = name.toLowerCase().replace(/^mcp:/, "").replace(/[^a-z0-9]/g, "");
      return TOOL_NAME_ALIASES[lower] ?? lower;
    };
    exports.canonicalToolName = canonicalToolName;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/align-sequences.js
var require_align_sequences = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/align-sequences.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.alignSequences = void 0;
    var MAX_TABLE_CELLS = 4e6;
    var GREEDY_LOOKAHEAD = 200;
    var alignSequences = (a, b, weight) => {
      if (a.length === 0 || b.length === 0) {
        return [];
      }
      if ((a.length + 1) * (b.length + 1) > MAX_TABLE_CELLS) {
        return alignGreedily(a, b, weight);
      }
      const width = b.length + 1;
      const scores = new Int32Array((a.length + 1) * width);
      const at = (i2, j2) => scores[i2 * width + j2] ?? 0;
      for (let i2 = 1; i2 <= a.length; i2++) {
        for (let j2 = 1; j2 <= b.length; j2++) {
          const pairWeight = weight(a[i2 - 1], b[j2 - 1]);
          const skip = Math.max(at(i2 - 1, j2), at(i2, j2 - 1));
          scores[i2 * width + j2] = pairWeight > 0 ? Math.max(skip, at(i2 - 1, j2 - 1) + pairWeight) : skip;
        }
      }
      const pairs = [];
      let i = a.length;
      let j = b.length;
      while (i > 0 && j > 0) {
        const pairWeight = weight(a[i - 1], b[j - 1]);
        if (pairWeight > 0 && at(i, j) === at(i - 1, j - 1) + pairWeight) {
          pairs.push([i - 1, j - 1]);
          i--;
          j--;
        } else if (at(i, j) === at(i - 1, j)) {
          i--;
        } else {
          j--;
        }
      }
      return pairs.reverse();
    };
    exports.alignSequences = alignSequences;
    var alignGreedily = (a, b, weight) => {
      const pairs = [];
      let next = 0;
      a.forEach((item, i) => {
        const end = Math.min(b.length, next + GREEDY_LOOKAHEAD);
        for (let j = next; j < end; j++) {
          if (weight(item, b[j]) > 0) {
            pairs.push([i, j]);
            next = j + 1;
            return;
          }
        }
      });
      return pairs;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/align-anchors.js
var require_align_anchors = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/align-anchors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.alignAnchors = exports.toolUseKey = void 0;
    var align_sequences_1 = require_align_sequences();
    var match_weights_1 = require_match_weights();
    var toolUseKey = (entryIndex, useIndex) => `${entryIndex}:${useIndex}`;
    exports.toolUseKey = toolUseKey;
    var alignAnchors = (entries2, events) => {
      const matches = {
        entryByEvent: /* @__PURE__ */ new Map(),
        promptEventByEntry: /* @__PURE__ */ new Map(),
        toolEventByUse: /* @__PURE__ */ new Map()
      };
      const promptPairs = alignPrompts(entries2, events);
      for (const [entryIndex, eventIndex] of promptPairs) {
        matches.promptEventByEntry.set(entryIndex, eventIndex);
        matches.entryByEvent.set(eventIndex, entryIndex);
      }
      const entryBounds = [
        0,
        ...promptPairs.map(([entry]) => entry),
        entries2.length
      ];
      const eventBounds = [
        0,
        ...promptPairs.map(([, event]) => event),
        events.length
      ];
      for (let segment = 0; segment < entryBounds.length - 1; segment++) {
        alignSegmentTools(entries2, events, [entryBounds[segment] ?? 0, entryBounds[segment + 1] ?? 0], [eventBounds[segment] ?? 0, eventBounds[segment + 1] ?? 0], matches);
      }
      return matches;
    };
    exports.alignAnchors = alignAnchors;
    var alignPrompts = (entries2, events) => {
      const userEntries = indexesWhere(entries2, (entry) => entry.kind === "user");
      const promptEvents = indexesWhere(events, (event) => event.kind === "prompt");
      const pairs = (0, align_sequences_1.alignSequences)(userEntries, promptEvents, (entryIndex, eventIndex) => {
        const entry = entries2[entryIndex];
        const event = events[eventIndex];
        return entry?.kind === "user" && event?.kind === "prompt" && (0, match_weights_1.promptsMatch)(entry.text, event.prompt) ? 1 : 0;
      });
      return pairs.map(([a, b]) => [userEntries[a] ?? 0, promptEvents[b] ?? 0]);
    };
    var alignSegmentTools = (entries2, events, [entryStart, entryEnd], [eventStart, eventEnd], matches) => {
      const uses = [];
      for (let entryIndex = entryStart; entryIndex < entryEnd; entryIndex++) {
        const entry = entries2[entryIndex];
        if (entry?.kind === "assistant") {
          entry.toolUses.forEach((use, useIndex) => uses.push({ entryIndex, useIndex, name: use.name }));
        }
      }
      const toolEvents = [];
      for (let eventIndex = eventStart; eventIndex < eventEnd; eventIndex++) {
        const event = events[eventIndex];
        if (event?.kind === "tool") {
          toolEvents.push({ eventIndex, name: event.toolName });
        }
      }
      for (const [a, b] of (0, align_sequences_1.alignSequences)(uses, toolEvents, (use, event) => (0, match_weights_1.toolMatchWeight)(use.name, event.name))) {
        const use = uses[a];
        const event = toolEvents[b];
        if (use && event) {
          matches.toolEventByUse.set((0, exports.toolUseKey)(use.entryIndex, use.useIndex), event.eventIndex);
          matches.entryByEvent.set(event.eventIndex, use.entryIndex);
        }
      }
    };
    var indexesWhere = (items, predicate) => items.flatMap((item, index) => predicate(item) ? [index] : []);
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/claim-text-events.js
var require_claim_text_events = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/claim-text-events.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.claimTextEvents = void 0;
    var match_weights_1 = require_match_weights();
    var claimTextEvents = (entries2, events, matches) => {
      const claims = {
        thoughtsByEntry: /* @__PURE__ */ new Map(),
        responsesByEntry: /* @__PURE__ */ new Map()
      };
      const upperBounds = nextPairedEntries(events.length, matches, entries2.length - 1);
      let anchor = -1;
      events.forEach((event, eventIndex) => {
        const paired = matches.entryByEvent.get(eventIndex);
        if (paired !== void 0) {
          anchor = Math.max(anchor, paired);
          return;
        }
        if (event.kind !== "thought" && event.kind !== "response") {
          return;
        }
        const upper = upperBounds[eventIndex] ?? entries2.length - 1;
        const window = {
          anchor: anchor >= 0 ? anchor : lastUserEntryAtOrBefore(entries2, upper),
          upper
        };
        const target = event.kind === "thought" ? findThoughtEntry(entries2, event.text, window, claims.thoughtsByEntry) : findResponseEntry(entries2, event.text, window);
        if (target !== null) {
          const byEntry = event.kind === "thought" ? claims.thoughtsByEntry : claims.responsesByEntry;
          byEntry.set(target, [...byEntry.get(target) ?? [], eventIndex]);
          matches.entryByEvent.set(eventIndex, target);
          anchor = Math.max(anchor, target);
        }
      });
      return claims;
    };
    exports.claimTextEvents = claimTextEvents;
    var findThoughtEntry = (entries2, text, { anchor, upper }, thoughtsByEntry) => {
      const needle = (0, match_weights_1.normalizeText)(text);
      if (needle.length === 0) {
        return null;
      }
      const candidates = assistantEntriesIn(entries2, Math.max(anchor, 0), upper);
      const containing = candidates.find(([, entry]) => (0, match_weights_1.normalizeText)(`${entry.text} ${entry.reasoning ?? ""}`).includes(needle));
      if (containing) {
        return containing[0];
      }
      const turnEnd = nextUserEntry(entries2, Math.max(anchor, 0));
      const redacted = candidates.find(([index, entry]) => index > anchor && index < turnEnd && entry.reasoningRedacted && !thoughtsByEntry.has(index));
      return redacted?.[0] ?? null;
    };
    var findResponseEntry = (entries2, text, { anchor, upper }) => {
      const from = Math.max(anchor, 0);
      const turnEnd = nextUserEntry(entries2, Math.max(anchor, 0));
      const candidates = assistantEntriesIn(entries2, from, Math.min(upper, turnEnd - 1));
      const needle = (0, match_weights_1.normalizeText)(text);
      const containing = [...candidates].reverse().find(([, entry]) => needle.length > 0 && (0, match_weights_1.normalizeText)(entry.text).includes(needle));
      if (containing) {
        return containing[0];
      }
      const turnFinished = turnEnd < entries2.length || entries2.slice(from, turnEnd).some((entry) => entry.kind === "turn_ended");
      return turnFinished ? candidates.at(-1)?.[0] ?? null : null;
    };
    var assistantEntriesIn = (entries2, from, to) => {
      const found2 = [];
      for (let index = from; index <= to && index < entries2.length; index++) {
        const entry = entries2[index];
        if (entry?.kind === "assistant") {
          found2.push([index, entry]);
        }
      }
      return found2;
    };
    var lastUserEntryAtOrBefore = (entries2, index) => {
      for (let candidate = Math.min(index, entries2.length - 1); candidate >= 0; candidate--) {
        if (entries2[candidate]?.kind === "user") {
          return candidate;
        }
      }
      return -1;
    };
    var nextUserEntry = (entries2, after) => {
      const index = entries2.findIndex((entry, i) => i > after && entry.kind === "user");
      return index === -1 ? entries2.length : index;
    };
    var nextPairedEntries = (eventCount, matches, fallback) => {
      const bounds = new Array(eventCount).fill(fallback);
      let next = fallback;
      for (let index = eventCount - 1; index >= 0; index--) {
        bounds[index] = next;
        const paired = matches.entryByEvent.get(index);
        if (paired !== void 0) {
          next = paired;
        }
      }
      return bounds;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/build-cursor-timeline.js
var require_build_cursor_timeline = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/merge/build-cursor-timeline.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildCursorTimeline = void 0;
    var assert_never_1 = require_assert_never();
    var align_anchors_1 = require_align_anchors();
    var claim_text_events_1 = require_claim_text_events();
    var buildCursorTimeline = (entries2, events) => {
      const matches = (0, align_anchors_1.alignAnchors)(entries2, events);
      const claims = (0, claim_text_events_1.claimTextEvents)(entries2, events, matches);
      const unpairedAfterEntry = placeUnpairedEvents(entries2, events, matches);
      const timeline = [
        ...unpairedAfterEntry.get(-1) ?? []
      ];
      entries2.forEach((entry, index) => {
        timeline.push(toItem(entry, index, events, matches, claims));
        timeline.push(...unpairedAfterEntry.get(index) ?? []);
      });
      return timeline;
    };
    exports.buildCursorTimeline = buildCursorTimeline;
    var placeUnpairedEvents = (entries2, events, matches) => {
      const placed = /* @__PURE__ */ new Map();
      const firstPaired = events.findIndex((_, eventIndex) => matches.entryByEvent.has(eventIndex));
      let anchor = (matches.entryByEvent.get(firstPaired) ?? entries2.length) - 1;
      events.forEach((event, eventIndex) => {
        const paired = matches.entryByEvent.get(eventIndex);
        if (paired !== void 0) {
          anchor = Math.max(anchor, paired);
          return;
        }
        const after = event.kind === "stop" && anchor >= 0 ? endOfTurn(entries2, anchor) : anchor;
        placed.set(after, [...placed.get(after) ?? [], { kind: "event", event }]);
      });
      return placed;
    };
    var endOfTurn = (entries2, from) => {
      for (let index = from + 1; index < entries2.length; index++) {
        const kind = entries2[index]?.kind;
        if (kind === "turn_ended") {
          return index;
        }
        if (kind === "user") {
          return index - 1;
        }
      }
      return entries2.length - 1;
    };
    var toItem = (entry, index, events, matches, claims) => {
      switch (entry.kind) {
        case "user": {
          const [event] = pickEvents(events, [matches.promptEventByEntry.get(index)], "prompt");
          return { kind: "prompt", entry, event: event ?? null };
        }
        case "assistant":
          return {
            kind: "message",
            entry,
            toolEvents: entry.toolUses.map((_, useIndex) => {
              const eventIndex = matches.toolEventByUse.get((0, align_anchors_1.toolUseKey)(index, useIndex));
              return pickEvents(events, [eventIndex], "tool")[0] ?? null;
            }),
            thoughts: pickEvents(events, claims.thoughtsByEntry.get(index) ?? [], "thought"),
            responses: pickEvents(events, claims.responsesByEntry.get(index) ?? [], "response")
          };
        case "turn_ended":
          return { kind: "turn_ended", entry };
        default:
          return (0, assert_never_1.assertNever)(entry);
      }
    };
    var pickEvents = (events, indexes, kind) => indexes.flatMap((eventIndex) => {
      const event = eventIndex === void 0 ? void 0 : events[eventIndex];
      return event?.kind === kind ? [event] : [];
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/cursor-step-context.js
var require_cursor_step_context = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/cursor-step-context.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.newEventAgentStep = exports.nextToolCallId = exports.noteModel = exports.pushAgentStep = exports.finishTurn = exports.createStepContext = void 0;
    var createStepContext = () => ({
      steps: [],
      openStep: null,
      turn: emptyTurn(),
      toolCallCount: 0
    });
    exports.createStepContext = createStepContext;
    var finishTurn = (context) => {
      const { model, agentSteps } = context.turn;
      for (const step of agentSteps) {
        if (model && !step.model_name) {
          step.model_name = model;
        }
      }
      context.turn = emptyTurn();
    };
    exports.finishTurn = finishTurn;
    var pushAgentStep = (context, step) => {
      context.steps.push(step);
      context.turn.agentSteps.push(step);
    };
    exports.pushAgentStep = pushAgentStep;
    var noteModel = (context, model) => {
      if (model) {
        context.turn.model = model;
      }
    };
    exports.noteModel = noteModel;
    var nextToolCallId = (context) => `call_${++context.toolCallCount}`;
    exports.nextToolCallId = nextToolCallId;
    var newEventAgentStep = (event) => ({
      step_id: 0,
      timestamp: event.timestamp,
      source: "agent",
      ...event.model ? { model_name: event.model } : {},
      message: "",
      extra: event.generationId ? { generation_id: event.generationId } : {}
    });
    exports.newEventAgentStep = newEventAgentStep;
    var emptyTurn = () => ({
      agentSteps: [],
      model: null,
      responseUsageSteps: []
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/add-turn-boundary-steps.js
var require_add_turn_boundary_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/add-turn-boundary-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addTurnEnded = exports.addPromptStep = void 0;
    var cursor_step_context_1 = require_cursor_step_context();
    var addPromptStep = (context, entry, event) => {
      context.openStep = null;
      (0, cursor_step_context_1.finishTurn)(context);
      (0, cursor_step_context_1.noteModel)(context, event?.model ?? null);
      const timestamp = event?.timestamp ?? entry?.timestamp ?? null;
      context.steps.push({
        step_id: 0,
        ...timestamp ? { timestamp } : {},
        source: "user",
        message: event?.prompt ?? entry?.text ?? "",
        extra: {
          ...event?.generationId ? { generation_id: event.generationId } : {},
          ...event?.composerMode ? { composer_mode: event.composerMode } : {},
          ...event && event.attachments.length > 0 ? { attachments: event.attachments } : {}
        }
      });
    };
    exports.addPromptStep = addPromptStep;
    var addTurnEnded = (context, entry) => {
      context.openStep = null;
      const outcome = {
        ...entry.status ? { turn_status: entry.status } : {},
        ...entry.error ? { turn_error: entry.error } : {}
      };
      const last = context.turn.agentSteps.at(-1);
      if (last) {
        last.extra = { ...last.extra, ...outcome };
      } else if (entry.error) {
        context.steps.push({
          step_id: 0,
          source: "system",
          message: `Turn ended with ${entry.status ?? "an error"}: ${entry.error}`,
          extra: outcome
        });
      }
    };
    exports.addTurnEnded = addTurnEnded;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/apply-cursor-usage.js
var require_apply_cursor_usage = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/apply-cursor-usage.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyStop = exports.applyResponseUsage = void 0;
    var cursor_step_context_1 = require_cursor_step_context();
    var applyResponseUsage = (context, step, usage) => {
      if (usage) {
        step.metrics = usageToMetrics(usage);
        context.turn.responseUsageSteps.push(step);
      }
    };
    exports.applyResponseUsage = applyResponseUsage;
    var applyStop = (context, event) => {
      context.openStep = null;
      (0, cursor_step_context_1.noteModel)(context, event.model);
      let target = context.turn.agentSteps.at(-1) ?? null;
      if (event.usage) {
        for (const step of context.turn.responseUsageSteps) {
          delete step.metrics;
        }
        context.turn.responseUsageSteps = [];
        if (!target) {
          target = {
            step_id: 0,
            timestamp: event.timestamp,
            source: "agent",
            ...event.model ? { model_name: event.model } : {},
            message: ""
          };
          (0, cursor_step_context_1.pushAgentStep)(context, target);
        }
        target.metrics = addMetrics(target.metrics, usageToMetrics(event.usage));
      }
      if (target) {
        target.extra = {
          ...target.extra,
          ...event.status ? { stop_status: event.status } : {},
          ...event.loopCount ? { loop_count: event.loopCount } : {}
        };
      }
    };
    exports.applyStop = applyStop;
    var usageToMetrics = (usage) => ({
      prompt_tokens: usage.inputTokens,
      completion_tokens: usage.outputTokens,
      cached_tokens: usage.cacheReadTokens,
      extra: {
        cache_creation_input_tokens: usage.cacheWriteTokens,
        usage_scope: "generation"
      }
    });
    var addMetrics = (existing, added) => {
      if (!existing) {
        return added;
      }
      const cacheCreation = (metrics) => {
        const value = metrics.extra?.["cache_creation_input_tokens"];
        return typeof value === "number" ? value : 0;
      };
      return {
        prompt_tokens: (existing.prompt_tokens ?? 0) + (added.prompt_tokens ?? 0),
        completion_tokens: (existing.completion_tokens ?? 0) + (added.completion_tokens ?? 0),
        cached_tokens: (existing.cached_tokens ?? 0) + (added.cached_tokens ?? 0),
        extra: {
          ...added.extra,
          cache_creation_input_tokens: cacheCreation(existing) + cacheCreation(added)
        }
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/tool-call-parts.js
var require_tool_call_parts = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/tool-call-parts.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toToolResult = exports.toToolCall = void 0;
    var tool_result_duration_1 = require_tool_result_duration();
    var truncate_observation_content_1 = require_truncate_observation_content();
    var toToolCall = (id, functionName, args, hookToolName) => ({
      tool_call_id: id,
      function_name: functionName,
      arguments: args,
      ...hookToolName && hookToolName !== functionName ? { extra: { hook_tool_name: hookToolName } } : {}
    });
    exports.toToolCall = toToolCall;
    var toToolResult = (id, event) => {
      const { content, originalLength } = (0, truncate_observation_content_1.truncateObservationContent)(event.output);
      return {
        source_call_id: id,
        content,
        extra: {
          is_error: event.isError,
          ...event.durationMs !== null ? { [tool_result_duration_1.ATIF_EXTRA_DURATION_MS]: event.durationMs } : {},
          ...event.failureType ? { failure_type: event.failureType } : {},
          ...event.isInterrupt ? { is_interrupt: true } : {},
          ...originalLength !== null ? { truncated: true, original_length_chars: originalLength } : {}
        }
      };
    };
    exports.toToolResult = toToolResult;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/add-event-step.js
var require_add_event_step = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/add-event-step.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addEventStep = void 0;
    var assert_never_1 = require_assert_never();
    var json_guards_1 = require_json_guards();
    var add_turn_boundary_steps_1 = require_add_turn_boundary_steps();
    var apply_cursor_usage_1 = require_apply_cursor_usage();
    var cursor_step_context_1 = require_cursor_step_context();
    var tool_call_parts_1 = require_tool_call_parts();
    var addEventStep = (context, event) => {
      switch (event.kind) {
        case "prompt":
          (0, add_turn_boundary_steps_1.addPromptStep)(context, null, event);
          return;
        case "thought":
          addThought(context, event);
          return;
        case "tool":
          addTool(context, event);
          return;
        case "response":
          addResponse(context, event);
          return;
        case "stop":
          (0, apply_cursor_usage_1.applyStop)(context, event);
          return;
        case "compaction":
          addCompaction(context, event);
          return;
        case "subagent_start":
        case "subagent_stop":
          return;
        default:
          (0, assert_never_1.assertNever)(event);
      }
    };
    exports.addEventStep = addEventStep;
    var addThought = (context, event) => {
      (0, cursor_step_context_1.noteModel)(context, event.model);
      context.openStep = null;
      if (event.text.length === 0) {
        return;
      }
      const step = (0, cursor_step_context_1.newEventAgentStep)(event);
      step.reasoning_content = event.text;
      if (event.durationMs !== null) {
        step.extra = { ...step.extra, thinking_duration_ms: event.durationMs };
      }
      (0, cursor_step_context_1.pushAgentStep)(context, step);
      context.openStep = step;
    };
    var addTool = (context, event) => {
      (0, cursor_step_context_1.noteModel)(context, event.model);
      const id = event.toolUseId ?? (0, cursor_step_context_1.nextToolCallId)(context);
      let step = context.openStep;
      if (!step) {
        step = (0, cursor_step_context_1.newEventAgentStep)(event);
        (0, cursor_step_context_1.pushAgentStep)(context, step);
      }
      step.tool_calls = [
        ...step.tool_calls ?? [],
        (0, tool_call_parts_1.toToolCall)(id, event.toolName, (0, json_guards_1.asRecord)(event.toolInput) ?? { input: event.toolInput }, null)
      ];
      step.observation = {
        results: [...step.observation?.results ?? [], (0, tool_call_parts_1.toToolResult)(id, event)]
      };
    };
    var addResponse = (context, event) => {
      (0, cursor_step_context_1.noteModel)(context, event.model);
      const open2 = context.openStep;
      context.openStep = null;
      if (event.text.length === 0 && !event.usage) {
        return;
      }
      let step = open2 && !open2.tool_calls ? open2 : null;
      if (step) {
        step.message = event.text;
      } else {
        step = (0, cursor_step_context_1.newEventAgentStep)(event);
        step.message = event.text;
        (0, cursor_step_context_1.pushAgentStep)(context, step);
      }
      (0, apply_cursor_usage_1.applyResponseUsage)(context, step, event.usage);
    };
    var addCompaction = (context, event) => {
      context.openStep = null;
      context.steps.push({
        step_id: 0,
        timestamp: event.timestamp,
        source: "user",
        message: "",
        extra: {
          is_compact_summary: true,
          ...event.trigger ? { compaction_trigger: event.trigger } : {},
          ...event.contextTokens !== null ? { context_tokens: event.contextTokens } : {}
        }
      });
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/add-message-step.js
var require_add_message_step = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/add-message-step.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addMessageStep = void 0;
    var apply_cursor_usage_1 = require_apply_cursor_usage();
    var cursor_step_context_1 = require_cursor_step_context();
    var tool_call_parts_1 = require_tool_call_parts();
    var addMessageStep = (context, { entry, toolEvents, thoughts, responses }) => {
      context.openStep = null;
      const events = [
        ...thoughts,
        ...toolEvents.flatMap((e) => e ? [e] : []),
        ...responses
      ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      events.forEach((event) => (0, cursor_step_context_1.noteModel)(context, event.model));
      const toolCalls = [];
      const results = [];
      entry.toolUses.forEach((use, index) => {
        const event = toolEvents[index] ?? null;
        const id = event?.toolUseId ?? use.id ?? (0, cursor_step_context_1.nextToolCallId)(context);
        toolCalls.push((0, tool_call_parts_1.toToolCall)(id, use.name, use.input, event?.toolName ?? null));
        if (event) {
          results.push((0, tool_call_parts_1.toToolResult)(id, event));
        }
      });
      const { message, reasoning } = separateReasoning(entry, thoughts);
      const first = events[0];
      const model = events.find((event) => event.model)?.model;
      const generationId = events.find((event) => event.generationId)?.generationId;
      const step = {
        step_id: 0,
        ...first ? { timestamp: first.timestamp } : {},
        source: "agent",
        ...model ? { model_name: model } : {},
        message,
        ...reasoning ? { reasoning_content: reasoning } : {},
        ...toolCalls.length > 0 ? { tool_calls: toolCalls } : {},
        ...results.length > 0 ? { observation: { results } } : {},
        llm_call_count: 1,
        extra: {
          ...generationId ? { generation_id: generationId } : {},
          ...entry.reasoningRedacted && !reasoning ? { reasoning_redacted: true } : {},
          ...entry.otherBlockTypes.length > 0 ? { unconverted_block_types: entry.otherBlockTypes } : {}
        }
      };
      (0, cursor_step_context_1.pushAgentStep)(context, step);
      const usage = responses.flatMap((response) => response.usage ? [response.usage] : []).at(-1);
      (0, apply_cursor_usage_1.applyResponseUsage)(context, step, usage ?? null);
    };
    exports.addMessageStep = addMessageStep;
    var separateReasoning = (entry, thoughts) => {
      let message = entry.text;
      const reasoning = entry.reasoning ? [entry.reasoning] : [];
      for (const { text } of thoughts) {
        if (text.length > 0 && message.includes(text)) {
          message = message.replace(text, "").replace(/\n{3,}/g, "\n\n").trim();
        }
        if (!reasoning.some((part) => part.includes(text))) {
          reasoning.push(text);
        }
      }
      const joined = reasoning.filter((part) => part.length > 0).join("\n\n");
      return { message, reasoning: joined.length > 0 ? joined : null };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/build-cursor-steps.js
var require_build_cursor_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/steps/build-cursor-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildCursorSteps = void 0;
    var assert_never_1 = require_assert_never();
    var add_event_step_1 = require_add_event_step();
    var add_message_step_1 = require_add_message_step();
    var add_turn_boundary_steps_1 = require_add_turn_boundary_steps();
    var cursor_step_context_1 = require_cursor_step_context();
    var buildCursorSteps = (timeline) => {
      const context = (0, cursor_step_context_1.createStepContext)();
      for (const item of timeline) {
        switch (item.kind) {
          case "prompt":
            (0, add_turn_boundary_steps_1.addPromptStep)(context, item.entry, item.event);
            break;
          case "message":
            (0, add_message_step_1.addMessageStep)(context, item);
            break;
          case "turn_ended":
            (0, add_turn_boundary_steps_1.addTurnEnded)(context, item.entry);
            break;
          case "event":
            (0, add_event_step_1.addEventStep)(context, item.event);
            break;
          default:
            (0, assert_never_1.assertNever)(item);
        }
      }
      (0, cursor_step_context_1.finishTurn)(context);
      context.steps.forEach((step, index) => {
        step.step_id = index + 1;
      });
      return context.steps;
    };
    exports.buildCursorSteps = buildCursorSteps;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/convert-cursor-trajectory.js
var require_convert_cursor_trajectory = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/convert-cursor-trajectory.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertCursorTrajectory = void 0;
    var build_leaf_trajectory_1 = require_build_leaf_trajectory();
    var token_totals_1 = require_token_totals();
    var build_cursor_timeline_1 = require_build_cursor_timeline();
    var build_cursor_steps_1 = require_build_cursor_steps();
    var CURSOR_AGENT_NAME = "cursor";
    var convertCursorTrajectory = ({ sessionId, trajectoryId, transcript, events, agentVersion, extra }) => {
      const steps = (0, build_cursor_steps_1.buildCursorSteps)((0, build_cursor_timeline_1.buildCursorTimeline)(transcript?.entries ?? [], events));
      const totals = (0, token_totals_1.sumStepTokens)(steps);
      const trajectory = (0, build_leaf_trajectory_1.buildLeafTrajectory)({
        sessionId,
        trajectoryId,
        agentName: CURSOR_AGENT_NAME,
        agentVersion: agentVersion ?? "unknown",
        steps,
        totals,
        extra: {
          ...extra,
          ...transcript?.overview ? { overview: transcript.overview } : {},
          ...transcript && transcript.malformedLineCount > 0 ? { malformed_line_count: transcript.malformedLineCount } : {}
        }
      });
      return { trajectory, totals };
    };
    exports.convertCursorTrajectory = convertCursorTrajectory;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/convert-cursor-subagents.js
var require_convert_cursor_subagents = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/convert-cursor-subagents.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertCursorSubagents = void 0;
    var path_1 = __require("path");
    var match_weights_1 = require_match_weights();
    var convert_cursor_trajectory_1 = require_convert_cursor_trajectory();
    var convertCursorSubagents = ({ sessionId, rootEvents, subagents, agentVersion }) => {
      const rootOwnEvents = rootEvents.filter((event) => !event.parentToolCallId);
      const delegated = groupByParentToolCall(rootEvents);
      const stops = rootOwnEvents.filter((event) => event.kind === "subagent_stop");
      const convert = (trajectoryId, source, stop, parentToolCallId) => ({
        trajectoryId,
        parentToolCallId,
        task: stop?.task ?? firstPrompt(source.transcript),
        converted: (0, convert_cursor_trajectory_1.convertCursorTrajectory)({
          sessionId,
          trajectoryId,
          transcript: source.transcript,
          events: source.events,
          agentVersion,
          extra: {
            subagent_type: stop?.subagentType ?? null,
            description: stop?.description ?? null,
            subagent_status: stop?.status ?? null,
            ...stop?.durationMs ? { duration_ms: stop.durationMs } : {}
          }
        })
      });
      const converted = subagents.map((subagent) => {
        const stop = stops.find((candidate) => describesChild(candidate, subagent.subagentId, firstPrompt(subagent.transcript))) ?? null;
        const parentToolCallId = stop?.subagentId ?? null;
        const reported = parentToolCallId ? delegated.get(parentToolCallId) ?? [] : [];
        delegated.delete(parentToolCallId ?? "");
        return convert(`subagent-${subagent.subagentId}`, {
          transcript: subagent.transcript,
          events: byTime2([...subagent.events, ...reported])
        }, stop, parentToolCallId);
      });
      for (const [parentToolCallId, events] of delegated) {
        const stop = stops.find((candidate) => candidate.subagentId === parentToolCallId) ?? null;
        converted.push(convert(`tool-call-${parentToolCallId.replace(/\s+/g, "_")}`, { transcript: null, events }, stop, parentToolCallId));
      }
      return { rootOwnEvents, converted };
    };
    exports.convertCursorSubagents = convertCursorSubagents;
    var describesChild = (stop, childId, childPrompt) => {
      const transcriptName = stop.agentTranscriptPath ? (0, path_1.basename)(stop.agentTranscriptPath) : null;
      return stop.childConversationId === childId || transcriptName === `${childId}.jsonl` || transcriptName === `${childId}.txt` || stop.task !== null && childPrompt !== null && (0, match_weights_1.normalizeText)(stop.task) === (0, match_weights_1.normalizeText)(childPrompt);
    };
    var groupByParentToolCall = (events) => {
      const groups = /* @__PURE__ */ new Map();
      for (const event of events) {
        if (event.parentToolCallId) {
          groups.set(event.parentToolCallId, [
            ...groups.get(event.parentToolCallId) ?? [],
            event
          ]);
        }
      }
      return groups;
    };
    var byTime2 = (events) => [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    var firstPrompt = (transcript) => {
      const entry = transcript?.entries.find((candidate) => candidate.kind === "user");
      return entry?.kind === "user" ? entry.text : null;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/link-cursor-subagents.js
var require_link_cursor_subagents = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/link-cursor-subagents.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.linkCursorSubagents = void 0;
    var link_subagent_1 = require_link_subagent();
    var match_weights_1 = require_match_weights();
    var linkCursorSubagents = (sessionId, root, subagents) => {
      const all = [root, ...subagents.map(({ converted }) => converted.trajectory)];
      const linked = /* @__PURE__ */ new Set();
      for (const { trajectoryId, parentToolCallId, task, converted } of subagents) {
        const trajectory = converted.trajectory;
        const ref = {
          trajectory_id: trajectoryId,
          session_id: sessionId,
          extra: {
            subagent_type: trajectory.extra?.["subagent_type"] ?? null,
            description: trajectory.extra?.["description"] ?? null
          }
        };
        let callId = parentToolCallId && (0, link_subagent_1.linkSubagentToToolCall)(all, parentToolCallId, ref) ? parentToolCallId : null;
        if (!callId) {
          callId = findTaskCall(all, task, linked);
          if (callId) {
            (0, link_subagent_1.linkSubagentToToolCall)(all, callId, ref);
          }
        }
        if (callId) {
          linked.add(callId);
        }
        trajectory.extra = { ...trajectory.extra, parent_tool_use_id: callId };
      }
    };
    exports.linkCursorSubagents = linkCursorSubagents;
    var findTaskCall = (trajectories, task, linked) => {
      const needle = (0, match_weights_1.normalizeText)(task ?? "");
      if (needle.length === 0) {
        return null;
      }
      const call = trajectories.flatMap((trajectory) => trajectory.steps).flatMap((step) => step.tool_calls ?? []).find((candidate) => !linked.has(candidate.tool_call_id) && (0, match_weights_1.canonicalToolName)(candidate.function_name) === "task" && stringArguments(candidate).some((value) => (0, match_weights_1.normalizeText)(value) === needle));
      return call?.tool_call_id ?? null;
    };
    var stringArguments = (call) => Object.values(call.arguments).filter((value) => typeof value === "string");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/convert-cursor-session.js
var require_convert_cursor_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/convert/convert-cursor-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertCursorSession = void 0;
    var activity_stats_1 = require_activity_stats();
    var title_from_prompt_1 = require_title_from_prompt();
    var token_totals_1 = require_token_totals();
    var convert_cursor_subagents_1 = require_convert_cursor_subagents();
    var convert_cursor_trajectory_1 = require_convert_cursor_trajectory();
    var link_cursor_subagents_1 = require_link_cursor_subagents();
    var convertCursorSession = (input, converterVersion) => {
      const { sessionId, metadata, gitBranch } = input;
      const { rootOwnEvents, converted: subagents } = (0, convert_cursor_subagents_1.convertCursorSubagents)({
        sessionId,
        rootEvents: input.events,
        subagents: input.subagents,
        agentVersion: metadata.agentVersion
      });
      const main = (0, convert_cursor_trajectory_1.convertCursorTrajectory)({
        sessionId,
        trajectoryId: null,
        transcript: input.transcript,
        events: rootOwnEvents,
        agentVersion: metadata.agentVersion,
        extra: {}
      });
      (0, link_cursor_subagents_1.linkCursorSubagents)(sessionId, main.trajectory, subagents);
      const subagentTrajectories = subagents.map(({ converted }) => converted.trajectory);
      const allTrajectories = [main.trajectory, ...subagentTrajectories];
      const totals = [main, ...subagents.map(({ converted }) => converted)].map((converted) => converted.totals).reduce(token_totals_1.addTokenTotals);
      const firstPrompt = main.trajectory.steps.find((step) => step.source === "user" && step.extra?.["is_compact_summary"] !== true);
      const title = (0, title_from_prompt_1.titleFromPrompt)(typeof firstPrompt?.message === "string" ? firstPrompt.message : null);
      const root = {
        ...main.trajectory,
        notes: `Converted from Cursor agent transcripts and hook events by meticulous-agent-traces ${converterVersion}. Transcripts hold messages and tool calls without timestamps, tool results or usage; hook events, where installed, add those (usage per generation, on its last agent step) and are matched to transcript entries by prompt text and tool order. final_metrics totals include every embedded subagent trajectory; total_steps counts root steps only.`,
        final_metrics: {
          total_prompt_tokens: totals.promptTokens,
          total_completion_tokens: totals.completionTokens,
          total_cached_tokens: totals.cachedTokens,
          total_steps: main.trajectory.steps.length,
          extra: {
            includes_subagent_trajectories: true,
            total_cache_creation_tokens: totals.cacheCreationTokens,
            total_steps_including_subagents: allTrajectories.reduce((sum, trajectory) => sum + trajectory.steps.length, 0)
          }
        },
        extra: {
          ...main.trajectory.extra,
          cwd: metadata.cwd,
          gitBranch,
          title,
          composer_modes: metadata.composerModes,
          has_transcript: input.transcript !== null,
          hook_event_count: input.events.length,
          ...metadata.isBackgroundAgent ? { is_background_agent: true } : {},
          ...input.malformedEventCount > 0 ? { malformed_event_count: input.malformedEventCount } : {}
        },
        ...subagentTrajectories.length > 0 ? { subagent_trajectories: subagentTrajectories } : {}
      };
      return {
        trajectory: root,
        stats: {
          cwd: metadata.cwd,
          gitBranch,
          gitBranches: gitBranch ? [gitBranch] : [],
          pullRequests: [],
          agentVersion: metadata.agentVersion,
          entrypoint: metadata.isBackgroundAgent ? "background-agent" : null,
          permissionModes: metadata.composerModes,
          title,
          models: (0, token_totals_1.countModels)(allTrajectories).map(([model]) => model),
          startedAt: metadata.startedAt,
          endedAt: metadata.endedAt,
          stepCount: main.trajectory.steps.length,
          subagentCount: subagents.length,
          totals,
          reportedCostUsd: null,
          activity: (0, activity_stats_1.computeActivityStats)(root, allTrajectories)
        }
      };
    };
    exports.convertCursorSession = convertCursorSession;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/events/parse-cursor-hook-events.js
var require_parse_cursor_hook_events = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/events/parse-cursor-hook-events.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCursorHookEvents = void 0;
    var json_guards_1 = require_json_guards();
    var parseCursorHookEvents = (timedEvents) => {
      const events = [];
      let malformedEventCount = 0;
      for (const { event, timestamp } of timedEvents) {
        if (!event?.payload) {
          malformedEventCount++;
          continue;
        }
        const name = (0, json_guards_1.asNonEmptyString)(event.payload["hook_event_name"]) ?? event.event;
        const parsed = toEvent(name, event.payload, timestamp);
        if (parsed) {
          events.push(parsed);
        }
      }
      return { events, malformedEventCount };
    };
    exports.parseCursorHookEvents = parseCursorHookEvents;
    var toEvent = (name, payload, timestamp) => {
      const base = {
        timestamp,
        generationId: (0, json_guards_1.asNonEmptyString)(payload["generation_id"]),
        model: (0, json_guards_1.asNonEmptyString)(payload["model"]),
        parentToolCallId: (0, json_guards_1.asNonEmptyString)(payload["parent_tool_call_id"])
      };
      const text = (key) => (0, json_guards_1.asNonEmptyString)(payload[key]);
      switch (name) {
        case "beforeSubmitPrompt": {
          const prompt = (0, json_guards_1.asString)(payload["prompt"]);
          return prompt === null ? null : {
            ...base,
            kind: "prompt",
            prompt,
            attachments: (0, json_guards_1.asArray)(payload["attachments"]) ?? [],
            composerMode: text("composer_mode")
          };
        }
        case "afterAgentThought":
          return {
            ...base,
            kind: "thought",
            text: (0, json_guards_1.asString)(payload["text"]) ?? "",
            durationMs: (0, json_guards_1.asNumber)(payload["duration_ms"])
          };
        case "afterAgentResponse":
          return {
            ...base,
            kind: "response",
            text: (0, json_guards_1.asString)(payload["text"]) ?? "",
            usage: readUsage(payload)
          };
        case "postToolUse":
        case "postToolUseFailure": {
          const isError = name === "postToolUseFailure";
          return {
            ...base,
            kind: "tool",
            toolName: text("tool_name") ?? "unknown",
            toolInput: payload["tool_input"] ?? null,
            toolUseId: text("tool_use_id"),
            output: isError ? (0, json_guards_1.asString)(payload["error_message"]) ?? "" : stringify(payload["tool_output"]),
            isError,
            durationMs: (0, json_guards_1.asNumber)(payload["duration"]),
            failureType: text("failure_type"),
            isInterrupt: payload["is_interrupt"] === true,
            cwd: text("cwd")
          };
        }
        case "stop":
          return {
            ...base,
            kind: "stop",
            status: text("status"),
            loopCount: (0, json_guards_1.asNumber)(payload["loop_count"]),
            usage: readUsage(payload)
          };
        case "subagentStart":
          return {
            ...base,
            kind: "subagent_start",
            subagentId: text("subagent_id"),
            toolCallId: text("tool_call_id")
          };
        case "subagentStop":
          return {
            ...base,
            kind: "subagent_stop",
            subagentId: text("subagent_id"),
            childConversationId: text("child_conversation_id"),
            agentTranscriptPath: text("agent_transcript_path"),
            subagentType: text("subagent_type"),
            status: text("status"),
            task: text("task"),
            description: text("description"),
            summary: text("summary"),
            durationMs: (0, json_guards_1.asNumber)(payload["duration_ms"])
          };
        case "preCompact":
          return {
            ...base,
            kind: "compaction",
            trigger: text("trigger"),
            contextTokens: (0, json_guards_1.asNumber)(payload["context_tokens"])
          };
        default:
          return null;
      }
    };
    var readUsage = (payload) => {
      const counts = [
        "input_tokens",
        "output_tokens",
        "cache_read_tokens",
        "cache_write_tokens"
      ].map((key) => (0, json_guards_1.asNumber)(payload[key]));
      if (counts.every((count) => count === null)) {
        return null;
      }
      const [inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens] = counts.map((count) => count ?? 0);
      return {
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
        cacheReadTokens: cacheReadTokens ?? 0,
        cacheWriteTokens: cacheWriteTokens ?? 0
      };
    };
    var stringify = (value) => {
      if (typeof value === "string") {
        return value;
      }
      return value === null || value === void 0 ? "" : JSON.stringify(value);
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/strip-hook-event-file.js
var require_strip_hook_event_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/strip-hook-event-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripHookEventFile = void 0;
    var json_guards_1 = require_json_guards();
    var rewrite_raw_file_1 = require_rewrite_raw_file();
    var tool_output_filter_1 = require_tool_output_filter();
    var OUTPUT_KEYS = [
      "tool_output",
      "tool_response",
      "tool_result",
      "error_message",
      "output",
      "result"
    ];
    var stripHookEventFile = (file, filter, outputKeysOfOtherEvents) => (0, rewrite_raw_file_1.rewriteJsonFile)(file, (event) => {
      const payload = (0, json_guards_1.asRecord)((0, json_guards_1.asRecord)(event)?.["payload"]);
      if (!payload) {
        return false;
      }
      const keys = filter.isExcluded({
        names: [(0, json_guards_1.asNonEmptyString)(payload["tool_name"])],
        callId: (0, json_guards_1.asNonEmptyString)(payload["tool_use_id"])
      }) ? OUTPUT_KEYS : outputKeysOfOtherEvents?.(payload);
      const present = (keys ?? []).filter((key) => key in payload);
      for (const key of present) {
        payload[key] = tool_output_filter_1.EXCLUDED_TOOL_OUTPUT;
      }
      return present.length > 0;
    });
    exports.stripHookEventFile = stripHookEventFile;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/strip-cursor-tool-outputs.js
var require_strip_cursor_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/strip-cursor-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripCursorToolOutputs = void 0;
    var strip_hook_event_file_1 = require_strip_hook_event_file();
    var json_guards_1 = require_json_guards();
    var SUBAGENT_OUTPUT_KEYS = ["summary"];
    var stripCursorToolOutputs = (files, filter) => files.map((file) => (0, strip_hook_event_file_1.stripHookEventFile)(file, filter, (payload) => filter.isExcluded({ callId: (0, json_guards_1.asNonEmptyString)(payload["subagent_id"]) }) ? SUBAGENT_OUTPUT_KEYS : []));
    exports.stripCursorToolOutputs = stripCursorToolOutputs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/clean-message-text.js
var require_clean_message_text = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/clean-message-text.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.splitRedactedReasoning = exports.cleanUserText = void 0;
    var TIMESTAMP_TAG_REGEX = /<timestamp>([\s\S]*?)<\/timestamp>/;
    var USER_QUERY_REGEX = /<user_query>([\s\S]*?)<\/user_query>/g;
    var PROMPT_TIMESTAMP_REGEX = /^[A-Za-z]+, ([A-Za-z]{3}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) (AM|PM) \(UTC(?:([+-])(\d{1,2})(?::(\d{2}))?)?\)$/;
    var MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    var REDACTED_REASONING = "[REDACTED]";
    var cleanUserText = (raw) => {
      const timestampTag = TIMESTAMP_TAG_REGEX.exec(raw)?.[1];
      const withoutTimestamp = raw.replace(TIMESTAMP_TAG_REGEX, "");
      const queries = [...withoutTimestamp.matchAll(USER_QUERY_REGEX)].map((match) => (match[1] ?? "").trim());
      return {
        text: queries.length > 0 ? queries.join("\n\n") : withoutTimestamp.trim(),
        timestamp: timestampTag ? parsePromptTimestamp(timestampTag.trim()) : null
      };
    };
    exports.cleanUserText = cleanUserText;
    var splitRedactedReasoning = (text) => {
      if (text === REDACTED_REASONING) {
        return { text: "", reasoningRedacted: true };
      }
      const suffix = `

${REDACTED_REASONING}`;
      return text.endsWith(suffix) ? { text: text.slice(0, -suffix.length), reasoningRedacted: true } : { text, reasoningRedacted: false };
    };
    exports.splitRedactedReasoning = splitRedactedReasoning;
    var parsePromptTimestamp = (text) => {
      const match = PROMPT_TIMESTAMP_REGEX.exec(text);
      if (!match) {
        return null;
      }
      const [, month, day, year, hour, minute, meridiem, sign, offsetHours, offsetMinutes] = match;
      const monthIndex = MONTHS.indexOf(month ?? "");
      if (monthIndex < 0) {
        return null;
      }
      const hour24 = Number(hour) % 12 + (meridiem === "PM" ? 12 : 0);
      const offset = (sign === "-" ? -1 : 1) * (Number(offsetHours ?? 0) * 60 + Number(offsetMinutes ?? 0));
      const ms = Date.UTC(Number(year), monthIndex, Number(day), hour24, Number(minute)) - offset * 6e4;
      return Number.isNaN(ms) ? null : new Date(ms).toISOString();
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/parse-cursor-jsonl-transcript.js
var require_parse_cursor_jsonl_transcript = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/parse-cursor-jsonl-transcript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCursorJsonlTranscript = void 0;
    var json_guards_1 = require_json_guards();
    var clean_message_text_1 = require_clean_message_text();
    var parseCursorJsonlTranscript = (text) => {
      const parsed = {
        entries: [],
        overview: null,
        malformedLineCount: 0
      };
      for (const line of text.split("\n")) {
        if (line.trim().length === 0) {
          continue;
        }
        const record2 = parseLine(line);
        if (!record2) {
          parsed.malformedLineCount++;
          continue;
        }
        if (record2["type"] === "metadata") {
          parsed.overview ??= (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(record2["metadata"])?.["overview"]);
          continue;
        }
        const entry = toEntry(record2);
        if (entry) {
          parsed.entries.push(entry);
        } else {
          parsed.malformedLineCount++;
        }
      }
      return parsed;
    };
    exports.parseCursorJsonlTranscript = parseCursorJsonlTranscript;
    var parseLine = (line) => {
      try {
        return (0, json_guards_1.asRecord)(JSON.parse(line));
      } catch {
        return null;
      }
    };
    var toEntry = (record2) => {
      if (record2["type"] === "turn_ended") {
        return {
          kind: "turn_ended",
          status: (0, json_guards_1.asNonEmptyString)(record2["status"]),
          error: (0, json_guards_1.asNonEmptyString)(record2["error"])
        };
      }
      const blocks = (0, json_guards_1.asArray)((0, json_guards_1.asRecord)(record2["message"])?.["content"]);
      if (!blocks) {
        return null;
      }
      switch (record2["role"]) {
        case "user":
          return { kind: "user", ...(0, clean_message_text_1.cleanUserText)(joinTexts(blocks)) };
        case "assistant":
          return toAssistantEntry(blocks);
        default:
          return null;
      }
    };
    var toAssistantEntry = (blocks) => {
      const toolUses = [];
      const reasoning = [];
      const otherBlockTypes = /* @__PURE__ */ new Set();
      for (const block of blocks.map(json_guards_1.asRecord)) {
        const type = (0, json_guards_1.asString)(block?.["type"]);
        if (type === "tool_use") {
          toolUses.push(toToolUse(block ?? {}));
        } else if (type === "thinking") {
          reasoning.push((0, json_guards_1.asString)(block?.["thinking"]) ?? "");
        } else if (type !== "text") {
          otherBlockTypes.add(type ?? "unknown");
        }
      }
      return {
        kind: "assistant",
        ...(0, clean_message_text_1.splitRedactedReasoning)(joinTexts(blocks)),
        reasoning: reasoning.length > 0 ? reasoning.join("\n\n") : null,
        toolUses,
        otherBlockTypes: [...otherBlockTypes]
      };
    };
    var toToolUse = (block) => {
      const input = block["input"];
      return {
        id: (0, json_guards_1.asNonEmptyString)(block["id"]),
        name: (0, json_guards_1.asNonEmptyString)(block["name"]) ?? "unknown",
        input: (0, json_guards_1.asRecord)(input) ?? (input === void 0 ? {} : { input })
      };
    };
    var joinTexts = (blocks) => blocks.map(json_guards_1.asRecord).filter((block) => block?.["type"] === "text").map((block) => (0, json_guards_1.asString)(block?.["text"]) ?? "").join("\n\n");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/parse-cursor-text-transcript.js
var require_parse_cursor_text_transcript = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/parse-cursor-text-transcript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCursorTextTranscript = void 0;
    var clean_message_text_1 = require_clean_message_text();
    var ROLE_MARKER_REGEX = /^(user|assistant|A):$/;
    var TURN_ENDED_REGEX = /^Turn ended: (success|error|aborted)[.:]?\s*(.*)$/;
    var TOOL_CALL_PREFIX = "[Tool call] ";
    var TOOL_RESULT_PREFIX = "[Tool result] ";
    var THINKING_PREFIX = "[Thinking]";
    var TOOL_ARGUMENT_REGEX = /^ {2}([^:]+): (.*)$/;
    var parseCursorTextTranscript = (text) => {
      const entries2 = [];
      let open2 = null;
      const close = () => {
        if (open2) {
          entries2.push(toEntry(open2));
          open2 = null;
        }
      };
      for (const line of text.split(/\r?\n/)) {
        const role = ROLE_MARKER_REGEX.exec(line.trim())?.[1];
        const turnEnded = TURN_ENDED_REGEX.exec(line.trim());
        if (role) {
          close();
          open2 = newMessage(role === "user" ? "user" : "assistant");
        } else if (turnEnded) {
          close();
          entries2.push({
            kind: "turn_ended",
            status: turnEnded[1] ?? null,
            error: turnEnded[2] || null
          });
        } else if (open2) {
          addLine(open2, line);
        }
      }
      close();
      return { entries: entries2, overview: null, malformedLineCount: 0 };
    };
    exports.parseCursorTextTranscript = parseCursorTextTranscript;
    var newMessage = (role) => ({
      role,
      lines: [],
      reasoning: [],
      toolUses: []
    });
    var addLine = (message, line) => {
      const lastToolUse = message.toolUses.at(-1);
      const argument = TOOL_ARGUMENT_REGEX.exec(line);
      if (message.role === "user") {
        message.lines.push(line);
      } else if (line.startsWith(TOOL_CALL_PREFIX)) {
        message.toolUses.push({
          id: null,
          name: line.slice(TOOL_CALL_PREFIX.length).trim() || "unknown",
          input: {}
        });
      } else if (argument && lastToolUse) {
        lastToolUse.input[argument[1] ?? ""] = parseArgumentValue(argument[2] ?? "");
      } else if (line.startsWith(THINKING_PREFIX)) {
        message.reasoning.push(line.slice(THINKING_PREFIX.length).trim());
      } else if (!line.startsWith(TOOL_RESULT_PREFIX)) {
        message.lines.push(line);
      }
    };
    var toEntry = (message) => {
      const text = message.lines.join("\n").trim();
      if (message.role === "user") {
        return { kind: "user", ...(0, clean_message_text_1.cleanUserText)(text) };
      }
      return {
        kind: "assistant",
        text,
        reasoning: message.reasoning.length > 0 ? message.reasoning.join("\n") : null,
        reasoningRedacted: false,
        toolUses: message.toolUses,
        otherBlockTypes: []
      };
    };
    var parseArgumentValue = (value) => {
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/parse-cursor-transcript.js
var require_parse_cursor_transcript = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/cursor/transcript/parse-cursor-transcript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCursorTranscript = void 0;
    var parse_cursor_jsonl_transcript_1 = require_parse_cursor_jsonl_transcript();
    var parse_cursor_text_transcript_1 = require_parse_cursor_text_transcript();
    var parseCursorTranscript = (file) => file.relativePath.endsWith(".txt") ? (0, parse_cursor_text_transcript_1.parseCursorTextTranscript)(file.content) : (0, parse_cursor_jsonl_transcript_1.parseCursorJsonlTranscript)(file.content);
    exports.parseCursorTranscript = parseCursorTranscript;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/devin/collect-devin-metadata.js
var require_collect_devin_metadata = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/devin/collect-devin-metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.collectDevinMetadata = void 0;
    var title_from_prompt_1 = require_title_from_prompt();
    var json_guards_1 = require_json_guards();
    var collectDevinMetadata = (events) => {
      const metadata = {
        cwd: null,
        title: null,
        startedAt: events[0]?.timestamp ?? null,
        endedAt: events.at(-1)?.timestamp ?? null,
        startSource: null,
        endReason: null,
        malformedEventCount: 0
      };
      for (const { event } of events) {
        if (!event?.payload) {
          metadata.malformedEventCount++;
          continue;
        }
        const { payload } = event;
        metadata.cwd ??= event.projectDir ?? event.cwd;
        switch ((0, json_guards_1.asNonEmptyString)(payload["hook_event_name"]) ?? event.event) {
          case "UserPromptSubmit":
            metadata.title ??= (0, title_from_prompt_1.titleFromPrompt)((0, json_guards_1.asString)(payload["prompt"]));
            break;
          case "SessionStart":
            metadata.startSource ??= (0, json_guards_1.asNonEmptyString)(payload["source"]);
            break;
          case "SessionEnd":
            metadata.endReason = (0, json_guards_1.asNonEmptyString)(payload["reason"]);
            break;
        }
      }
      return metadata;
    };
    exports.collectDevinMetadata = collectDevinMetadata;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/devin/build-devin-steps.js
var require_build_devin_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/devin/build-devin-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildDevinSteps = void 0;
    var truncate_observation_content_1 = require_truncate_observation_content();
    var json_guards_1 = require_json_guards();
    var buildDevinSteps = (events) => {
      const steps = [];
      let toolCallCount = 0;
      for (const { event, timestamp } of events) {
        if (!event?.payload) {
          continue;
        }
        const eventName = (0, json_guards_1.asNonEmptyString)(event.payload["hook_event_name"]) ?? event.event;
        const step = toStep(eventName, event.payload, timestamp, () => {
          toolCallCount++;
          return `call_${toolCallCount}`;
        });
        if (step) {
          steps.push(step);
        }
      }
      steps.forEach((step, index) => {
        step.step_id = index + 1;
      });
      return steps;
    };
    exports.buildDevinSteps = buildDevinSteps;
    var toStep = (eventName, payload, timestamp, nextToolCallId) => {
      const promptId = (0, json_guards_1.asNonEmptyString)(payload["prompt_id"]);
      const base = {
        step_id: 0,
        timestamp,
        extra: promptId ? { prompt_id: promptId } : {}
      };
      switch (eventName) {
        case "UserPromptSubmit": {
          const prompt = (0, json_guards_1.asString)(payload["prompt"]);
          return prompt === null ? null : { ...base, source: "user", message: prompt };
        }
        case "PostToolUse":
          return toToolStep(payload, base, nextToolCallId());
        case "Stop": {
          const message = (0, json_guards_1.asNonEmptyString)(payload["last_assistant_message"]);
          return message ? { ...base, source: "agent", message } : null;
        }
        case "PostCompaction":
          return {
            ...base,
            source: "user",
            message: (0, json_guards_1.asString)(payload["summary"]) ?? "",
            extra: { ...base.extra, is_compact_summary: true }
          };
        default:
          return null;
      }
    };
    var toToolStep = (payload, base, toolCallId) => {
      const toolInput = payload["tool_input"];
      const response = (0, json_guards_1.asRecord)(payload["tool_response"]);
      const success = typeof response?.["success"] === "boolean" ? response["success"] : null;
      const { content, originalLength } = (0, truncate_observation_content_1.truncateObservationContent)(response ? describeResponse(response) : stringify(payload["tool_response"]));
      return {
        ...base,
        source: "agent",
        message: "",
        tool_calls: [
          {
            tool_call_id: toolCallId,
            function_name: (0, json_guards_1.asNonEmptyString)(payload["tool_name"]) ?? "unknown",
            arguments: (0, json_guards_1.asRecord)(toolInput) ?? { input: toolInput ?? null }
          }
        ],
        observation: {
          results: [
            {
              source_call_id: toolCallId,
              content,
              extra: {
                is_error: success === false,
                ...originalLength !== null ? { truncated: true, original_length_chars: originalLength } : {}
              }
            }
          ]
        }
      };
    };
    var describeResponse = (response) => {
      const output = stringify(response["output"]);
      const error = stringify(response["error"]);
      return [output, error ? `Error: ${error}` : ""].filter((part) => part.length > 0).join("\n");
    };
    var stringify = (value) => {
      if (typeof value === "string") {
        return value;
      }
      return value === null || value === void 0 ? "" : JSON.stringify(value);
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/devin/convert-devin-session.js
var require_convert_devin_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/devin/convert-devin-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertDevinSession = void 0;
    var atif_types_1 = require_atif_types();
    var activity_stats_1 = require_activity_stats();
    var build_devin_steps_1 = require_build_devin_steps();
    var DEVIN_AGENT_NAME = "devin";
    var convertDevinSession = ({ sessionId, events, metadata, gitBranch }, converterVersion) => {
      const steps = (0, build_devin_steps_1.buildDevinSteps)(events);
      const trajectory = {
        schema_version: atif_types_1.ATIF_SCHEMA_VERSION,
        session_id: sessionId,
        agent: { name: DEVIN_AGENT_NAME, version: "unknown" },
        steps,
        notes: `Rebuilt from Devin lifecycle hook events by meticulous-agent-traces ${converterVersion}. Devin's hooks expose prompts, tool calls and each turn's final message, but not the model, token usage or intermediate assistant messages.`,
        final_metrics: { total_steps: steps.length },
        extra: {
          cwd: metadata.cwd,
          gitBranch,
          title: metadata.title,
          session_start_source: metadata.startSource,
          session_end_reason: metadata.endReason,
          ...metadata.malformedEventCount > 0 ? { malformed_event_count: metadata.malformedEventCount } : {}
        }
      };
      return {
        trajectory,
        stats: {
          cwd: metadata.cwd,
          gitBranch,
          gitBranches: gitBranch ? [gitBranch] : [],
          pullRequests: [],
          agentVersion: null,
          entrypoint: metadata.startSource,
          permissionModes: [],
          title: metadata.title,
          models: [],
          startedAt: metadata.startedAt,
          endedAt: metadata.endedAt,
          stepCount: steps.length,
          subagentCount: 0,
          totals: {
            promptTokens: 0,
            completionTokens: 0,
            cachedTokens: 0,
            cacheCreationTokens: 0
          },
          reportedCostUsd: null,
          activity: (0, activity_stats_1.computeActivityStats)(trajectory, [trajectory])
        }
      };
    };
    exports.convertDevinSession = convertDevinSession;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/devin/redact-devin-event-files.js
var require_redact_devin_event_files = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/devin/redact-devin-event-files.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.redactDevinEventFiles = exports.REDACTED_ENV_VALUE = void 0;
    var json_guards_1 = require_json_guards();
    exports.REDACTED_ENV_VALUE = "[REDACTED]";
    var redactDevinEventFiles = (files) => files.map(redactFile);
    exports.redactDevinEventFiles = redactDevinEventFiles;
    var redactFile = (file) => {
      let parsed;
      try {
        parsed = JSON.parse(file.content);
      } catch {
        return file;
      }
      const env = (0, json_guards_1.asRecord)((0, json_guards_1.asRecord)((0, json_guards_1.asRecord)(parsed)?.["payload"])?.["tool_input"])?.["env"];
      const envRecord = (0, json_guards_1.asRecord)(env);
      if (!envRecord || Object.keys(envRecord).length === 0) {
        return file;
      }
      for (const key of Object.keys(envRecord)) {
        envRecord[key] = exports.REDACTED_ENV_VALUE;
      }
      const content = JSON.stringify(parsed);
      return {
        ...file,
        content,
        sizeBytes: Buffer.byteLength(content, "utf8")
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/devin/strip-devin-tool-outputs.js
var require_strip_devin_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/devin/strip-devin-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripDevinToolOutputs = void 0;
    var strip_hook_event_file_1 = require_strip_hook_event_file();
    var stripDevinToolOutputs = (files, filter) => files.map((file) => (0, strip_hook_event_file_1.stripHookEventFile)(file, filter));
    exports.stripDevinToolOutputs = stripDevinToolOutputs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/opencode-tokens.js
var require_opencode_tokens = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/opencode-tokens.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openCodeTokensToMetrics = exports.tokenSemanticsForVersion = exports.isZeroOpenCodeTokens = exports.addOpenCodeTokens = exports.parseOpenCodeTokens = exports.ZERO_OPENCODE_TOKENS = void 0;
    var json_guards_1 = require_json_guards();
    exports.ZERO_OPENCODE_TOKENS = {
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0
    };
    var parseOpenCodeTokens = (value) => {
      const tokens = (0, json_guards_1.asRecord)(value);
      if (!tokens) {
        return null;
      }
      const cache = (0, json_guards_1.asRecord)(tokens["cache"]);
      return {
        input: (0, json_guards_1.asNumber)(tokens["input"]) ?? 0,
        output: (0, json_guards_1.asNumber)(tokens["output"]) ?? 0,
        reasoning: (0, json_guards_1.asNumber)(tokens["reasoning"]) ?? 0,
        cacheRead: (0, json_guards_1.asNumber)(cache?.["read"]) ?? 0,
        cacheWrite: (0, json_guards_1.asNumber)(cache?.["write"]) ?? 0
      };
    };
    exports.parseOpenCodeTokens = parseOpenCodeTokens;
    var addOpenCodeTokens = (a, b) => ({
      input: a.input + b.input,
      output: a.output + b.output,
      reasoning: a.reasoning + b.reasoning,
      cacheRead: a.cacheRead + b.cacheRead,
      cacheWrite: a.cacheWrite + b.cacheWrite
    });
    exports.addOpenCodeTokens = addOpenCodeTokens;
    var isZeroOpenCodeTokens = (tokens) => tokens.input === 0 && tokens.output === 0 && tokens.reasoning === 0 && tokens.cacheRead === 0 && tokens.cacheWrite === 0;
    exports.isZeroOpenCodeTokens = isZeroOpenCodeTokens;
    var FIRST_VERSION_EXCLUDING_REASONING = [1, 3, 16];
    var tokenSemanticsForVersion = (version) => {
      const parts = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "")?.slice(1).map(Number);
      if (!parts) {
        return { outputIncludesReasoning: false };
      }
      const firstDifference = parts.findIndex((part, index) => part !== FIRST_VERSION_EXCLUDING_REASONING[index]);
      return {
        outputIncludesReasoning: firstDifference !== -1 && (parts[firstDifference] ?? 0) < (FIRST_VERSION_EXCLUDING_REASONING[firstDifference] ?? 0)
      };
    };
    exports.tokenSemanticsForVersion = tokenSemanticsForVersion;
    var openCodeTokensToMetrics = (tokens, costUsd, { outputIncludesReasoning }) => ({
      prompt_tokens: tokens.input + tokens.cacheRead + tokens.cacheWrite,
      completion_tokens: outputIncludesReasoning ? tokens.output : tokens.output + tokens.reasoning,
      cached_tokens: tokens.cacheRead,
      ...costUsd !== null ? { cost_usd: costUsd } : {},
      extra: {
        input_tokens: tokens.input,
        output_tokens: tokens.output,
        reasoning_tokens: tokens.reasoning,
        cache_read_input_tokens: tokens.cacheRead,
        cache_creation_input_tokens: tokens.cacheWrite
      }
    });
    exports.openCodeTokensToMetrics = openCodeTokensToMetrics;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/tool-part-to-call.js
var require_tool_part_to_call = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/tool-part-to-call.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toolPartToCall = void 0;
    var truncate_observation_content_1 = require_truncate_observation_content();
    var json_guards_1 = require_json_guards();
    var TASK_TOOL_NAME = "task";
    var TASK_OUTPUT_SESSION_ID_REGEX = /<task id="([^"]+)"/;
    var toolPartToCall = (part) => {
      const state = (0, json_guards_1.asRecord)(part["state"]) ?? {};
      const status = (0, json_guards_1.asString)(state["status"]);
      const toolName = (0, json_guards_1.asNonEmptyString)(part["tool"]) ?? "unknown";
      const toolCallId = (0, json_guards_1.asNonEmptyString)(part["callID"]) ?? (0, json_guards_1.asNonEmptyString)(part["id"]) ?? "";
      const title = (0, json_guards_1.asNonEmptyString)(state["title"]);
      const isFinished = status === "completed" || status === "error";
      const call = {
        tool_call_id: toolCallId,
        function_name: toolName,
        arguments: (0, json_guards_1.asRecord)(state["input"]) ?? {},
        ...title || !isFinished ? {
          extra: {
            ...title ? { title } : {},
            ...!isFinished ? { status: status ?? "unknown" } : {}
          }
        } : {}
      };
      return {
        call,
        result: isFinished ? toResult(toolCallId, state, status === "error") : null,
        childSessionId: toolName === TASK_TOOL_NAME ? findChildSessionId(state) : null
      };
    };
    exports.toolPartToCall = toolPartToCall;
    var toResult = (toolCallId, state, isError) => {
      const raw = (0, json_guards_1.asString)(state[isError ? "error" : "output"]) ?? "";
      const { content, originalLength } = (0, truncate_observation_content_1.truncateObservationContent)(raw);
      const time = (0, json_guards_1.asRecord)(state["time"]);
      const attachments = Array.isArray(state["attachments"]) ? state["attachments"].length : 0;
      return {
        source_call_id: toolCallId,
        content,
        extra: {
          is_error: isError,
          ...originalLength !== null ? { truncated: true, original_length_chars: originalLength } : {},
          ...(0, json_guards_1.asNumber)(time?.["compacted"]) !== null ? { pruned_from_context: true } : {},
          ...attachments > 0 ? { attachment_count: attachments } : {}
        }
      };
    };
    var findChildSessionId = (state) => (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(state["metadata"])?.["sessionId"]) ?? TASK_OUTPUT_SESSION_ID_REGEX.exec((0, json_guards_1.asString)(state["output"]) ?? "")?.[1] ?? null;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/collect-assistant-parts.js
var require_collect_assistant_parts = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/collect-assistant-parts.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.collectAssistantParts = void 0;
    var json_guards_1 = require_json_guards();
    var opencode_tokens_1 = require_opencode_tokens();
    var tool_part_to_call_1 = require_tool_part_to_call();
    var IGNORED_PART_TYPES = /* @__PURE__ */ new Set(["step-start", "snapshot"]);
    var collectAssistantParts = (parts) => {
      const collected = {
        texts: [],
        reasoning: [],
        toolCalls: [],
        results: [],
        subagentLinks: [],
        patchedFiles: [],
        otherPartTypes: /* @__PURE__ */ new Set(),
        stepTokens: opencode_tokens_1.ZERO_OPENCODE_TOKENS,
        llmCallCount: 0,
        retryCount: 0
      };
      for (const part of parts) {
        addPart(collected, part);
      }
      return collected;
    };
    exports.collectAssistantParts = collectAssistantParts;
    var addPart = (collected, part) => {
      const type = (0, json_guards_1.asString)(part["type"]) ?? "unknown";
      switch (type) {
        case "text":
          collected.texts.push((0, json_guards_1.asString)(part["text"]) ?? "");
          break;
        case "reasoning":
          collected.reasoning.push((0, json_guards_1.asString)(part["text"]) ?? "");
          break;
        case "tool": {
          const { call, result, childSessionId } = (0, tool_part_to_call_1.toolPartToCall)(part);
          collected.toolCalls.push(call);
          if (result) {
            collected.results.push(result);
          }
          if (childSessionId) {
            collected.subagentLinks.push({
              toolCallId: call.tool_call_id,
              childSessionId
            });
          }
          break;
        }
        case "step-finish":
          collected.llmCallCount++;
          collected.stepTokens = (0, opencode_tokens_1.addOpenCodeTokens)(collected.stepTokens, (0, opencode_tokens_1.parseOpenCodeTokens)(part["tokens"]) ?? opencode_tokens_1.ZERO_OPENCODE_TOKENS);
          break;
        case "patch":
          for (const file of Array.isArray(part["files"]) ? part["files"] : []) {
            if (typeof file === "string") {
              collected.patchedFiles.push(file);
            }
          }
          break;
        case "retry":
          collected.retryCount++;
          break;
        default:
          if (!IGNORED_PART_TYPES.has(type)) {
            collected.otherPartTypes.add(type);
          }
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/message-time.js
var require_message_time = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/message-time.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.messageTimeMs = exports.messageTimestamp = void 0;
    var json_guards_1 = require_json_guards();
    var messageTimestamp = (info, field2) => {
      const ms = (0, exports.messageTimeMs)(info, field2);
      return ms !== null ? new Date(ms).toISOString() : null;
    };
    exports.messageTimestamp = messageTimestamp;
    var messageTimeMs = (info, field2) => {
      const ms = (0, json_guards_1.asNumber)((0, json_guards_1.asRecord)(info["time"])?.[field2]);
      return ms !== null && ms > 0 && ms < 864e13 ? ms : null;
    };
    exports.messageTimeMs = messageTimeMs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/assistant-message-to-steps.js
var require_assistant_message_to_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/assistant-message-to-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assistantMessageToSteps = void 0;
    var json_guards_1 = require_json_guards();
    var collect_assistant_parts_1 = require_collect_assistant_parts();
    var message_time_1 = require_message_time();
    var opencode_tokens_1 = require_opencode_tokens();
    var assistantMessageToSteps = ({ info, parts }, compaction, tokenSemantics) => {
      const collected = (0, collect_assistant_parts_1.collectAssistantParts)(parts);
      const tokens = collected.llmCallCount > 0 ? collected.stepTokens : (0, opencode_tokens_1.parseOpenCodeTokens)(info["tokens"]) ?? opencode_tokens_1.ZERO_OPENCODE_TOKENS;
      const costUsd = (0, json_guards_1.asNumber)(info["cost"]);
      const hasUsage = !(0, opencode_tokens_1.isZeroOpenCodeTokens)(tokens) || (costUsd ?? 0) > 0;
      const modelId = (0, json_guards_1.asNonEmptyString)(info["modelID"]);
      const timestamp = (0, message_time_1.messageTimestamp)(info, "created");
      const message = joinNonEmpty(collected.texts);
      const reasoning = joinNonEmpty(collected.reasoning);
      const agentStep2 = {
        step_id: 0,
        ...timestamp ? { timestamp } : {},
        source: "agent",
        ...modelId ? { model_name: modelId } : {},
        message: compaction ? "" : message,
        ...reasoning ? { reasoning_content: reasoning } : {},
        ...collected.toolCalls.length > 0 ? { tool_calls: collected.toolCalls } : {},
        ...collected.results.length > 0 ? { observation: { results: collected.results } } : {},
        ...hasUsage ? { metrics: (0, opencode_tokens_1.openCodeTokensToMetrics)(tokens, costUsd, tokenSemantics) } : {},
        ...collected.llmCallCount > 0 ? { llm_call_count: collected.llmCallCount } : {},
        extra: {
          ...describeMessage(info),
          ...compaction ? { compaction: true, compaction_auto: compaction.auto } : {},
          ...collected.patchedFiles.length > 0 ? { patched_files: collected.patchedFiles } : {},
          ...collected.retryCount > 0 ? { retry_count: collected.retryCount } : {},
          ...collected.otherPartTypes.size > 0 ? { unconverted_part_types: [...collected.otherPartTypes] } : {}
        }
      };
      if (!compaction) {
        return { steps: [agentStep2], subagentLinks: collected.subagentLinks };
      }
      const completedAt = (0, message_time_1.messageTimestamp)(info, "completed") ?? timestamp;
      const summaryStep = {
        step_id: 0,
        ...completedAt ? { timestamp: completedAt } : {},
        source: "user",
        message,
        extra: { message_id: info["id"], is_compact_summary: true }
      };
      return {
        steps: [agentStep2, summaryStep],
        subagentLinks: collected.subagentLinks
      };
    };
    exports.assistantMessageToSteps = assistantMessageToSteps;
    var describeMessage = (info) => {
      const error = (0, json_guards_1.asRecord)(info["error"]);
      const fields = {
        message_id: info["id"],
        provider_id: (0, json_guards_1.asNonEmptyString)(info["providerID"]),
        agent: (0, json_guards_1.asNonEmptyString)(info["agent"]),
        finish_reason: (0, json_guards_1.asNonEmptyString)(info["finish"]),
        variant: (0, json_guards_1.asNonEmptyString)(info["variant"]),
        error: error ? {
          name: (0, json_guards_1.asNonEmptyString)(error["name"]),
          message: (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(error["data"])?.["message"])
        } : null
      };
      return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null));
    };
    var joinNonEmpty = (parts) => parts.filter((part) => part.length > 0).join("\n\n");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/user-message-to-step.js
var require_user_message_to_step = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/user-message-to-step.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.userMessageToStep = void 0;
    var json_guards_1 = require_json_guards();
    var message_time_1 = require_message_time();
    var userMessageToStep = ({ info, parts }) => {
      const typed = [];
      const synthetic = [];
      const subtaskPrompts = [];
      const attachments = [];
      const mentionedAgents = [];
      for (const part of parts) {
        const text = (0, json_guards_1.asString)(part["text"]);
        switch ((0, json_guards_1.asString)(part["type"])) {
          case "text":
            if (text && part["ignored"] !== true) {
              if (part["synthetic"] === true) {
                synthetic.push(part);
              } else {
                typed.push(text);
              }
            }
            break;
          case "subtask":
            subtaskPrompts.push((0, json_guards_1.asString)(part["prompt"]) ?? "");
            break;
          case "file":
            attachments.push({
              mime: (0, json_guards_1.asNonEmptyString)(part["mime"]),
              filename: (0, json_guards_1.asNonEmptyString)(part["filename"])
            });
            break;
          case "agent":
            mentionedAgents.push((0, json_guards_1.asString)(part["name"]) ?? "");
            break;
        }
      }
      const message = typed.join("\n\n") || synthetic.map((part) => (0, json_guards_1.asString)(part["text"])).join("\n\n") || subtaskPrompts.join("\n\n");
      if (!message && attachments.length === 0) {
        return null;
      }
      const originKind = typed.length > 0 ? null : describeOrigin(synthetic, subtaskPrompts);
      const timestamp = (0, message_time_1.messageTimestamp)(info, "created");
      return {
        step_id: 0,
        ...timestamp ? { timestamp } : {},
        source: "user",
        message,
        extra: {
          message_id: info["id"],
          ...(0, json_guards_1.asNonEmptyString)(info["agent"]) ? { agent: info["agent"] } : {},
          ...originKind ? { origin_kind: originKind } : {},
          ...attachments.length > 0 ? { attachments } : {},
          ...mentionedAgents.length > 0 ? { mentioned_agents: mentionedAgents } : {}
        }
      };
    };
    exports.userMessageToStep = userMessageToStep;
    var describeOrigin = (synthetic, subtaskPrompts) => {
      if (synthetic.some((part) => (0, json_guards_1.asRecord)(part["metadata"])?.["compaction_continue"] === true)) {
        return "compaction-continue";
      }
      if (synthetic.length > 0) {
        return "synthetic";
      }
      return subtaskPrompts.length > 0 ? "subtask" : null;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/build-opencode-steps.js
var require_build_opencode_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/build-opencode-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildOpenCodeSteps = void 0;
    var json_guards_1 = require_json_guards();
    var assistant_message_to_steps_1 = require_assistant_message_to_steps();
    var user_message_to_step_1 = require_user_message_to_step();
    var buildOpenCodeSteps = (messages, tokenSemantics) => {
      const compactionRequests = findCompactionRequests(messages);
      const built = {
        steps: [],
        subagentLinks: [],
        unconvertedMessageCount: 0
      };
      for (const message of messages) {
        switch ((0, json_guards_1.asString)(message.info["role"])) {
          case "user": {
            const step = (0, user_message_to_step_1.userMessageToStep)(message);
            if (step) {
              built.steps.push(step);
            }
            break;
          }
          case "assistant": {
            const parentId = (0, json_guards_1.asNonEmptyString)(message.info["parentID"]);
            const isSummary = message.info["summary"] === true;
            const { steps, subagentLinks } = (0, assistant_message_to_steps_1.assistantMessageToSteps)(message, isSummary ? {
              auto: parentId ? compactionRequests.get(parentId) ?? false : false
            } : null, tokenSemantics);
            built.steps.push(...steps);
            built.subagentLinks.push(...subagentLinks);
            break;
          }
          default:
            built.unconvertedMessageCount++;
        }
      }
      built.steps.forEach((step, index) => {
        step.step_id = index + 1;
      });
      return built;
    };
    exports.buildOpenCodeSteps = buildOpenCodeSteps;
    var findCompactionRequests = (messages) => {
      const requests = /* @__PURE__ */ new Map();
      for (const { info, parts } of messages) {
        const id = (0, json_guards_1.asNonEmptyString)(info["id"]);
        const compaction = parts.find((part) => part["type"] === "compaction");
        if (id && compaction) {
          requests.set(id, compaction["auto"] === true);
        }
      }
      return requests;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/convert-opencode-transcript.js
var require_convert_opencode_transcript = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/convert-opencode-transcript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertOpenCodeTranscript = void 0;
    var build_leaf_trajectory_1 = require_build_leaf_trajectory();
    var token_totals_1 = require_token_totals();
    var json_guards_1 = require_json_guards();
    var build_opencode_steps_1 = require_build_opencode_steps();
    var message_time_1 = require_message_time();
    var opencode_tokens_1 = require_opencode_tokens();
    var OPENCODE_AGENT_NAME = "opencode";
    var convertOpenCodeTranscript = ({ session, rootSessionId, trajectoryId, extra }) => {
      const version = (0, json_guards_1.asNonEmptyString)(session.info["version"]);
      const { steps, subagentLinks, unconvertedMessageCount } = (0, build_opencode_steps_1.buildOpenCodeSteps)(session.messages, (0, opencode_tokens_1.tokenSemanticsForVersion)(version));
      const totals = (0, token_totals_1.sumStepTokens)(steps);
      const costUsd = steps.reduce((sum, step) => sum + (step.metrics?.cost_usd ?? 0), 0);
      const trajectory = (0, build_leaf_trajectory_1.buildLeafTrajectory)({
        sessionId: rootSessionId,
        trajectoryId,
        agentName: OPENCODE_AGENT_NAME,
        agentVersion: version ?? "unknown",
        steps,
        totals,
        totalCostUsd: costUsd,
        extra: {
          ...extra,
          ...unconvertedMessageCount > 0 ? { unconverted_message_count: unconvertedMessageCount } : {}
        }
      });
      const createdTimes = session.messages.flatMap(({ info }) => (0, message_time_1.messageTimeMs)(info, "created") ?? []);
      const endTimes = session.messages.flatMap(({ info }) => (0, message_time_1.messageTimeMs)(info, "completed") ?? (0, message_time_1.messageTimeMs)(info, "created") ?? []);
      return {
        trajectory,
        totals,
        costUsd,
        subagentLinks,
        startedAtMs: createdTimes.reduce((min, time) => min === null ? time : Math.min(min, time), null),
        endedAtMs: endTimes.reduce((max, time) => max === null ? time : Math.max(max, time), null)
      };
    };
    exports.convertOpenCodeTranscript = convertOpenCodeTranscript;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/resolve-session-title.js
var require_resolve_session_title = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/resolve-session-title.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveSessionTitle = void 0;
    var title_from_prompt_1 = require_title_from_prompt();
    var json_guards_1 = require_json_guards();
    var DEFAULT_TITLE_REGEX = /^(New session|Child session) - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    var resolveSessionTitle = (info, trajectory) => {
      const title = (0, json_guards_1.asNonEmptyString)(info["title"]);
      if (title && !DEFAULT_TITLE_REGEX.test(title)) {
        return title;
      }
      const firstPrompt = trajectory.steps.find((step) => step.source === "user" && step.extra?.["origin_kind"] === void 0 && step.extra?.["is_compact_summary"] !== true);
      return typeof firstPrompt?.message === "string" ? (0, title_from_prompt_1.titleFromPrompt)(firstPrompt.message) : null;
    };
    exports.resolveSessionTitle = resolveSessionTitle;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/convert-opencode-session.js
var require_convert_opencode_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/convert/convert-opencode-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertOpenCodeSession = void 0;
    var activity_stats_1 = require_activity_stats();
    var link_subagent_1 = require_link_subagent();
    var token_totals_1 = require_token_totals();
    var json_guards_1 = require_json_guards();
    var convert_opencode_transcript_1 = require_convert_opencode_transcript();
    var resolve_session_title_1 = require_resolve_session_title();
    var convertOpenCodeSession = (exported, { gitBranch, converterVersion }) => {
      const rootSessionId = (0, json_guards_1.asNonEmptyString)(exported.info["id"]) ?? "unknown";
      const main = (0, convert_opencode_transcript_1.convertOpenCodeTranscript)({
        session: exported,
        rootSessionId,
        trajectoryId: null,
        extra: {}
      });
      const children = exported.childSessions.map((child) => ({
        childSessionId: (0, json_guards_1.asNonEmptyString)(child.info["id"]) ?? "unknown",
        converted: convertChild(rootSessionId, child)
      }));
      linkChildren(rootSessionId, main, children);
      const all = [main, ...children.map(({ converted }) => converted)];
      const allTrajectories = all.map(({ trajectory }) => trajectory);
      const totals = all.map((c) => c.totals).reduce(token_totals_1.addTokenTotals);
      const totalCostUsd = all.reduce((sum, c) => sum + c.costUsd, 0);
      const reportedCostUsd = sumReportedCost([
        exported,
        ...exported.childSessions
      ]);
      const cwd = (0, json_guards_1.asNonEmptyString)(exported.info["directory"]);
      const title = (0, resolve_session_title_1.resolveSessionTitle)(exported.info, main.trajectory);
      const root = {
        ...main.trajectory,
        notes: `Converted from the OpenCode database by meticulous-agent-traces ${converterVersion}. final_metrics totals include every embedded subagent trajectory; total_steps counts root steps only.`,
        final_metrics: {
          total_prompt_tokens: totals.promptTokens,
          total_completion_tokens: totals.completionTokens,
          total_cached_tokens: totals.cachedTokens,
          total_cost_usd: totalCostUsd,
          total_steps: main.trajectory.steps.length,
          extra: {
            includes_subagent_trajectories: true,
            total_cache_creation_tokens: totals.cacheCreationTokens,
            total_steps_including_subagents: allTrajectories.reduce((sum, trajectory) => sum + trajectory.steps.length, 0)
          }
        },
        extra: {
          ...main.trajectory.extra,
          cwd,
          gitBranch,
          title,
          slug: (0, json_guards_1.asNonEmptyString)(exported.info["slug"]),
          opencode_agent: (0, json_guards_1.asNonEmptyString)(exported.info["agent"]),
          opencode_project_id: (0, json_guards_1.asNonEmptyString)(exported.info["projectID"]),
          ...exported.malformedRows.length > 0 ? { malformed_row_count: exported.malformedRows.length } : {}
        },
        ...children.length > 0 ? {
          subagent_trajectories: children.map(({ converted }) => converted.trajectory)
        } : {}
      };
      return {
        trajectory: root,
        stats: {
          cwd,
          gitBranch,
          gitBranches: gitBranch ? [gitBranch] : [],
          pullRequests: [],
          agentVersion: (0, json_guards_1.asNonEmptyString)(exported.info["version"]),
          entrypoint: null,
          permissionModes: [],
          title,
          models: (0, token_totals_1.countModels)(allTrajectories).map(([model]) => model),
          ...getTimeRange(all),
          stepCount: main.trajectory.steps.length,
          subagentCount: children.length,
          totals,
          reportedCostUsd,
          activity: (0, activity_stats_1.computeActivityStats)(root, allTrajectories)
        }
      };
    };
    exports.convertOpenCodeSession = convertOpenCodeSession;
    var convertChild = (rootSessionId, child) => {
      const childSessionId = (0, json_guards_1.asNonEmptyString)(child.info["id"]) ?? "unknown";
      return (0, convert_opencode_transcript_1.convertOpenCodeTranscript)({
        session: child,
        rootSessionId,
        trajectoryId: childSessionId,
        extra: {
          opencode_session_id: childSessionId,
          parent_session_id: (0, json_guards_1.asNonEmptyString)(child.info["parentID"]),
          agent_type: (0, json_guards_1.asNonEmptyString)(child.info["agent"]),
          title: (0, json_guards_1.asNonEmptyString)(child.info["title"])
        }
      });
    };
    var linkChildren = (rootSessionId, main, children) => {
      const childIds = new Set(children.map(({ childSessionId }) => childSessionId));
      const agentTypes = new Map(children.map(({ childSessionId, converted }) => [
        childSessionId,
        converted.trajectory.extra?.["agent_type"] ?? null
      ]));
      for (const parent of [main, ...children.map(({ converted }) => converted)]) {
        for (const { toolCallId, childSessionId } of parent.subagentLinks) {
          if (childIds.has(childSessionId)) {
            (0, link_subagent_1.linkSubagentToToolCall)([parent.trajectory], toolCallId, {
              trajectory_id: childSessionId,
              session_id: rootSessionId,
              extra: { agent_type: agentTypes.get(childSessionId) ?? null }
            });
          }
        }
      }
    };
    var sumReportedCost = (sessions) => {
      const costs = sessions.flatMap(({ info }) => (0, json_guards_1.asNumber)(info["cost"]) ?? []);
      return costs.length > 0 ? costs.reduce((a, b) => a + b, 0) : null;
    };
    var getTimeRange = (transcripts) => {
      const starts = transcripts.flatMap((t) => t.startedAtMs ?? []);
      const ends = transcripts.flatMap((t) => t.endedAtMs ?? []);
      return {
        startedAt: starts.length > 0 ? new Date(Math.min(...starts)).toISOString() : null,
        endedAt: ends.length > 0 ? new Date(Math.max(...ends)).toISOString() : null
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/format-opencode-export.js
var require_format_opencode_export = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/format-opencode-export.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatOpenCodeExport = void 0;
    var formatOpenCodeExport = (exported) => `${JSON.stringify(exported, null, 2)}
`;
    exports.formatOpenCodeExport = formatOpenCodeExport;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/opencode/strip-opencode-tool-outputs.js
var require_strip_opencode_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/opencode/strip-opencode-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripOpenCodeToolOutputs = void 0;
    var rewrite_raw_file_1 = require_rewrite_raw_file();
    var tool_output_filter_1 = require_tool_output_filter();
    var json_guards_1 = require_json_guards();
    var format_opencode_export_1 = require_format_opencode_export();
    var OUTPUT_KEYS = ["output", "error"];
    var DROPPED_KEYS = ["attachments"];
    var KEPT_METADATA_KEYS = ["sessionId"];
    var stripOpenCodeToolOutputs = (files, filter) => files.map((file) => (0, rewrite_raw_file_1.rewriteJsonFile)(file, (exported) => {
      const excluded = toolParts(exported).filter((part) => filter.isExcluded({
        names: [(0, json_guards_1.asNonEmptyString)(part["tool"])],
        callId: (0, json_guards_1.asNonEmptyString)(part["callID"]) ?? (0, json_guards_1.asNonEmptyString)(part["id"])
      }));
      excluded.forEach(stripPart);
      return excluded.length > 0;
    }, format_opencode_export_1.formatOpenCodeExport));
    exports.stripOpenCodeToolOutputs = stripOpenCodeToolOutputs;
    var stripPart = (part) => {
      const state = (0, json_guards_1.asRecord)(part["state"]);
      if (!state) {
        return;
      }
      for (const key of OUTPUT_KEYS) {
        if (key in state) {
          state[key] = tool_output_filter_1.EXCLUDED_TOOL_OUTPUT;
        }
      }
      for (const key of DROPPED_KEYS) {
        delete state[key];
      }
      const metadata = (0, json_guards_1.asRecord)(state["metadata"]);
      if (metadata) {
        state["metadata"] = Object.fromEntries(KEPT_METADATA_KEYS.filter((key) => key in metadata).map((key) => [
          key,
          metadata[key]
        ]));
      }
    };
    var toolParts = (exported) => {
      const root = (0, json_guards_1.asRecord)(exported);
      const sessions = [root, ...(0, json_guards_1.asArray)(root?.["childSessions"]) ?? []];
      return sessions.flatMap((session) => records((0, json_guards_1.asRecord)(session)?.["messages"]).flatMap((message) => records(message["parts"]).filter((part) => part["type"] === "tool")));
    };
    var records = (value) => ((0, json_guards_1.asArray)(value) ?? []).flatMap((item) => {
      const record2 = (0, json_guards_1.asRecord)(item);
      return record2 ? [record2] : [];
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/pi-usage.js
var require_pi_usage = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/pi-usage.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.piUsageToMetrics = exports.parsePiUsage = void 0;
    var json_guards_1 = require_json_guards();
    var parsePiUsage = (value) => {
      const usage = (0, json_guards_1.asRecord)(value);
      if (!usage) {
        return null;
      }
      return {
        input: (0, json_guards_1.asNumber)(usage["input"]) ?? 0,
        output: (0, json_guards_1.asNumber)(usage["output"]) ?? 0,
        cacheRead: (0, json_guards_1.asNumber)(usage["cacheRead"]) ?? 0,
        cacheWrite: (0, json_guards_1.asNumber)(usage["cacheWrite"]) ?? 0,
        cacheWrite1h: (0, json_guards_1.asNumber)(usage["cacheWrite1h"]),
        reasoning: (0, json_guards_1.asNumber)(usage["reasoning"]),
        costUsd: (0, json_guards_1.asNumber)((0, json_guards_1.asRecord)(usage["cost"])?.["total"])
      };
    };
    exports.parsePiUsage = parsePiUsage;
    var piUsageToMetrics = (usage) => ({
      prompt_tokens: usage.input + usage.cacheRead + usage.cacheWrite,
      completion_tokens: usage.output,
      cached_tokens: usage.cacheRead,
      ...usage.costUsd !== null ? { cost_usd: usage.costUsd } : {},
      extra: {
        input_tokens: usage.input,
        cache_creation_input_tokens: usage.cacheWrite,
        cache_read_input_tokens: usage.cacheRead,
        ...usage.cacheWrite1h !== null ? { cache_creation_1h_input_tokens: usage.cacheWrite1h } : {},
        ...usage.reasoning !== null ? { reasoning_tokens: usage.reasoning } : {}
      }
    });
    exports.piUsageToMetrics = piUsageToMetrics;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-agent-step.js
var require_build_pi_agent_step = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-agent-step.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildOrphanToolResultStep = exports.buildPiToolResult = exports.buildPiAgentStep = void 0;
    var truncate_observation_content_1 = require_truncate_observation_content();
    var pi_usage_1 = require_pi_usage();
    var buildPiAgentStep = (entry, message) => {
      const step = {
        step_id: 0,
        ...entry.timestamp ? { timestamp: entry.timestamp } : {},
        source: "agent",
        message: joinNonEmpty(message.texts),
        llm_call_count: 1
      };
      const reasoning = joinNonEmpty(message.reasoning);
      if (reasoning) {
        step.reasoning_content = reasoning;
      }
      const model = message.responseModel ?? message.model;
      if (model) {
        step.model_name = model;
      }
      if (message.thinkingLevel) {
        step.reasoning_effort = message.thinkingLevel;
      }
      if (message.toolCalls.length > 0) {
        step.tool_calls = message.toolCalls.map((call) => ({
          tool_call_id: call.id,
          function_name: call.name,
          arguments: call.arguments
        }));
      }
      if (message.usage) {
        step.metrics = (0, pi_usage_1.piUsageToMetrics)(message.usage);
      }
      step.extra = {
        entry_id: entry.id,
        ...message.provider ? { provider: message.provider } : {},
        ...message.api ? { api: message.api } : {},
        ...message.responseModel && message.model !== message.responseModel ? { requested_model: message.model } : {},
        ...message.responseId ? { response_id: message.responseId } : {},
        ...message.stopReason ? { stop_reason: message.stopReason } : {},
        ...message.errorMessage ? { error_message: message.errorMessage } : {},
        ...message.redactedThinkingCount > 0 ? { redacted_thinking_block_count: message.redactedThinkingCount } : {},
        ...message.otherBlockTypes.length > 0 ? { unconverted_block_types: message.otherBlockTypes } : {}
      };
      return step;
    };
    exports.buildPiAgentStep = buildPiAgentStep;
    var buildPiToolResult = (message) => {
      const { content, originalLength } = (0, truncate_observation_content_1.truncateObservationContent)(message.content.texts.join("\n"));
      return {
        content,
        extra: {
          is_error: message.isError,
          ...message.toolName ? { tool_name: message.toolName } : {},
          ...message.content.imageCount > 0 ? { image_count: message.content.imageCount } : {},
          ...message.usage ? { nested_metrics: (0, pi_usage_1.piUsageToMetrics)(message.usage) } : {},
          ...originalLength !== null ? { truncated: true, original_length_chars: originalLength } : {}
        }
      };
    };
    exports.buildPiToolResult = buildPiToolResult;
    var buildOrphanToolResultStep = (entry, message) => {
      const result = (0, exports.buildPiToolResult)(message);
      return {
        step_id: 0,
        ...entry.timestamp ? { timestamp: entry.timestamp } : {},
        source: "system",
        message: "",
        observation: {
          results: [
            {
              content: result.content,
              extra: { ...result.extra, orphan_tool_call_id: message.toolCallId }
            }
          ]
        }
      };
    };
    exports.buildOrphanToolResultStep = buildOrphanToolResultStep;
    var joinNonEmpty = (parts) => parts.filter((part) => part.length > 0).join("\n\n");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/describe-bash-execution.js
var require_describe_bash_execution = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/describe-bash-execution.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.describeBashExecution = void 0;
    var truncate_observation_content_1 = require_truncate_observation_content();
    var describeBashExecution = (message) => {
      const { content: output } = (0, truncate_observation_content_1.truncateObservationContent)(message.output);
      let text = `Ran \`${message.command}\`
`;
      text += output ? `\`\`\`
${output}
\`\`\`` : "(no output)";
      if (message.cancelled) {
        text += "\n\n(command cancelled)";
      } else if (message.exitCode !== null && message.exitCode !== 0) {
        text += `

Command exited with code ${message.exitCode}`;
      }
      if (message.truncated && message.fullOutputPath) {
        text += `

[Output truncated. Full output: ${message.fullOutputPath}]`;
      }
      return text;
    };
    exports.describeBashExecution = describeBashExecution;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-user-step.js
var require_build_pi_user_step = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-user-step.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildBashExecutionStep = exports.buildCustomMessageStep = exports.buildBranchSummaryStep = exports.buildCompactionSummaryStep = exports.buildPromptStep = void 0;
    var json_guards_1 = require_json_guards();
    var describe_bash_execution_1 = require_describe_bash_execution();
    var pi_usage_1 = require_pi_usage();
    var buildPiUserStep = (entry, message, extra) => ({
      step_id: 0,
      ...entry.timestamp ? { timestamp: entry.timestamp } : {},
      source: "user",
      message,
      extra: { entry_id: entry.id, ...extra }
    });
    var buildPromptStep = (entry, content) => content.texts.length > 0 || content.imageCount > 0 ? buildPiUserStep(entry, content.texts.join("\n\n"), {
      ...content.imageCount > 0 ? { image_count: content.imageCount } : {}
    }) : null;
    exports.buildPromptStep = buildPromptStep;
    var buildCompactionSummaryStep = (entry, summary, tokensBefore) => buildPiUserStep(entry, (0, json_guards_1.asString)(summary) ?? "", {
      is_compact_summary: true,
      tokens_before: (0, json_guards_1.asNumber)(tokensBefore),
      ...summaryUsageExtra(entry)
    });
    exports.buildCompactionSummaryStep = buildCompactionSummaryStep;
    var buildBranchSummaryStep = (entry, summary, fromId) => buildPiUserStep(entry, (0, json_guards_1.asString)(summary) ?? "", {
      origin_kind: "branch_summary",
      from_entry_id: (0, json_guards_1.asNonEmptyString)(fromId),
      ...summaryUsageExtra(entry)
    });
    exports.buildBranchSummaryStep = buildBranchSummaryStep;
    var buildCustomMessageStep = (entry, content, customType, display) => buildPiUserStep(entry, content.texts.join("\n\n"), {
      origin_kind: "custom_message",
      custom_type: customType,
      display
    });
    exports.buildCustomMessageStep = buildCustomMessageStep;
    var buildBashExecutionStep = (entry, message) => buildPiUserStep(entry, (0, describe_bash_execution_1.describeBashExecution)(message), {
      origin_kind: "bash_execution",
      exit_code: message.exitCode,
      ...message.excludeFromContext ? { exclude_from_context: true } : {}
    });
    exports.buildBashExecutionStep = buildBashExecutionStep;
    var summaryUsageExtra = (entry) => {
      const usage = (0, pi_usage_1.parsePiUsage)(entry.raw["usage"]);
      return usage ? { summary_metrics: (0, pi_usage_1.piUsageToMetrics)(usage) } : {};
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/parse-pi-message.js
var require_parse_pi_message = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/parse-pi-message.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseContent = exports.parsePiMessage = void 0;
    var json_guards_1 = require_json_guards();
    var pi_usage_1 = require_pi_usage();
    var parsePiMessage = (value) => {
      const message = (0, json_guards_1.asRecord)(value);
      const role = (0, json_guards_1.asString)(message?.["role"]);
      if (!message || role === null) {
        return null;
      }
      switch (role) {
        case "user":
          return { role, ...(0, exports.parseContent)(message["content"]) };
        case "assistant":
          return parseAssistant(message);
        case "toolResult":
          return {
            role,
            toolCallId: (0, json_guards_1.asNonEmptyString)(message["toolCallId"]),
            toolName: (0, json_guards_1.asNonEmptyString)(message["toolName"]),
            content: (0, exports.parseContent)(message["content"]),
            isError: message["isError"] === true,
            usage: (0, pi_usage_1.parsePiUsage)(message["usage"])
          };
        case "bashExecution":
          return {
            role,
            command: (0, json_guards_1.asString)(message["command"]) ?? "",
            output: (0, json_guards_1.asString)(message["output"]) ?? "",
            exitCode: (0, json_guards_1.asNumber)(message["exitCode"]),
            cancelled: message["cancelled"] === true,
            truncated: message["truncated"] === true,
            fullOutputPath: (0, json_guards_1.asNonEmptyString)(message["fullOutputPath"]),
            excludeFromContext: message["excludeFromContext"] === true
          };
        // Version 2 files call extension messages `hookMessage`.
        case "custom":
        case "hookMessage":
          return {
            role: "custom",
            customType: (0, json_guards_1.asNonEmptyString)(message["customType"]),
            display: message["display"] !== false,
            ...(0, exports.parseContent)(message["content"])
          };
        case "branchSummary":
          return {
            role,
            summary: (0, json_guards_1.asString)(message["summary"]) ?? "",
            fromId: (0, json_guards_1.asNonEmptyString)(message["fromId"])
          };
        case "compactionSummary":
          return {
            role,
            summary: (0, json_guards_1.asString)(message["summary"]) ?? "",
            tokensBefore: (0, json_guards_1.asNumber)(message["tokensBefore"])
          };
        case "system":
          return { role };
        default:
          return { role: "other", originalRole: role };
      }
    };
    exports.parsePiMessage = parsePiMessage;
    var parseContent = (value) => {
      const text = (0, json_guards_1.asString)(value);
      if (text !== null) {
        return { texts: [text], imageCount: 0 };
      }
      const content = { texts: [], imageCount: 0 };
      for (const block of (0, json_guards_1.asArray)(value) ?? []) {
        const record2 = (0, json_guards_1.asRecord)(block);
        if (record2?.["type"] === "text") {
          content.texts.push((0, json_guards_1.asString)(record2["text"]) ?? "");
        } else if (record2?.["type"] === "image") {
          content.imageCount++;
        }
      }
      return content;
    };
    exports.parseContent = parseContent;
    var parseAssistant = (message) => {
      const parsed = {
        role: "assistant",
        texts: [],
        reasoning: [],
        redactedThinkingCount: 0,
        toolCalls: [],
        otherBlockTypes: [],
        provider: (0, json_guards_1.asNonEmptyString)(message["provider"]),
        api: (0, json_guards_1.asNonEmptyString)(message["api"]),
        model: (0, json_guards_1.asNonEmptyString)(message["model"]),
        responseModel: (0, json_guards_1.asNonEmptyString)(message["responseModel"]),
        responseId: (0, json_guards_1.asNonEmptyString)(message["responseId"]),
        thinkingLevel: (0, json_guards_1.asNonEmptyString)(message["thinkingLevel"]),
        stopReason: (0, json_guards_1.asNonEmptyString)(message["stopReason"]),
        errorMessage: (0, json_guards_1.asNonEmptyString)(message["errorMessage"]),
        usage: (0, pi_usage_1.parsePiUsage)(message["usage"])
      };
      for (const block of (0, json_guards_1.asArray)(message["content"]) ?? []) {
        addAssistantBlock(parsed, (0, json_guards_1.asRecord)(block));
      }
      return parsed;
    };
    var addAssistantBlock = (parsed, block) => {
      const type = (0, json_guards_1.asString)(block?.["type"]);
      if (!block || type === null) {
        return;
      }
      const id = (0, json_guards_1.asNonEmptyString)(block["id"]);
      const name = (0, json_guards_1.asNonEmptyString)(block["name"]);
      if (type === "text") {
        parsed.texts.push((0, json_guards_1.asString)(block["text"]) ?? "");
      } else if (type === "thinking") {
        const thinking = (0, json_guards_1.asString)(block["thinking"]) ?? "";
        parsed.reasoning.push(thinking);
        if (block["redacted"] === true && !thinking) {
          parsed.redactedThinkingCount++;
        }
      } else if (type === "toolCall" && id && name) {
        parsed.toolCalls.push({
          id,
          name,
          arguments: (0, json_guards_1.asRecord)(block["arguments"]) ?? {}
        });
      } else if (!parsed.otherBlockTypes.includes(type)) {
        parsed.otherBlockTypes.push(type);
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-steps.js
var require_build_pi_steps = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-steps.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildPiSteps = void 0;
    var assert_never_1 = require_assert_never();
    var json_guards_1 = require_json_guards();
    var build_pi_agent_step_1 = require_build_pi_agent_step();
    var build_pi_user_step_1 = require_build_pi_user_step();
    var parse_pi_message_1 = require_parse_pi_message();
    var NON_CONVERSATION_ENTRY_TYPES = /* @__PURE__ */ new Set([
      "model_change",
      "thinking_level_change",
      "session_info",
      "label",
      "custom",
      "usage",
      "context_edit"
    ]);
    var buildPiSteps = (path) => {
      const context = {
        steps: [],
        stepsByToolCallId: /* @__PURE__ */ new Map(),
        unconvertedTypes: /* @__PURE__ */ new Set()
      };
      for (const entry of path) {
        addEntry(context, entry);
      }
      context.steps.forEach((step, index) => {
        step.step_id = index + 1;
      });
      return {
        steps: context.steps,
        unconvertedTypes: [...context.unconvertedTypes]
      };
    };
    exports.buildPiSteps = buildPiSteps;
    var addEntry = (context, entry) => {
      const { raw } = entry;
      switch (entry.type) {
        case "message": {
          const message = (0, parse_pi_message_1.parsePiMessage)(raw["message"]);
          if (message) {
            addMessage(context, entry, message);
          }
          return;
        }
        case "compaction":
          context.steps.push((0, build_pi_user_step_1.buildCompactionSummaryStep)(entry, raw["summary"], raw["tokensBefore"]));
          return;
        case "branch_summary":
          context.steps.push((0, build_pi_user_step_1.buildBranchSummaryStep)(entry, raw["summary"], raw["fromId"]));
          return;
        case "custom_message":
          context.steps.push((0, build_pi_user_step_1.buildCustomMessageStep)(entry, (0, parse_pi_message_1.parseContent)(raw["content"]), (0, json_guards_1.asNonEmptyString)(raw["customType"]), raw["display"] !== false));
          return;
        default:
          if (!NON_CONVERSATION_ENTRY_TYPES.has(entry.type)) {
            context.unconvertedTypes.add(entry.type);
          }
      }
    };
    var addMessage = (context, entry, message) => {
      const { steps } = context;
      switch (message.role) {
        case "user": {
          const step = (0, build_pi_user_step_1.buildPromptStep)(entry, message);
          if (step) {
            steps.push(step);
          }
          return;
        }
        case "assistant": {
          const step = (0, build_pi_agent_step_1.buildPiAgentStep)(entry, message);
          steps.push(step);
          for (const call of message.toolCalls) {
            context.stepsByToolCallId.set(call.id, step);
          }
          return;
        }
        case "toolResult":
          attachToolResult(context, entry, message);
          return;
        case "bashExecution":
          steps.push((0, build_pi_user_step_1.buildBashExecutionStep)(entry, message));
          return;
        case "custom":
          steps.push((0, build_pi_user_step_1.buildCustomMessageStep)(entry, message, message.customType, message.display));
          return;
        case "compactionSummary":
          steps.push((0, build_pi_user_step_1.buildCompactionSummaryStep)(entry, message.summary, message.tokensBefore));
          return;
        case "branchSummary":
          steps.push((0, build_pi_user_step_1.buildBranchSummaryStep)(entry, message.summary, message.fromId));
          return;
        case "system":
          return;
        case "other":
          context.unconvertedTypes.add(`message:${message.originalRole}`);
          return;
        default:
          (0, assert_never_1.assertNever)(message);
      }
    };
    var attachToolResult = (context, entry, message) => {
      const { toolCallId } = message;
      const step = toolCallId ? context.stepsByToolCallId.get(toolCallId) : void 0;
      if (!step || !toolCallId) {
        context.steps.push((0, build_pi_agent_step_1.buildOrphanToolResultStep)(entry, message));
        return;
      }
      step.observation ??= { results: [] };
      step.observation.results.push({
        source_call_id: toolCallId,
        ...(0, build_pi_agent_step_1.buildPiToolResult)(message)
      });
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/collect-pi-metadata.js
var require_collect_pi_metadata = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/collect-pi-metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.collectPiMetadata = void 0;
    var json_guards_1 = require_json_guards();
    var pi_usage_1 = require_pi_usage();
    var collectPiMetadata = ({ header, entries: entries2 }) => {
      const timestamps = [
        header?.timestamp ?? null,
        ...entries2.map((e) => e.timestamp)
      ].filter((t) => t !== null && !Number.isNaN(Date.parse(t))).sort();
      const latestSessionInfo = entries2.filter((entry) => entry.type === "session_info").at(-1);
      return {
        cwd: header?.cwd ?? null,
        name: (0, json_guards_1.asString)(latestSessionInfo?.raw["name"])?.trim() || null,
        startedAt: timestamps[0] ?? null,
        endedAt: timestamps.at(-1) ?? null,
        reportedCostUsd: sumReportedCost(entries2)
      };
    };
    exports.collectPiMetadata = collectPiMetadata;
    var sumReportedCost = (entries2) => {
      let total = null;
      for (const entry of entries2) {
        const cost = (0, pi_usage_1.parsePiUsage)(findUsage(entry))?.costUsd ?? null;
        if (cost !== null) {
          total = (total ?? 0) + cost;
        }
      }
      return total;
    };
    var findUsage = (entry) => {
      switch (entry.type) {
        case "usage":
        case "compaction":
        case "branch_summary":
          return entry.raw["usage"];
        case "message": {
          const message = (0, json_guards_1.asRecord)(entry.raw["message"]);
          const role = message?.["role"];
          return role === "assistant" || role === "toolResult" ? message?.["usage"] : null;
        }
        default:
          return null;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/select-active-branch.js
var require_select_active_branch = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/select-active-branch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.selectActiveBranch = void 0;
    var selectActiveBranch = (entries2) => {
      const byId = new Map(entries2.map((entry) => [entry.id, entry]));
      const path = [];
      const onPath = /* @__PURE__ */ new Set();
      let current = entries2.at(-1);
      while (current && !onPath.has(current.id)) {
        path.push(current);
        onPath.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : void 0;
      }
      path.reverse();
      const parentIds = new Set(entries2.map((entry) => entry.parentId));
      const abandoned = entries2.filter((entry) => !onPath.has(entry.id));
      return {
        path,
        abandonedEntryCount: abandoned.length,
        abandonedBranchCount: abandoned.filter((entry) => !parentIds.has(entry.id)).length
      };
    };
    exports.selectActiveBranch = selectActiveBranch;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/convert-pi-session.js
var require_convert_pi_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/convert-pi-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertPiSession = void 0;
    var atif_types_1 = require_atif_types();
    var activity_stats_1 = require_activity_stats();
    var title_from_prompt_1 = require_title_from_prompt();
    var token_totals_1 = require_token_totals();
    var build_pi_steps_1 = require_build_pi_steps();
    var collect_pi_metadata_1 = require_collect_pi_metadata();
    var select_active_branch_1 = require_select_active_branch();
    var PI_AGENT_NAME = "pi";
    var convertPiSession = ({ sessionId, parsed, gitBranch }, converterVersion) => {
      const metadata = (0, collect_pi_metadata_1.collectPiMetadata)(parsed);
      const branch = (0, select_active_branch_1.selectActiveBranch)(parsed.entries);
      const { steps, unconvertedTypes } = (0, build_pi_steps_1.buildPiSteps)(branch.path);
      const totals = (0, token_totals_1.sumStepTokens)(steps);
      const firstPrompt = steps.find((step) => step.source === "user" && step.extra?.["origin_kind"] === void 0);
      const title = metadata.name ?? (0, title_from_prompt_1.titleFromPrompt)(typeof firstPrompt?.message === "string" ? firstPrompt.message : null);
      const header = parsed.header;
      const trajectory = {
        schema_version: atif_types_1.ATIF_SCHEMA_VERSION,
        session_id: sessionId,
        agent: { name: PI_AGENT_NAME, version: "unknown" },
        steps,
        notes: `Converted from a Pi session file by meticulous-agent-traces ${converterVersion}. Only the active branch is converted; abandoned branches remain in the raw upload. Token totals cover assistant messages on the active branch, while pi_reported_cost_usd mirrors Pi's own session stats (every branch, plus compaction, branch-summary and tool usage). Pi does not record its version.`,
        final_metrics: {
          total_prompt_tokens: totals.promptTokens,
          total_completion_tokens: totals.completionTokens,
          total_cached_tokens: totals.cachedTokens,
          total_steps: steps.length,
          extra: {
            total_cache_creation_tokens: totals.cacheCreationTokens,
            ...metadata.reportedCostUsd !== null ? { pi_reported_cost_usd: metadata.reportedCostUsd } : {}
          }
        },
        extra: {
          cwd: metadata.cwd,
          gitBranch,
          title,
          pi_session_version: header?.version ?? null,
          ...header?.id && header.id !== sessionId ? { header_session_id: header.id } : {},
          ...header?.parentSession ? { parent_session: header.parentSession } : {},
          abandoned_entry_count: branch.abandonedEntryCount,
          abandoned_branch_count: branch.abandonedBranchCount,
          ...unconvertedTypes.length > 0 ? { unconverted_entry_types: unconvertedTypes } : {},
          ...parsed.malformedLineCount > 0 ? { malformed_line_count: parsed.malformedLineCount } : {}
        }
      };
      const models = (0, token_totals_1.countModels)([trajectory]).map(([model]) => model);
      if (models[0]) {
        trajectory.agent.model_name = models[0];
      }
      return {
        trajectory,
        stats: {
          cwd: metadata.cwd,
          gitBranch,
          gitBranches: gitBranch ? [gitBranch] : [],
          pullRequests: [],
          agentVersion: null,
          entrypoint: null,
          permissionModes: [],
          title,
          models,
          startedAt: metadata.startedAt,
          endedAt: metadata.endedAt,
          stepCount: steps.length,
          subagentCount: 0,
          totals,
          reportedCostUsd: metadata.reportedCostUsd,
          activity: (0, activity_stats_1.computeActivityStats)(trajectory, [trajectory])
        }
      };
    };
    exports.convertPiSession = convertPiSession;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/parse-pi-session.js
var require_parse_pi_session = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/parse-pi-session.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parsePiSession = void 0;
    var json_guards_1 = require_json_guards();
    var parsePiSession = (text) => {
      const lines = text.split("\n").filter((line) => line.trim());
      const parsed = {
        header: null,
        entries: [],
        malformedLineCount: 0
      };
      for (const [index, rawLine] of lines.entries()) {
        const line = parseJsonLine(rawLine);
        if (!line) {
          parsed.malformedLineCount++;
          continue;
        }
        if (line["type"] === "session" && !parsed.header) {
          parsed.header = toHeader(line);
          continue;
        }
        parsed.entries.push(toEntry(line, index, parsed.entries.at(-1)));
      }
      return parsed;
    };
    exports.parsePiSession = parsePiSession;
    var toEntry = (line, index, previous) => {
      const id = (0, json_guards_1.asNonEmptyString)(line["id"]);
      return {
        type: (0, json_guards_1.asString)(line["type"]) ?? "",
        id: id ?? `line-${index + 1}`,
        parentId: id ? (0, json_guards_1.asNonEmptyString)(line["parentId"]) : previous?.id ?? null,
        timestamp: (0, json_guards_1.asNonEmptyString)(line["timestamp"]),
        raw: line
      };
    };
    var toHeader = (line) => ({
      id: (0, json_guards_1.asNonEmptyString)(line["id"]),
      version: (0, json_guards_1.asNumber)(line["version"]) ?? 1,
      cwd: (0, json_guards_1.asNonEmptyString)(line["cwd"]),
      timestamp: (0, json_guards_1.asNonEmptyString)(line["timestamp"]),
      parentSession: (0, json_guards_1.asNonEmptyString)(line["parentSession"])
    });
    var parseJsonLine = (rawLine) => {
      try {
        const parsed = (0, json_guards_1.asRecord)(JSON.parse(rawLine));
        return parsed && (0, json_guards_1.asString)(parsed["type"]) !== null ? parsed : null;
      } catch {
        return null;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-payload.js
var require_build_pi_payload = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/build-pi-payload.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildPiPayload = void 0;
    var read_git_branch_1 = require_read_git_branch();
    var convert_pi_session_1 = require_convert_pi_session();
    var parse_pi_session_1 = require_parse_pi_session();
    var buildPiPayload = ({ sessionId, projectDirName, file }, converterVersion) => {
      const parsed = (0, parse_pi_session_1.parsePiSession)(file.content);
      const { trajectory, stats } = (0, convert_pi_session_1.convertPiSession)({
        sessionId,
        parsed,
        // Pi doesn't record the branch, so this is the one checked out at upload time.
        gitBranch: (0, read_git_branch_1.readGitBranch)(parsed.header?.cwd ?? null)
      }, converterVersion);
      return {
        envelope: {
          envelopeVersion: 1,
          agent: "pi",
          sessionId,
          projectDirName,
          files: [file]
        },
        trajectory,
        stats
      };
    };
    exports.buildPiPayload = buildPiPayload;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/pi/strip-pi-tool-outputs.js
var require_strip_pi_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/pi/strip-pi-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripPiToolOutputs = void 0;
    var rewrite_raw_file_1 = require_rewrite_raw_file();
    var tool_output_filter_1 = require_tool_output_filter();
    var json_guards_1 = require_json_guards();
    var KEPT_RESULT_KEYS = /* @__PURE__ */ new Set([
      "role",
      "toolCallId",
      "toolName",
      "isError",
      "timestamp",
      "usage"
    ]);
    var stripPiToolOutputs = (files, filter) => files.map((file) => (0, rewrite_raw_file_1.rewriteJsonLinesFile)(file, (line) => {
      const message = (0, json_guards_1.asRecord)((0, json_guards_1.asRecord)(line)?.["message"]);
      if (message?.["role"] !== "toolResult" || !filter.isExcluded({
        names: [(0, json_guards_1.asNonEmptyString)(message["toolName"])],
        callId: (0, json_guards_1.asNonEmptyString)(message["toolCallId"])
      })) {
        return false;
      }
      (0, rewrite_raw_file_1.keepOnly)(message, KEPT_RESULT_KEYS, {
        content: [{ type: "text", text: tool_output_filter_1.EXCLUDED_TOOL_OUTPUT }]
      });
      return true;
    }));
    exports.stripPiToolOutputs = stripPiToolOutputs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/hook-events/parse-spooled-event.js
var require_parse_spooled_event = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/hook-events/parse-spooled-event.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readSpooledEventSessionId = exports.parseSpooledEvent = void 0;
    var constants_1 = require_constants();
    var json_guards_1 = require_json_guards();
    var parseSpooledEvent = (text) => {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return null;
      }
      const record2 = (0, json_guards_1.asRecord)(parsed);
      const event = (0, json_guards_1.asNonEmptyString)(record2?.["event"]);
      if (!record2 || !event) {
        return null;
      }
      return {
        event,
        projectDir: (0, json_guards_1.asNonEmptyString)(record2["projectDir"]),
        cwd: (0, json_guards_1.asNonEmptyString)(record2["cwd"]),
        payload: (0, json_guards_1.asRecord)(record2["payload"])
      };
    };
    exports.parseSpooledEvent = parseSpooledEvent;
    var readSpooledEventSessionId = (text, sessionIdField) => {
      const fallbackRegex = new RegExp(`"${sessionIdField}"\\s*:\\s*"([A-Za-z0-9_-]{1,128})"`);
      const sessionId = (0, json_guards_1.asNonEmptyString)((0, exports.parseSpooledEvent)(text)?.payload?.[sessionIdField]) ?? fallbackRegex.exec(text)?.[1] ?? null;
      return sessionId && constants_1.AGENT_TRACE_SESSION_ID_REGEX.test(sessionId) ? sessionId : null;
    };
    exports.readSpooledEventSessionId = readSpooledEventSessionId;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/detect-environment.js
var require_detect_environment = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/detect-environment.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectEnvironment = exports.ENVIRONMENT_ID_ENV_VAR = exports.ENVIRONMENT_ENV_VAR = void 0;
    exports.ENVIRONMENT_ENV_VAR = "METICULOUS_AGENT_TRACES_ENVIRONMENT";
    exports.ENVIRONMENT_ID_ENV_VAR = "METICULOUS_AGENT_TRACES_ENVIRONMENT_ID";
    var detectEnvironment = (env) => {
      const override = env[exports.ENVIRONMENT_ENV_VAR]?.trim();
      if (override) {
        return {
          environment: override,
          environmentId: env[exports.ENVIRONMENT_ID_ENV_VAR]?.trim() || null
        };
      }
      if (env["CLAUDE_CODE_REMOTE"] === "true") {
        return detected("claude-code-web", env["CLAUDE_CODE_REMOTE_SESSION_ID"]);
      }
      if (env["CONDUCTOR_WORKSPACE_ID"]) {
        return detected(env["CONDUCTOR_IS_LOCAL"] === "0" ? "conductor-cloud" : "conductor-local", env["CONDUCTOR_WORKSPACE_ID"]);
      }
      if (env["CURSOR_AGENT_SOCKET"]) {
        return detected("cursor-cloud", void 0);
      }
      if (env["GITHUB_ACTIONS"] === "true") {
        return detected("github-actions", env["GITHUB_RUN_ID"]);
      }
      if (env["CI"] && env["CI"] !== "false" && env["CI"] !== "0") {
        return detected("ci", void 0);
      }
      return detected("local", void 0);
    };
    exports.detectEnvironment = detectEnvironment;
    var detected = (environment, environmentId) => ({
      environment,
      environmentId: environmentId || null
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/parse-git-config.js
var require_parse_git_config = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/parse-git-config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLastGitConfigValue = exports.parseGitConfig = void 0;
    var SECTION_REGEX = /^\[\s*([A-Za-z0-9.-]+)(?:\s+"((?:[^"\\]|\\.)*)")?\s*\]/;
    var KEY_REGEX = /^([A-Za-z][A-Za-z0-9-]*)\s*(?:=(.*))?$/;
    var parseGitConfig = (text) => {
      const entries2 = [];
      let section = null;
      let subsection = null;
      for (const line of joinContinuations(text)) {
        let rest = line.trim();
        const sectionMatch = SECTION_REGEX.exec(rest);
        if (sectionMatch) {
          ({ section, subsection } = parseSectionHeader(sectionMatch[1] ?? "", sectionMatch[2]));
          rest = rest.slice(sectionMatch[0].length).trim();
        }
        if (!rest || rest.startsWith("#") || rest.startsWith(";") || !section) {
          continue;
        }
        const keyMatch = KEY_REGEX.exec(rest);
        if (!keyMatch) {
          continue;
        }
        entries2.push({
          section,
          subsection,
          key: (keyMatch[1] ?? "").toLowerCase(),
          value: keyMatch[2] === void 0 ? "true" : parseValue(keyMatch[2])
        });
      }
      return entries2;
    };
    exports.parseGitConfig = parseGitConfig;
    var getLastGitConfigValue = (entries2, section, subsection, key) => {
      for (let i = entries2.length - 1; i >= 0; i--) {
        const entry = entries2[i];
        if (entry && entry.section === section && entry.subsection === subsection && entry.key === key) {
          return entry.value;
        }
      }
      return null;
    };
    exports.getLastGitConfigValue = getLastGitConfigValue;
    var parseSectionHeader = (name, quotedSubsection) => {
      if (quotedSubsection !== void 0) {
        return {
          section: name.toLowerCase(),
          subsection: quotedSubsection.replace(/\\(.)/g, "$1")
        };
      }
      const dot = name.indexOf(".");
      if (dot === -1) {
        return { section: name.toLowerCase(), subsection: null };
      }
      return {
        section: name.slice(0, dot).toLowerCase(),
        subsection: name.slice(dot + 1).toLowerCase()
      };
    };
    var parseValue = (raw) => {
      let result = "";
      let inQuotes = false;
      for (let i = 0; i < raw.length; i++) {
        const char = raw[i];
        if (char === "\\" && i + 1 < raw.length) {
          const next = raw[++i];
          result += next === "n" ? "\n" : next === "t" ? "	" : next ?? "";
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === "#" || char === ";") && !inQuotes) {
          break;
        } else {
          result += char;
        }
      }
      return result.trim();
    };
    var joinContinuations = (text) => {
      const lines = [];
      let pending = "";
      for (const line of text.split(/\r?\n/)) {
        if (/(^|[^\\])(\\\\)*\\$/.test(line)) {
          pending += line.slice(0, -1);
          continue;
        }
        lines.push(pending + line);
        pending = "";
      }
      if (pending) {
        lines.push(pending);
      }
      return lines;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/read-git-config.js
var require_read_git_config = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/read-git-config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readGitConfig = void 0;
    var os_1 = __require("os");
    var path_1 = __require("path");
    var find_git_dirs_1 = require_find_git_dirs();
    var parse_git_config_1 = require_parse_git_config();
    var MAX_INCLUDE_DEPTH = 10;
    var readGitConfig = (path, gitDirs, depth = 0) => {
      const text = (0, find_git_dirs_1.readTextOrNull)(path);
      if (text === null || depth > MAX_INCLUDE_DEPTH) {
        return [];
      }
      return (0, parse_git_config_1.parseGitConfig)(text).flatMap((entry) => {
        const includePath = getIncludePath(entry, gitDirs, (0, path_1.dirname)(path));
        return includePath ? (0, exports.readGitConfig)(includePath, gitDirs, depth + 1) : [entry];
      });
    };
    exports.readGitConfig = readGitConfig;
    var matchesGitDirCondition = (condition, gitDirs, configDir) => {
      const match = /^gitdir(\/i)?:(.+)$/.exec(condition);
      if (!match?.[2]) {
        return false;
      }
      const regex = gitDirPatternToRegex(match[2], configDir, !!match[1]);
      return gitDirs.some((gitDir) => regex.test(`${gitDir}/`));
    };
    var getIncludePath = (entry, gitDirs, configDir) => {
      if (entry.key !== "path") {
        return null;
      }
      const isInclude = entry.section === "include" && entry.subsection === null;
      const isMatchingIncludeIf = entry.section === "includeif" && entry.subsection !== null && matchesGitDirCondition(entry.subsection, gitDirs, configDir);
      if (!isInclude && !isMatchingIncludeIf) {
        return null;
      }
      const expanded = expandHome(entry.value);
      return (0, path_1.isAbsolute)(expanded) ? expanded : (0, path_1.resolve)(configDir, expanded);
    };
    var gitDirPatternToRegex = (rawPattern, configDir, caseInsensitive) => {
      let pattern = expandHome(rawPattern);
      if (pattern.startsWith("./")) {
        pattern = (0, path_1.join)(configDir, pattern.slice(2));
      } else if (!(0, path_1.isAbsolute)(pattern)) {
        pattern = `**/${pattern}`;
      }
      if (pattern.endsWith("/")) {
        pattern += "**";
      }
      const source = pattern.split(/(\*\*\/|\*\*|\*|\?)/).map((part) => {
        switch (part) {
          case "**/":
            return "(?:.*/)?";
          case "**":
            return ".*";
          case "*":
            return "[^/]*";
          case "?":
            return "[^/]";
          default:
            return part.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        }
      }).join("");
      return new RegExp(`^${source}/?$`, caseInsensitive ? "i" : "");
    };
    var expandHome = (path) => path === "~" || path.startsWith("~/") ? (0, path_1.join)((0, os_1.homedir)(), path.slice(1)) : path;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/strip-url-credentials.js
var require_strip_url_credentials = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/strip-url-credentials.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripUrlCredentials = void 0;
    var stripUrlCredentials = (remoteUrl) => {
      const trimmed = remoteUrl.trim();
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
        return trimmed;
      }
      try {
        const url = new URL(trimmed);
        if (url.protocol === "ssh:" || url.protocol === "git+ssh:") {
          url.password = "";
        } else {
          url.username = "";
          url.password = "";
        }
        return url.toString();
      } catch {
        return trimmed.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/@]*@/i, "$1");
      }
    };
    exports.stripUrlCredentials = stripUrlCredentials;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/identity/resolve-identity.js
var require_resolve_identity = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/identity/resolve-identity.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createIdentityResolver = void 0;
    var os_1 = __require("os");
    var path_1 = __require("path");
    var detect_environment_1 = require_detect_environment();
    var find_git_dirs_1 = require_find_git_dirs();
    var normalize_git_remote_url_1 = require_normalize_git_remote_url();
    var parse_git_config_1 = require_parse_git_config();
    var read_git_config_1 = require_read_git_config();
    var strip_url_credentials_1 = require_strip_url_credentials();
    var createIdentityResolver = () => {
      const cache = /* @__PURE__ */ new Map();
      return (cwd) => {
        const key = cwd ?? "";
        const cached = cache.get(key);
        if (cached) {
          return cached;
        }
        const identity2 = resolveIdentity(cwd);
        cache.set(key, identity2);
        return identity2;
      };
    };
    exports.createIdentityResolver = createIdentityResolver;
    var resolveIdentity = (cwd) => {
      const gitDirs = cwd ? (0, find_git_dirs_1.findGitDirs)(cwd) : null;
      const conditionDirs = gitDirs ? [gitDirs.gitDir, gitDirs.commonDir] : [];
      const repoEntries = gitDirs ? [
        ...(0, read_git_config_1.readGitConfig)((0, path_1.join)(gitDirs.commonDir, "config"), conditionDirs),
        ...(0, read_git_config_1.readGitConfig)((0, path_1.join)(gitDirs.gitDir, "config.worktree"), conditionDirs)
      ] : [];
      const remoteUrl = (0, parse_git_config_1.getLastGitConfigValue)(repoEntries, "remote", "origin", "url");
      return {
        userEmail: resolveUserEmail(repoEntries, conditionDirs),
        gitRemoteUrl: remoteUrl ? (0, strip_url_credentials_1.stripUrlCredentials)(remoteUrl) : null,
        gitRepository: remoteUrl ? (0, normalize_git_remote_url_1.normalizeGitRemoteUrl)(remoteUrl) : null,
        osUsername: safely(() => (0, os_1.userInfo)().username),
        hostname: safely(() => (0, os_1.hostname)()),
        platform: process.platform,
        osRelease: safely(() => (0, os_1.release)()),
        timeZone: safely(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
        ...(0, detect_environment_1.detectEnvironment)(process.env)
      };
    };
    var resolveUserEmail = (repoEntries, conditionDirs) => {
      const xdgConfigHome = process.env["XDG_CONFIG_HOME"] || (0, path_1.join)((0, os_1.homedir)(), ".config");
      const candidates = [
        () => repoEntries,
        () => (0, read_git_config_1.readGitConfig)((0, path_1.join)((0, os_1.homedir)(), ".gitconfig"), conditionDirs),
        () => (0, read_git_config_1.readGitConfig)((0, path_1.join)(xdgConfigHome, "git", "config"), conditionDirs)
      ];
      for (const readEntries of candidates) {
        const email = (0, parse_git_config_1.getLastGitConfigValue)(readEntries(), "user", null, "email");
        if (email) {
          return email;
        }
      }
      return null;
    };
    var safely = (read) => {
      try {
        return read() || null;
      } catch {
        return null;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/redact/secret-patterns.js
var require_secret_patterns = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/redact/secret-patterns.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SECRET_PATTERNS = void 0;
    var VALUE = String.raw`[A-Za-z0-9_\-./+=]`;
    var marker = (name) => `[REDACTED:${name}]`;
    var token = (name, source) => ({
      name,
      regex: new RegExp(source, "g"),
      replacement: marker(name)
    });
    exports.SECRET_PATTERNS = [
      token("private-key", String.raw`-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----`),
      token("meticulous-ingest-token", String.raw`\batit-[A-Za-z0-9_-]{16,}`),
      token("meticulous-api-token", String.raw`\bprat-[A-Za-z0-9_-]{16,}`),
      token("conductor-token", String.raw`\bcond[a-z]?_[A-Za-z0-9_-]{20,}`),
      // GitHub App installation tokens are `ghs_<appId>_<jwt>` (~520 chars, with
      // `.`, `_`, and `-`). Match the whole token before the jwt rule so the
      // `ghs_<appId>_` prefix is not left behind.
      token("github-token", String.raw`\b(?:gh[pousr]_[A-Za-z0-9._-]{30,}|github_pat_[A-Za-z0-9_]{22,})`),
      token("anthropic-key", String.raw`\bsk-ant-[A-Za-z0-9_-]{20,}`),
      token("openai-key", String.raw`\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}`),
      token("aws-access-key-id", String.raw`\b(?:AKIA|ASIA)[0-9A-Z]{16}\b`),
      token("slack-token", String.raw`\bxox[abprs]-[A-Za-z0-9-]{10,}`),
      token("google-api-key", String.raw`\bAIza[0-9A-Za-z_-]{35}`),
      token("stripe-key", String.raw`\b[rs]k_live_[0-9A-Za-z]{20,}`),
      token("npm-token", String.raw`\bnpm_[A-Za-z0-9]{36}`),
      token("jwt", String.raw`\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`),
      {
        name: "url-password",
        regex: new RegExp(String.raw`(?<prefix>\b[a-z][a-z0-9+.-]*://[^\s:/@"\\]+:)[^\s@/"\\]{3,}(?=@)`, "g"),
        replacement: `$<prefix>${marker("password")}`
      },
      {
        name: "secret-assignment",
        regex: new RegExp(String.raw`(?<prefix>\b[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY|ACCESS_KEY|_AUTH)\b(?:\\?")?\s*[=:]\s*(?:\\?")?)${VALUE}{8,}`, "g"),
        replacement: `$<prefix>${marker("secret")}`
      }
    ];
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/redact/redact-secrets.js
var require_redact_secrets = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/redact/redact-secrets.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.redactSecrets = void 0;
    var secret_patterns_1 = require_secret_patterns();
    var redactSecrets = (text) => secret_patterns_1.SECRET_PATTERNS.reduce((redacted, { regex, replacement }) => redacted.replace(regex, (...args) => isAlreadyRedacted(args) ? String(args[0]) : expand(replacement, args)), text);
    exports.redactSecrets = redactSecrets;
    var isAlreadyRedacted = (args) => String(args[0]).includes("[REDACTED:");
    var expand = (replacement, args) => {
      const last = args.at(-1);
      const groups = typeof last === "object" && last !== null ? last : {};
      return replacement.replace(/\$<(\w+)>/g, (_, name) => groups[name] ?? "");
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/strip-atif-tool-outputs.js
var require_strip_atif_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/strip-atif-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripAtifToolOutputs = exports.collectExcludedCallIds = void 0;
    var json_guards_1 = require_json_guards();
    var tool_output_filter_1 = require_tool_output_filter();
    var ORPHAN_CALL_ID_KEYS = ["orphan_tool_use_id", "orphan_tool_call_id"];
    var DROPPED_RESULT_EXTRA_KEYS = /* @__PURE__ */ new Set([
      "truncated",
      "original_length_chars",
      "image_count",
      "attachment_count"
    ]);
    var collectExcludedCallIds = (trajectory, regexes) => {
      const callIds = /* @__PURE__ */ new Set();
      for (const step of allSteps(trajectory)) {
        for (const call of step.tool_calls ?? []) {
          const names2 = [
            call.function_name,
            (0, json_guards_1.asNonEmptyString)(call.extra?.["hook_tool_name"])
          ];
          if (names2.some((name) => !!name && (0, tool_output_filter_1.matchesAny)(regexes, name))) {
            callIds.add(call.tool_call_id);
          }
        }
      }
      return callIds;
    };
    exports.collectExcludedCallIds = collectExcludedCallIds;
    var stripAtifToolOutputs = (trajectory, filter) => ({
      ...trajectory,
      steps: trajectory.steps.map((step) => stripStep(step, filter)),
      ...trajectory.subagent_trajectories ? {
        subagent_trajectories: trajectory.subagent_trajectories.map((subagent) => (0, exports.stripAtifToolOutputs)(subagent, filter))
      } : {}
    });
    exports.stripAtifToolOutputs = stripAtifToolOutputs;
    var stripStep = (step, filter) => step.observation ? {
      ...step,
      observation: {
        ...step.observation,
        results: step.observation.results.map((result) => stripResult(result, filter))
      }
    } : step;
    var stripResult = (result, filter) => {
      const extra = result.extra ?? {};
      const callId = result.source_call_id ?? ORPHAN_CALL_ID_KEYS.map((key) => (0, json_guards_1.asNonEmptyString)(extra[key])).find((id) => id !== null) ?? null;
      if (!filter.isExcluded({
        callId,
        names: [(0, json_guards_1.asNonEmptyString)(extra["tool_name"])]
      })) {
        return result;
      }
      return {
        ...result,
        content: tool_output_filter_1.EXCLUDED_TOOL_OUTPUT,
        extra: {
          ...Object.fromEntries(Object.entries(extra).filter(([key]) => !DROPPED_RESULT_EXTRA_KEYS.has(key))),
          tool_output_excluded: true
        }
      };
    };
    var allSteps = (trajectory) => [
      ...trajectory.steps,
      ...(trajectory.subagent_trajectories ?? []).flatMap(allSteps)
    ];
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/strip-atif-raw-files.js
var require_strip_atif_raw_files = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/strip-atif-raw-files.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripAtifRawFiles = void 0;
    var validate_atif_trajectory_1 = require_validate_atif_trajectory();
    var rewrite_raw_file_1 = require_rewrite_raw_file();
    var strip_atif_tool_outputs_1 = require_strip_atif_tool_outputs();
    var stripAtifRawFiles = (files, filter) => files.map((file) => (0, rewrite_raw_file_1.rewriteJsonFile)(file, (value) => {
      const { trajectory } = (0, validate_atif_trajectory_1.validateAtifTrajectory)(value);
      if (!trajectory) {
        return false;
      }
      const before = JSON.stringify(trajectory);
      Object.assign(trajectory, (0, strip_atif_tool_outputs_1.stripAtifToolOutputs)(trajectory, filter));
      return JSON.stringify(trajectory) !== before;
    }));
    exports.stripAtifRawFiles = stripAtifRawFiles;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/tool-output-strippers.js
var require_tool_output_strippers = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/tool-output-strippers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TOOL_OUTPUT_STRIPPERS = void 0;
    var strip_claude_code_tool_outputs_1 = require_strip_claude_code_tool_outputs();
    var strip_codex_tool_outputs_1 = require_strip_codex_tool_outputs();
    var strip_cursor_tool_outputs_1 = require_strip_cursor_tool_outputs();
    var strip_devin_tool_outputs_1 = require_strip_devin_tool_outputs();
    var strip_opencode_tool_outputs_1 = require_strip_opencode_tool_outputs();
    var strip_pi_tool_outputs_1 = require_strip_pi_tool_outputs();
    var strip_atif_raw_files_1 = require_strip_atif_raw_files();
    exports.TOOL_OUTPUT_STRIPPERS = {
      "claude-code": strip_claude_code_tool_outputs_1.stripClaudeCodeToolOutputs,
      devin: strip_devin_tool_outputs_1.stripDevinToolOutputs,
      pi: strip_pi_tool_outputs_1.stripPiToolOutputs,
      opencode: strip_opencode_tool_outputs_1.stripOpenCodeToolOutputs,
      codex: strip_codex_tool_outputs_1.stripCodexToolOutputs,
      cursor: strip_cursor_tool_outputs_1.stripCursorToolOutputs,
      other: strip_atif_raw_files_1.stripAtifRawFiles
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/exclude-tool-outputs.js
var require_exclude_tool_outputs = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/tool-output-exclusion/exclude-tool-outputs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.excludeToolOutputs = void 0;
    var strip_atif_tool_outputs_1 = require_strip_atif_tool_outputs();
    var strip_atif_raw_files_1 = require_strip_atif_raw_files();
    var tool_output_filter_1 = require_tool_output_filter();
    var tool_output_strippers_1 = require_tool_output_strippers();
    var excludeToolOutputs = (payload, regexes) => {
      if (regexes.length === 0) {
        return payload;
      }
      const filter = (0, tool_output_filter_1.createToolOutputFilter)(regexes, (0, strip_atif_tool_outputs_1.collectExcludedCallIds)(payload.trajectory, regexes));
      const { envelope } = payload;
      const stripRawFiles = envelope.rawFormat === "atif" ? strip_atif_raw_files_1.stripAtifRawFiles : tool_output_strippers_1.TOOL_OUTPUT_STRIPPERS[envelope.agent];
      return {
        ...payload,
        trajectory: (0, strip_atif_tool_outputs_1.stripAtifToolOutputs)(payload.trajectory, filter),
        envelope: {
          ...envelope,
          files: stripRawFiles(envelope.files, filter)
        }
      };
    };
    exports.excludeToolOutputs = excludeToolOutputs;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/file-trace-agents.js
var require_file_trace_agents = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/file-trace-agents.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FILE_TRACE_AGENTS = void 0;
    var constants_1 = require_constants();
    exports.FILE_TRACE_AGENTS = constants_1.AGENT_TRACE_AGENTS.filter((agent) => agent !== "devin");
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/stat-trace-file.js
var require_stat_trace_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/stat-trace-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toTraceFile = exports.statTraceFile = exports.statOrNull = void 0;
    var promises_1 = __require("fs/promises");
    var statOrNull = async (path) => {
      try {
        return await (0, promises_1.stat)(path);
      } catch {
        return null;
      }
    };
    exports.statOrNull = statOrNull;
    var statTraceFile = async (path) => {
      const stats = await (0, exports.statOrNull)(path);
      return stats?.isFile() ? (0, exports.toTraceFile)(path, stats, false) : null;
    };
    exports.statTraceFile = statTraceFile;
    var toTraceFile = async (path, stats, explicit) => ({
      path,
      realPath: await (0, promises_1.realpath)(path),
      explicit,
      sizeBytes: stats.size,
      mtimeMs: stats.mtimeMs
    });
    exports.toTraceFile = toTraceFile;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/collect-trace-files.js
var require_collect_trace_files = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/collect-trace-files.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.collectTraceFiles = exports.MAX_TRACE_FILE_BYTES = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var stat_trace_file_1 = require_stat_trace_file();
    exports.MAX_TRACE_FILE_BYTES = 256 * 1024 * 1024;
    var TRACE_FILE_EXTENSIONS = /* @__PURE__ */ new Set([".jsonl", ".json", ".txt"]);
    var SKIPPED_DIR_NAMES = /* @__PURE__ */ new Set(["node_modules", ".git"]);
    var collectTraceFiles = async (paths) => {
      const collector = new TraceFileCollector();
      for (const input of paths) {
        const path = (0, path_1.resolve)(input);
        const stats = await (0, stat_trace_file_1.statOrNull)(path);
        if (!stats) {
          collector.skip(path, "not found");
        } else if (stats.isDirectory()) {
          await collector.crawl(path);
        } else if (stats.isFile()) {
          await collector.add(path, stats, true);
        } else {
          collector.skip(path, "not a file or directory");
        }
      }
      return { files: [...collector.files.values()], skipped: collector.skipped };
    };
    exports.collectTraceFiles = collectTraceFiles;
    var TraceFileCollector = class {
      files = /* @__PURE__ */ new Map();
      skipped = [];
      skip(path, reason) {
        this.skipped.push({ path, reason });
      }
      async crawl(dir) {
        let entries2;
        try {
          entries2 = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        } catch (error) {
          this.skip(dir, `unreadable: ${String(error)}`);
          return;
        }
        entries2.sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of entries2) {
          const path = (0, path_1.join)(dir, entry.name);
          if (entry.isDirectory()) {
            if (!SKIPPED_DIR_NAMES.has(entry.name)) {
              await this.crawl(path);
            }
            continue;
          }
          if (!TRACE_FILE_EXTENSIONS.has((0, path_1.extname)(entry.name))) {
            continue;
          }
          const stats = await (0, stat_trace_file_1.statOrNull)(path);
          if (stats?.isFile()) {
            await this.add(path, stats, false);
          }
        }
      }
      async add(path, stats, explicit) {
        if (stats.size > exports.MAX_TRACE_FILE_BYTES) {
          this.skip(path, `larger than ${exports.MAX_TRACE_FILE_BYTES} bytes`);
          return;
        }
        const file = await (0, stat_trace_file_1.toTraceFile)(path, stats, explicit);
        const existing = this.files.get(file.realPath);
        if (existing) {
          existing.explicit ||= explicit;
          return;
        }
        this.files.set(file.realPath, file);
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/read-head-lines.js
var require_read_head_lines = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/read-head-lines.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readHeadLines = void 0;
    var promises_1 = __require("fs/promises");
    var CHUNK_BYTES = 64 * 1024;
    var readHeadLines = async (path, maxLines, maxBytes) => {
      const handle = await (0, promises_1.open)(path, "r");
      try {
        const chunks = [];
        let total = 0;
        let newlines = 0;
        let reachedEnd = false;
        while (total < maxBytes && newlines < maxLines) {
          const chunk = Buffer.alloc(Math.min(CHUNK_BYTES, maxBytes - total));
          const { bytesRead } = await handle.read(chunk, 0, chunk.length, total);
          if (bytesRead === 0) {
            reachedEnd = true;
            break;
          }
          const data = chunk.subarray(0, bytesRead);
          chunks.push(data);
          total += bytesRead;
          newlines += data.filter((byte) => byte === 10).length;
        }
        const lines = Buffer.concat(chunks).toString("utf8").split("\n");
        if (!reachedEnd) {
          lines.pop();
        }
        return lines.slice(0, maxLines);
      } finally {
        await handle.close();
      }
    };
    exports.readHeadLines = readHeadLines;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/claude-code-file-names.js
var require_claude_code_file_names = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/claude-code-file-names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.claudeCodeSubagentMetaName = exports.isClaudeCodeSubagentMetaName = exports.CLAUDE_CODE_SUBAGENT_META_REGEX = exports.CLAUDE_CODE_SUBAGENT_JSONL_REGEX = void 0;
    var path_1 = __require("path");
    exports.CLAUDE_CODE_SUBAGENT_JSONL_REGEX = /^agent-([A-Za-z0-9_-]+)\.jsonl$/;
    exports.CLAUDE_CODE_SUBAGENT_META_REGEX = /^agent-([A-Za-z0-9_-]+)\.meta\.json$/;
    var isClaudeCodeSubagentMetaName = (path) => exports.CLAUDE_CODE_SUBAGENT_META_REGEX.test((0, path_1.basename)(path));
    exports.isClaudeCodeSubagentMetaName = isClaudeCodeSubagentMetaName;
    var claudeCodeSubagentMetaName = (agentId) => `agent-${agentId}.meta.json`;
    exports.claudeCodeSubagentMetaName = claudeCodeSubagentMetaName;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/sniff-trace-content.js
var require_sniff_trace_content = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/sniff-trace-content.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCursorTextTranscript = exports.sniffJsonFormat = exports.sniffJsonlFormat = void 0;
    var json_guards_1 = require_json_guards();
    var sniffJsonlFormat = (records) => {
      if (isCodexRollout(records)) {
        return "codex";
      }
      if (isPiSession(records)) {
        return "pi";
      }
      if (isCursorJsonlTranscript(records)) {
        return "cursor";
      }
      return isClaudeCodeTranscript(records) ? "claude-code" : null;
    };
    exports.sniffJsonlFormat = sniffJsonlFormat;
    var sniffJsonFormat = (value) => {
      if (isAtifDocument(value)) {
        return "atif";
      }
      return isOpenCodeExport(value) ? "opencode" : null;
    };
    exports.sniffJsonFormat = sniffJsonFormat;
    var isCursorTextTranscript = (text) => /^user:\s*$/m.test(text) && text.includes("<user_query>");
    exports.isCursorTextTranscript = isCursorTextTranscript;
    var isCodexRollout = ([first]) => first?.["type"] === "session_meta" && !!(0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(first["payload"])?.["id"]);
    var isPiSession = ([first]) => first?.["type"] === "session" && !!(0, json_guards_1.asNonEmptyString)(first["id"]) && !("payload" in first);
    var CURSOR_MARKER_TYPES = /* @__PURE__ */ new Set(["metadata", "turn_ended"]);
    var isCursorJsonlTranscript = (records) => {
      const messages = records.filter((record2) => !CURSOR_MARKER_TYPES.has(record2["type"]));
      return messages.length > 0 && messages.every((record2) => typeof record2["role"] === "string" && !("type" in record2));
    };
    var CLAUDE_CODE_ID_KEYS = ["sessionId", "uuid", "leafUuid"];
    var isClaudeCodeTranscript = (records) => records.every((record2) => !("role" in record2)) && records.some((record2) => typeof record2["type"] === "string" && CLAUDE_CODE_ID_KEYS.some((key) => typeof record2[key] === "string"));
    var isAtifDocument = (value) => {
      const record2 = (0, json_guards_1.asRecord)(value);
      return !!(0, json_guards_1.asNonEmptyString)(record2?.["schema_version"])?.startsWith("ATIF-") && (0, json_guards_1.asRecord)(record2?.["agent"]) !== null && (0, json_guards_1.asArray)(record2?.["steps"]) !== null;
    };
    var isOpenCodeExport = (value) => {
      const record2 = (0, json_guards_1.asRecord)(value);
      return !!(0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(record2?.["info"])?.["id"])?.startsWith("ses_") && (0, json_guards_1.asArray)(record2?.["messages"]) !== null;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/detect-json-file.js
var require_detect_json_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/detect-json-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectJsonFile = void 0;
    var assert_never_1 = require_assert_never();
    var json_guards_1 = require_json_guards();
    var claude_code_file_names_1 = require_claude_code_file_names();
    var sniff_trace_content_1 = require_sniff_trace_content();
    var detectJsonFile = (file, value, agentOverride) => {
      const record2 = (0, json_guards_1.asRecord)(value);
      if ((0, claude_code_file_names_1.isClaudeCodeSubagentMetaName)(file.path) && (!agentOverride || agentOverride === "claude-code")) {
        return record2 ? { ...file, format: "claude-code-subagent-meta" } : null;
      }
      const format = agentOverride ? jsonFormatOf(agentOverride) : (0, sniff_trace_content_1.sniffJsonFormat)(value);
      switch (format) {
        case null:
          return null;
        case "atif":
          return {
            ...file,
            format,
            sessionId: (0, json_guards_1.asNonEmptyString)(record2?.["session_id"]),
            agentName: (0, json_guards_1.asNonEmptyString)((0, json_guards_1.asRecord)(record2?.["agent"])?.["name"])
          };
        case "opencode": {
          const info = (0, json_guards_1.asRecord)(record2?.["info"]);
          return {
            ...file,
            format,
            id: (0, json_guards_1.asNonEmptyString)(info?.["id"]),
            parentId: (0, json_guards_1.asNonEmptyString)(info?.["parentID"])
          };
        }
        default:
          return (0, assert_never_1.assertNever)(format);
      }
    };
    exports.detectJsonFile = detectJsonFile;
    var jsonFormatOf = (agent) => {
      switch (agent) {
        case "opencode":
          return "opencode";
        case "other":
          return "atif";
        case "claude-code":
        case "codex":
        case "pi":
        case "cursor":
          return null;
        default:
          return (0, assert_never_1.assertNever)(agent);
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/detect-jsonl-file.js
var require_detect_jsonl_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/detect-jsonl-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectJsonlFile = void 0;
    var parse_rollout_line_1 = require_parse_rollout_line();
    var assert_never_1 = require_assert_never();
    var json_guards_1 = require_json_guards();
    var sniff_trace_content_1 = require_sniff_trace_content();
    var detectJsonlFile = (file, headLines, agentOverride) => {
      const records = headLines.flatMap(parseRecord);
      const format = agentOverride ? jsonlFormatOf(agentOverride) : (0, sniff_trace_content_1.sniffJsonlFormat)(records);
      switch (format) {
        case null:
          return null;
        case "codex":
          return {
            ...file,
            format,
            meta: (0, parse_rollout_line_1.parseSessionMetaLine)(headLines.find((line) => parseRecord(line).length > 0) ?? null)
          };
        case "pi":
          return {
            ...file,
            format,
            headerId: records[0]?.["type"] === "session" ? (0, json_guards_1.asNonEmptyString)(records[0]["id"]) : null
          };
        case "cursor":
          return { ...file, format };
        case "claude-code":
          return {
            ...file,
            format,
            sessionId: firstString(records, "sessionId"),
            agentId: firstString(records, "agentId"),
            isSidechain: records.some((record2) => record2["isSidechain"] === true)
          };
        default:
          return (0, assert_never_1.assertNever)(format);
      }
    };
    exports.detectJsonlFile = detectJsonlFile;
    var jsonlFormatOf = (agent) => {
      switch (agent) {
        case "claude-code":
        case "codex":
        case "pi":
        case "cursor":
          return agent;
        case "opencode":
        case "other":
          return null;
        default:
          return (0, assert_never_1.assertNever)(agent);
      }
    };
    var parseRecord = (line) => {
      if (!line.trim()) {
        return [];
      }
      try {
        const record2 = (0, json_guards_1.asRecord)(JSON.parse(line));
        return record2 ? [record2] : [];
      } catch {
        return [];
      }
    };
    var firstString = (records, key) => records.map((record2) => (0, json_guards_1.asNonEmptyString)(record2[key])).find(Boolean) ?? null;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/detect-trace-file.js
var require_detect_trace_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/detect/detect-trace-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectTraceFile = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var read_head_lines_1 = require_read_head_lines();
    var detect_json_file_1 = require_detect_json_file();
    var detect_jsonl_file_1 = require_detect_jsonl_file();
    var sniff_trace_content_1 = require_sniff_trace_content();
    var HEAD_LINES = 20;
    var HEAD_BYTES2 = 4 * 1024 * 1024;
    var TEXT_HEAD_BYTES = 64 * 1024;
    var detectTraceFile = async (file, agentOverride) => {
      switch ((0, path_1.extname)(file.path)) {
        case ".jsonl":
          return (0, detect_jsonl_file_1.detectJsonlFile)(file, await (0, read_head_lines_1.readHeadLines)(file.path, HEAD_LINES, HEAD_BYTES2), agentOverride);
        case ".json":
          return (0, detect_json_file_1.detectJsonFile)(file, parseJson(await (0, promises_1.readFile)(file.path, "utf8")), agentOverride);
        case ".txt": {
          if (agentOverride && agentOverride !== "cursor") {
            return null;
          }
          const head = await (0, read_head_lines_1.readHeadLines)(file.path, Infinity, TEXT_HEAD_BYTES);
          return agentOverride || (0, sniff_trace_content_1.isCursorTextTranscript)(head.join("\n")) ? { ...file, format: "cursor" } : null;
        }
        default:
          return null;
      }
    };
    exports.detectTraceFile = detectTraceFile;
    var parseJson = (text) => {
      try {
        return JSON.parse(text);
      } catch {
        return void 0;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/session-id.js
var require_session_id = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/session-id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fileStem = exports.isValidSessionId = exports.resolveSessionId = void 0;
    var path_1 = __require("path");
    var constants_1 = require_constants();
    var MAX_SESSION_ID_LENGTH = 128;
    var resolveSessionId = (candidates) => {
      const present = candidates.filter((c) => !!c);
      return present.find((c) => constants_1.AGENT_TRACE_SESSION_ID_REGEX.test(c)) ?? present.map(sanitizeSessionId).find((c) => c !== null) ?? null;
    };
    exports.resolveSessionId = resolveSessionId;
    var isValidSessionId = (value) => !!value && constants_1.AGENT_TRACE_SESSION_ID_REGEX.test(value);
    exports.isValidSessionId = isValidSessionId;
    var fileStem = (path) => (0, path_1.basename)(path, (0, path_1.extname)(path));
    exports.fileStem = fileStem;
    var sanitizeSessionId = (value) => {
      const sanitized = value.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, MAX_SESSION_ID_LENGTH);
      return /[A-Za-z0-9]/.test(sanitized) ? sanitized : null;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/keep-latest.js
var require_keep_latest = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/keep-latest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.keepLatestPerKey = void 0;
    var keepLatestPerKey = (items, keyOf, fileOf, skipped) => {
      const latest = /* @__PURE__ */ new Map();
      for (const item of items) {
        const key = keyOf(item);
        const existing = latest.get(key);
        if (!existing) {
          latest.set(key, item);
          continue;
        }
        const [kept, dropped] = fileOf(item).mtimeMs > fileOf(existing).mtimeMs ? [item, existing] : [existing, item];
        latest.set(key, kept);
        skipped.push({
          path: fileOf(dropped).path,
          reason: `session ${key} is also in ${fileOf(kept).path}, which is newer`
        });
      }
      return [...latest.values()];
    };
    exports.keepLatestPerKey = keepLatestPerKey;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/atif/resolve-atif-agent.js
var require_resolve_atif_agent = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/atif/resolve-atif-agent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveAtifAgent = void 0;
    var constants_1 = require_constants();
    var AGENT_NAME_ALIASES = {
      claude: "claude-code",
      "codex-cli": "codex",
      "cursor-agent": "cursor",
      "open-code": "opencode"
    };
    var resolveAtifAgent = (agentName) => {
      const normalised = (agentName ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-");
      if ((0, constants_1.isAgentTraceAgent)(normalised)) {
        return normalised;
      }
      return AGENT_NAME_ALIASES[normalised] ?? "other";
    };
    exports.resolveAtifAgent = resolveAtifAgent;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/atif/group-atif-sessions.js
var require_group_atif_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/atif/group-atif-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupAtifSessions = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var stats_from_atif_1 = require_stats_from_atif();
    var validate_atif_trajectory_1 = require_validate_atif_trajectory();
    var session_id_1 = require_session_id();
    var keep_latest_1 = require_keep_latest();
    var resolve_atif_agent_1 = require_resolve_atif_agent();
    var groupAtifSessions = (files, { agentOverride }) => {
      const skipped = [];
      const identified = files.flatMap((file) => {
        const sessionId = (0, session_id_1.resolveSessionId)([file.sessionId, (0, session_id_1.fileStem)(file.path)]);
        if (!sessionId) {
          skipped.push({ path: file.path, reason: "has no usable session id" });
          return [];
        }
        const agent = agentOverride === "other" ? "other" : (0, resolve_atif_agent_1.resolveAtifAgent)(file.agentName);
        return [{ agent, sessionId, file }];
      });
      const sessions = (0, keep_latest_1.keepLatestPerKey)(identified, ({ agent, sessionId }) => `${agent}/${sessionId}`, ({ file }) => file, skipped).map(({ agent, sessionId, file }) => ({
        agent,
        sessionId,
        sourcePaths: [file.path],
        prepare: () => prepareAtifPayload(agent, sessionId, file)
      }));
      return { sessions, skipped };
    };
    exports.groupAtifSessions = groupAtifSessions;
    var prepareAtifPayload = async (agent, sessionId, file) => {
      const content = await (0, promises_1.readFile)(file.path, "utf8");
      const { trajectory, error } = (0, validate_atif_trajectory_1.validateAtifTrajectory)(JSON.parse(content));
      if (!trajectory) {
        throw new Error(`${file.path} isn't a valid ATIF trajectory: ${error}`);
      }
      return {
        envelope: {
          envelopeVersion: 1,
          agent,
          sessionId,
          projectDirName: null,
          rawFormat: "atif",
          files: [
            {
              relativePath: (0, path_1.basename)(file.path),
              mtimeMs: file.mtimeMs,
              sizeBytes: Buffer.byteLength(content),
              content
            }
          ]
        },
        trajectory,
        stats: (0, stats_from_atif_1.statsFromAtif)(trajectory)
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/read-trace-file.js
var require_read_trace_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/collect/read-trace-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTraceFile = void 0;
    var promises_1 = __require("fs/promises");
    var readTraceFile = async (file, relativePath) => {
      const buffer = await (0, promises_1.readFile)(file.path);
      return {
        relativePath,
        mtimeMs: file.mtimeMs,
        sizeBytes: buffer.length,
        content: buffer.toString("utf8")
      };
    };
    exports.readTraceFile = readTraceFile;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/claude-code/classify-claude-code-file.js
var require_classify_claude_code_file = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/claude-code/classify-claude-code-file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.classifyClaudeCodeFile = void 0;
    var path_1 = __require("path");
    var claude_code_file_names_1 = require_claude_code_file_names();
    var session_id_1 = require_session_id();
    var classifyClaudeCodeFile = (file) => {
      const subagentDir = (0, path_1.dirname)(file.path);
      const pathAgentId = claude_code_file_names_1.CLAUDE_CODE_SUBAGENT_JSONL_REGEX.exec((0, path_1.basename)(file.path))?.[1];
      if (pathAgentId && (0, path_1.basename)(subagentDir) === "subagents") {
        const parentSessionId = (0, path_1.basename)((0, path_1.dirname)(subagentDir));
        return {
          kind: "subagent",
          parentSessionId: (0, session_id_1.isValidSessionId)(parentSessionId) ? parentSessionId : file.sessionId,
          agentId: pathAgentId
        };
      }
      if (file.isSidechain && file.agentId) {
        return {
          kind: "subagent",
          parentSessionId: file.sessionId,
          agentId: file.agentId
        };
      }
      const stem = (0, session_id_1.fileStem)(file.path);
      const sessionId = (0, session_id_1.isValidSessionId)(stem) ? stem : (0, session_id_1.isValidSessionId)(file.sessionId) ? file.sessionId : null;
      return sessionId ? { kind: "main", sessionId } : { kind: "unidentified" };
    };
    exports.classifyClaudeCodeFile = classifyClaudeCodeFile;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/claude-code/find-claude-code-subagents.js
var require_find_claude_code_subagents = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/claude-code/find-claude-code-subagents.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findSubagentMeta = exports.findClaudeCodeSubagentsOnDisk = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var stat_trace_file_1 = require_stat_trace_file();
    var claude_code_file_names_1 = require_claude_code_file_names();
    var session_id_1 = require_session_id();
    var findClaudeCodeSubagentsOnDisk = async (mainPath) => {
      const dir = (0, path_1.join)((0, path_1.dirname)(mainPath), (0, session_id_1.fileStem)(mainPath), "subagents");
      let names2;
      try {
        names2 = (await (0, promises_1.readdir)(dir)).sort();
      } catch {
        return [];
      }
      const subagents = [];
      for (const name of names2) {
        const agentId = claude_code_file_names_1.CLAUDE_CODE_SUBAGENT_JSONL_REGEX.exec(name)?.[1];
        const jsonl = agentId ? await (0, stat_trace_file_1.statTraceFile)((0, path_1.join)(dir, name)) : null;
        if (agentId && jsonl) {
          subagents.push({
            agentId,
            jsonl,
            meta: await (0, exports.findSubagentMeta)(jsonl.path, agentId)
          });
        }
      }
      return subagents;
    };
    exports.findClaudeCodeSubagentsOnDisk = findClaudeCodeSubagentsOnDisk;
    var findSubagentMeta = async (jsonlPath, agentId) => (0, path_1.basename)(jsonlPath) === `agent-${agentId}.jsonl` ? (0, stat_trace_file_1.statTraceFile)((0, path_1.join)((0, path_1.dirname)(jsonlPath), (0, claude_code_file_names_1.claudeCodeSubagentMetaName)(agentId))) : null;
    exports.findSubagentMeta = findSubagentMeta;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/claude-code/group-claude-code-sessions.js
var require_group_claude_code_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/claude-code/group-claude-code-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupClaudeCodeSessions = void 0;
    var path_1 = __require("path");
    var build_claude_code_payload_1 = require_build_claude_code_payload();
    var assert_never_1 = require_assert_never();
    var claude_code_file_names_1 = require_claude_code_file_names();
    var read_trace_file_1 = require_read_trace_file();
    var keep_latest_1 = require_keep_latest();
    var classify_claude_code_file_1 = require_classify_claude_code_file();
    var find_claude_code_subagents_1 = require_find_claude_code_subagents();
    var groupClaudeCodeSessions = async (files, metaFiles, { converterVersion }) => {
      const skipped = [];
      const { mains, looseSubagents } = classifyFiles(files, skipped);
      const subagentsBySession = /* @__PURE__ */ new Map();
      for (const main of mains) {
        subagentsBySession.set(main.sessionId, await (0, find_claude_code_subagents_1.findClaudeCodeSubagentsOnDisk)(main.file.path));
      }
      for (const loose of looseSubagents) {
        await attachLooseSubagent(loose, subagentsBySession, skipped);
      }
      const usedPaths = new Set([...subagentsBySession.values()].flat().flatMap(({ jsonl, meta }) => meta ? [jsonl, meta] : [jsonl]).map((file) => file.realPath));
      for (const meta of metaFiles) {
        if (meta.explicit && !usedPaths.has(meta.realPath)) {
          skipped.push({
            path: meta.path,
            reason: "describes a subagent whose transcript wasn't found"
          });
        }
      }
      const sessions = mains.map((main) => toSession(main, subagentsBySession.get(main.sessionId) ?? [], converterVersion));
      return { sessions, skipped };
    };
    exports.groupClaudeCodeSessions = groupClaudeCodeSessions;
    var classifyFiles = (files, skipped) => {
      const mains = [];
      const looseSubagents = [];
      for (const file of files) {
        const role = (0, classify_claude_code_file_1.classifyClaudeCodeFile)(file);
        switch (role.kind) {
          case "main":
            mains.push({ sessionId: role.sessionId, file });
            break;
          case "subagent":
            looseSubagents.push({ ...role, file });
            break;
          case "unidentified":
            skipped.push({ path: file.path, reason: "has no session id" });
            break;
          default:
            (0, assert_never_1.assertNever)(role);
        }
      }
      return {
        mains: (0, keep_latest_1.keepLatestPerKey)(mains, ({ sessionId }) => sessionId, ({ file }) => file, skipped),
        looseSubagents
      };
    };
    var attachLooseSubagent = async ({ parentSessionId, agentId, file }, subagentsBySession, skipped) => {
      const siblings = parentSessionId ? subagentsBySession.get(parentSessionId) : void 0;
      if (!siblings) {
        skipped.push({
          path: file.path,
          reason: `subagent of session ${parentSessionId ?? "(unknown)"}, whose main transcript wasn't given`
        });
        return;
      }
      if (siblings.some((subagent) => subagent.agentId === agentId)) {
        return;
      }
      siblings.push({
        agentId,
        jsonl: file,
        meta: await (0, find_claude_code_subagents_1.findSubagentMeta)(file.path, agentId)
      });
    };
    var toSession = ({ sessionId, file }, subagents, converterVersion) => ({
      agent: "claude-code",
      sessionId,
      sourcePaths: [
        file.path,
        ...subagents.flatMap(({ jsonl, meta }) => meta ? [jsonl.path, meta.path] : [jsonl.path])
      ],
      prepare: async () => {
        const subagentDir = (0, path_1.join)(sessionId, "subagents");
        return (0, build_claude_code_payload_1.buildClaudeCodePayload)({
          sessionId,
          projectDirName: (0, path_1.basename)((0, path_1.dirname)(file.path)),
          main: await (0, read_trace_file_1.readTraceFile)(file, (0, path_1.basename)(file.path)),
          subagents: await Promise.all(subagents.map(async ({ agentId, jsonl, meta }) => ({
            agentId,
            jsonl: await (0, read_trace_file_1.readTraceFile)(jsonl, (0, path_1.join)(subagentDir, `agent-${agentId}.jsonl`)),
            meta: meta ? await (0, read_trace_file_1.readTraceFile)(meta, (0, path_1.join)(subagentDir, (0, claude_code_file_names_1.claudeCodeSubagentMetaName)(agentId))) : null
          })))
        }, converterVersion);
      }
    });
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/codex/find-codex-home.js
var require_find_codex_home = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/codex/find-codex-home.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.relativeToCodexHome = exports.findCodexHome = void 0;
    var path_1 = __require("path");
    var codex_home_layout_1 = require_codex_home_layout();
    var stat_trace_file_1 = require_stat_trace_file();
    var findCodexHome = async (rolloutPath) => {
      if (!rolloutPath) {
        return null;
      }
      for (let dir = (0, path_1.dirname)(rolloutPath); ; dir = (0, path_1.dirname)(dir)) {
        for (const rolloutDir of codex_home_layout_1.CODEX_ROLLOUT_DIRS) {
          if ((await (0, stat_trace_file_1.statOrNull)((0, path_1.join)(dir, rolloutDir)))?.isDirectory()) {
            return dir;
          }
        }
        if ((0, path_1.dirname)(dir) === dir) {
          return null;
        }
      }
    };
    exports.findCodexHome = findCodexHome;
    var relativeToCodexHome = (codexHome, path) => codexHome && path.startsWith(`${codexHome}${path_1.sep}`) ? (0, path_1.relative)(codexHome, path) : (0, path_1.basename)(path);
    exports.relativeToCodexHome = relativeToCodexHome;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/codex/group-codex-sessions.js
var require_group_codex_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/codex/group-codex-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupCodexSessions = void 0;
    var path_1 = __require("path");
    var build_codex_payload_1 = require_build_codex_payload();
    var read_codex_thread_name_1 = require_read_codex_thread_name();
    var rollout_file_name_1 = require_rollout_file_name();
    var read_trace_file_1 = require_read_trace_file();
    var session_id_1 = require_session_id();
    var find_codex_home_1 = require_find_codex_home();
    var groupCodexSessions = async (files, { converterVersion }) => {
      const skipped = [];
      const threads = groupThreads(files, skipped);
      const members = /* @__PURE__ */ new Map();
      for (const thread of threads.values()) {
        const rootId = findRootId(thread.threadId, threads);
        members.set(rootId, [...members.get(rootId) ?? [], thread]);
      }
      const sessions = [];
      for (const [rootId, sessionThreads] of members) {
        const root = threads.get(rootId);
        if (!root || !(0, session_id_1.isValidSessionId)(rootId)) {
          skipped.push(...sessionThreads.flatMap(({ rollouts }) => rollouts.map(({ file }) => ({
            path: file.path,
            reason: `thread id ${rootId} isn't a valid session id`
          }))));
          continue;
        }
        const subagents = sessionThreads.filter((thread) => thread !== root).sort((a, b) => a.threadId.localeCompare(b.threadId));
        sessions.push(await toSession(rootId, root, subagents, converterVersion));
      }
      return { sessions, skipped };
    };
    exports.groupCodexSessions = groupCodexSessions;
    var toSession = async (sessionId, root, subagents, converterVersion) => {
      const codexHome = await (0, find_codex_home_1.findCodexHome)(root.rollouts[0]?.file.path ?? null);
      const readThread = async ({ threadId, rollouts }) => ({
        threadId,
        files: await Promise.all(rollouts.map(({ file }) => (0, read_trace_file_1.readTraceFile)(file, (0, find_codex_home_1.relativeToCodexHome)(codexHome, file.path))))
      });
      return {
        agent: "codex",
        sessionId,
        sourcePaths: [root, ...subagents].flatMap(({ rollouts }) => rollouts.map(({ file }) => file.path)),
        prepare: async () => (0, build_codex_payload_1.buildCodexPayload)({
          sessionId,
          root: await readThread(root),
          subagents: await Promise.all(subagents.map(readThread)),
          threadName: codexHome ? await (0, read_codex_thread_name_1.readCodexThreadName)(codexHome, sessionId) : null
        }, converterVersion)
      };
    };
    var groupThreads = (files, skipped) => {
      const threads = /* @__PURE__ */ new Map();
      const seenRolloutIds = /* @__PURE__ */ new Set();
      for (const file of files) {
        const name = (0, rollout_file_name_1.parseRolloutFileName)((0, path_1.basename)(file.path));
        const threadId = file.meta?.threadId ?? name?.threadId ?? null;
        if (!threadId) {
          skipped.push({ path: file.path, reason: "has no Codex thread id" });
          continue;
        }
        const rolloutId = name?.threadId === threadId ? name.rolloutId : threadId;
        if (seenRolloutIds.has(rolloutId)) {
          skipped.push({
            path: file.path,
            reason: `another file holds rollout ${rolloutId}`
          });
          continue;
        }
        seenRolloutIds.add(rolloutId);
        const thread = threads.get(threadId) ?? {
          threadId,
          rollouts: [],
          parentId: null
        };
        thread.rollouts.push({ file, rolloutId, timestamp: name?.timestamp ?? "" });
        threads.set(threadId, thread);
      }
      for (const thread of threads.values()) {
        thread.rollouts.sort(compareRollouts(thread.threadId));
        thread.parentId = parentIdOf(thread);
      }
      return threads;
    };
    var compareRollouts = (threadId) => (a, b) => a.timestamp.localeCompare(b.timestamp) || Number(a.rolloutId !== threadId) - Number(b.rolloutId !== threadId) || a.rolloutId.localeCompare(b.rolloutId);
    var parentIdOf = ({ threadId, rollouts }) => {
      const meta = rollouts[0]?.file.meta;
      return meta?.sessionId && meta.sessionId !== threadId ? meta.sessionId : meta?.parentThreadId ?? null;
    };
    var findRootId = (threadId, threads) => {
      const seen = /* @__PURE__ */ new Set([threadId]);
      let current = threadId;
      for (; ; ) {
        const parentId = threads.get(current)?.parentId;
        if (!parentId || !threads.has(parentId) || seen.has(parentId)) {
          return current;
        }
        seen.add(parentId);
        current = parentId;
      }
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/cursor/cursor-transcript-layout.js
var require_cursor_transcript_layout = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/cursor/cursor-transcript-layout.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findCursorSubagentsOnDisk = exports.cursorRelativePath = exports.cursorProjectDirOf = exports.subagentParentIdOf = exports.isNestedTranscript = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var stat_trace_file_1 = require_stat_trace_file();
    var session_id_1 = require_session_id();
    var TRANSCRIPTS_DIR_NAME = "agent-transcripts";
    var TRANSCRIPT_EXTENSIONS = [".jsonl", ".txt"];
    var isNestedTranscript = (path) => (0, path_1.basename)((0, path_1.dirname)(path)) === (0, session_id_1.fileStem)(path);
    exports.isNestedTranscript = isNestedTranscript;
    var subagentParentIdOf = (path) => (0, path_1.basename)((0, path_1.dirname)(path)) === "subagents" ? (0, path_1.basename)((0, path_1.dirname)((0, path_1.dirname)(path))) : null;
    exports.subagentParentIdOf = subagentParentIdOf;
    var cursorProjectDirOf = (rootPath) => {
      const transcriptsDir = (0, exports.isNestedTranscript)(rootPath) ? (0, path_1.dirname)((0, path_1.dirname)(rootPath)) : (0, path_1.dirname)(rootPath);
      return (0, path_1.basename)(transcriptsDir) === TRANSCRIPTS_DIR_NAME ? (0, path_1.dirname)(transcriptsDir) : null;
    };
    exports.cursorProjectDirOf = cursorProjectDirOf;
    var cursorRelativePath = (projectDir, rootPath, path) => {
      const fromBase = (0, path_1.relative)(projectDir ? (0, path_1.dirname)(projectDir) : (0, path_1.dirname)(rootPath), path);
      if (fromBase.startsWith("..")) {
        return (0, path_1.join)("transcript", "subagents", (0, path_1.basename)(path));
      }
      return projectDir ? fromBase : (0, path_1.join)("transcript", fromBase);
    };
    exports.cursorRelativePath = cursorRelativePath;
    var findCursorSubagentsOnDisk = async (rootPath) => {
      if (!(0, exports.isNestedTranscript)(rootPath)) {
        return [];
      }
      const dir = (0, path_1.join)((0, path_1.dirname)(rootPath), "subagents");
      let names2;
      try {
        names2 = (await (0, promises_1.readdir)(dir)).sort();
      } catch {
        return [];
      }
      const found2 = /* @__PURE__ */ new Map();
      for (const extension of TRANSCRIPT_EXTENSIONS) {
        for (const name of names2.filter((n) => n.endsWith(extension))) {
          const subagentId = name.slice(0, -extension.length);
          if (found2.has(subagentId) || !(0, session_id_1.isValidSessionId)(subagentId)) {
            continue;
          }
          const file = await (0, stat_trace_file_1.statTraceFile)((0, path_1.join)(dir, name));
          if (file) {
            found2.set(subagentId, file);
          }
        }
      }
      return [...found2].map(([subagentId, file]) => ({ subagentId, file }));
    };
    exports.findCursorSubagentsOnDisk = findCursorSubagentsOnDisk;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/cursor/group-cursor-sessions.js
var require_group_cursor_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/cursor/group-cursor-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupCursorSessions = void 0;
    var path_1 = __require("path");
    var collect_cursor_metadata_1 = require_collect_cursor_metadata();
    var convert_cursor_session_1 = require_convert_cursor_session();
    var parse_cursor_transcript_1 = require_parse_cursor_transcript();
    var read_git_branch_1 = require_read_git_branch();
    var read_trace_file_1 = require_read_trace_file();
    var session_id_1 = require_session_id();
    var keep_latest_1 = require_keep_latest();
    var cursor_transcript_layout_1 = require_cursor_transcript_layout();
    var groupCursorSessions = async (files, { converterVersion }) => {
      const skipped = [];
      const roots = [];
      const loose = [];
      for (const file of files) {
        const id = (0, session_id_1.fileStem)(file.path);
        const parentId = (0, cursor_transcript_layout_1.subagentParentIdOf)(file.path);
        if (!(0, session_id_1.isValidSessionId)(id)) {
          skipped.push({ path: file.path, reason: "its name isn't a session id" });
        } else if (parentId) {
          loose.push({ parentId, subagent: { subagentId: id, file } });
        } else {
          roots.push({ sessionId: id, file, subagents: [] });
        }
      }
      const kept = (0, keep_latest_1.keepLatestPerKey)(roots, ({ sessionId }) => sessionId, ({ file }) => file, skipped);
      for (const root of kept) {
        root.subagents = await (0, cursor_transcript_layout_1.findCursorSubagentsOnDisk)(root.file.path);
      }
      for (const { parentId, subagent } of loose) {
        const root = kept.find(({ sessionId }) => sessionId === parentId);
        if (!root) {
          skipped.push({
            path: subagent.file.path,
            reason: `subagent of conversation ${parentId}, whose transcript wasn't given`
          });
        } else if (!root.subagents.some((s) => s.subagentId === subagent.subagentId)) {
          root.subagents.push(subagent);
        }
      }
      const sessions = kept.map((root) => ({
        agent: "cursor",
        sessionId: root.sessionId,
        sourcePaths: [root.file, ...root.subagents.map((s) => s.file)].map((file) => file.path),
        prepare: () => prepareCursorPayload(root, converterVersion)
      }));
      return { sessions, skipped };
    };
    exports.groupCursorSessions = groupCursorSessions;
    var prepareCursorPayload = async ({ sessionId, file, subagents }, converterVersion) => {
      const projectDir = (0, cursor_transcript_layout_1.cursorProjectDirOf)(file.path);
      const projectDirName = projectDir ? (0, path_1.basename)(projectDir) : null;
      const read = (traceFile) => (0, read_trace_file_1.readTraceFile)(traceFile, (0, cursor_transcript_layout_1.cursorRelativePath)(projectDir, file.path, traceFile.path));
      const rootFile = await read(file);
      const subagentFiles = await Promise.all(subagents.map(async (subagent) => ({
        subagentId: subagent.subagentId,
        raw: await read(subagent.file)
      })));
      const transcript = (0, parse_cursor_transcript_1.parseCursorTranscript)(rootFile);
      const metadata = (0, collect_cursor_metadata_1.collectCursorMetadata)({
        events: [],
        transcript,
        transcriptMtimeMs: file.mtimeMs,
        projectDirName
      });
      const { trajectory, stats } = (0, convert_cursor_session_1.convertCursorSession)({
        sessionId,
        transcript,
        events: [],
        subagents: subagentFiles.map(({ subagentId, raw }) => ({
          subagentId,
          transcript: (0, parse_cursor_transcript_1.parseCursorTranscript)(raw),
          events: []
        })),
        metadata,
        gitBranch: (0, read_git_branch_1.readGitBranch)(metadata.cwd),
        malformedEventCount: 0
      }, converterVersion);
      return {
        envelope: {
          envelopeVersion: 1,
          agent: "cursor",
          sessionId,
          projectDirName,
          files: [rootFile, ...subagentFiles.map(({ raw }) => raw)]
        },
        trajectory,
        stats
      };
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/opencode/prepare-opencode-payload.js
var require_prepare_opencode_payload = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/opencode/prepare-opencode-payload.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepareOpenCodePayload = void 0;
    var promises_1 = __require("fs/promises");
    var convert_opencode_session_1 = require_convert_opencode_session();
    var format_opencode_export_1 = require_format_opencode_export();
    var read_git_branch_1 = require_read_git_branch();
    var json_guards_1 = require_json_guards();
    var prepareOpenCodePayload = async (sessionId, [root, ...descendants], converterVersion) => {
      if (!root) {
        throw new Error(`OpenCode session ${sessionId} has no export`);
      }
      const [rootExport, ...descendantExports] = await Promise.all([root, ...descendants].map(readExport));
      const childSessions = withoutDuplicates(sessionId, [
        ...rootExport.childSessions,
        ...descendantExports.flatMap(({ info, messages, childSessions: nested }) => [
          { info, messages },
          ...nested
        ])
      ]);
      const merged = {
        info: rootExport.info,
        messages: rootExport.messages,
        childSessions,
        malformedRows: [rootExport, ...descendantExports].flatMap((exported) => exported.malformedRows)
      };
      const content = (0, format_opencode_export_1.formatOpenCodeExport)(merged);
      const { trajectory, stats } = (0, convert_opencode_session_1.convertOpenCodeSession)(merged, {
        gitBranch: (0, read_git_branch_1.readGitBranch)((0, json_guards_1.asNonEmptyString)(merged.info["directory"])),
        converterVersion
      });
      return {
        envelope: {
          envelopeVersion: 1,
          agent: "opencode",
          sessionId,
          projectDirName: null,
          files: [
            {
              relativePath: `export/${sessionId}.json`,
              mtimeMs: Math.max(root.mtimeMs, ...descendants.map((f) => f.mtimeMs)),
              sizeBytes: Buffer.byteLength(content),
              content
            }
          ]
        },
        trajectory,
        stats
      };
    };
    exports.prepareOpenCodePayload = prepareOpenCodePayload;
    var readExport = async (file) => {
      const record2 = (0, json_guards_1.asRecord)(JSON.parse(await (0, promises_1.readFile)(file.path, "utf8")));
      const session = toExportSession(record2);
      if (!session) {
        throw new Error(`${file.path} isn't an \`opencode export\` file`);
      }
      return {
        ...session,
        childSessions: ((0, json_guards_1.asArray)(record2?.["childSessions"]) ?? []).flatMap((child) => {
          const childSession = toExportSession(child);
          return childSession ? [childSession] : [];
        }),
        malformedRows: (0, json_guards_1.asArray)(record2?.["malformedRows"]) ?? []
      };
    };
    var toExportSession = (value) => {
      const record2 = (0, json_guards_1.asRecord)(value);
      const info = (0, json_guards_1.asRecord)(record2?.["info"]);
      const messages = (0, json_guards_1.asArray)(record2?.["messages"]);
      if (!info || !messages) {
        return null;
      }
      return {
        info,
        messages: messages.flatMap((message) => {
          const messageRecord = (0, json_guards_1.asRecord)(message);
          const messageInfo = (0, json_guards_1.asRecord)(messageRecord?.["info"]);
          const parts = ((0, json_guards_1.asArray)(messageRecord?.["parts"]) ?? []).flatMap(toRecords);
          return messageInfo ? [{ info: messageInfo, parts }] : [];
        })
      };
    };
    var withoutDuplicates = (rootId, sessions) => {
      const seen = /* @__PURE__ */ new Set([rootId]);
      return sessions.filter((session) => {
        const id = (0, json_guards_1.asNonEmptyString)(session.info["id"]) ?? "";
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      });
    };
    var toRecords = (value) => {
      const record2 = (0, json_guards_1.asRecord)(value);
      return record2 ? [record2] : [];
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/opencode/group-opencode-sessions.js
var require_group_opencode_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/opencode/group-opencode-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupOpenCodeSessions = void 0;
    var session_id_1 = require_session_id();
    var keep_latest_1 = require_keep_latest();
    var prepare_opencode_payload_1 = require_prepare_opencode_payload();
    var groupOpenCodeSessions = (files, { converterVersion }) => {
      const skipped = [];
      const identified = files.filter((file) => {
        if ((0, session_id_1.isValidSessionId)(file.id)) {
          return true;
        }
        skipped.push({ path: file.path, reason: "has no valid session id" });
        return false;
      });
      const byId = new Map((0, keep_latest_1.keepLatestPerKey)(identified, (file) => file.id ?? "", (file) => file, skipped).map((file) => [file.id ?? "", file]));
      const trees = /* @__PURE__ */ new Map();
      for (const file of byId.values()) {
        const rootId = findRootId(file, byId);
        const tree = trees.get(rootId) ?? [];
        if (file.id === rootId) {
          tree.unshift(file);
        } else {
          tree.push(file);
        }
        trees.set(rootId, tree);
      }
      const sessions = [...trees].map(([rootId, tree]) => ({
        agent: "opencode",
        sessionId: rootId,
        sourcePaths: tree.map((file) => file.path),
        prepare: () => (0, prepare_opencode_payload_1.prepareOpenCodePayload)(rootId, [...tree].sort((a, b) => depthOf(a, byId) - depthOf(b, byId)), converterVersion)
      }));
      return { sessions, skipped };
    };
    exports.groupOpenCodeSessions = groupOpenCodeSessions;
    var findRootId = (file, byId) => {
      const seen = /* @__PURE__ */ new Set();
      let current = file;
      for (let parent = parentOf(current, byId); parent && !seen.has(parent.id ?? ""); parent = parentOf(current, byId)) {
        seen.add(current.id ?? "");
        current = parent;
      }
      return current.id ?? "";
    };
    var depthOf = (file, byId) => {
      let depth = 0;
      for (let parent = parentOf(file, byId); parent && depth < byId.size; parent = parentOf(parent, byId)) {
        depth++;
      }
      return depth;
    };
    var parentOf = (file, byId) => file.parentId ? byId.get(file.parentId) : void 0;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/pi/group-pi-sessions.js
var require_group_pi_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/pi/group-pi-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupPiSessions = void 0;
    var path_1 = __require("path");
    var build_pi_payload_1 = require_build_pi_payload();
    var read_trace_file_1 = require_read_trace_file();
    var session_id_1 = require_session_id();
    var keep_latest_1 = require_keep_latest();
    var SESSION_FILE_REGEX = /^[^_]+_(.+)\.jsonl$/;
    var PROJECT_DIR_REGEX = /^--.*--$/;
    var groupPiSessions = (files, { converterVersion }) => {
      const skipped = [];
      const identified = files.flatMap((file) => {
        const sessionId = (0, session_id_1.resolveSessionId)([
          file.headerId,
          SESSION_FILE_REGEX.exec((0, path_1.basename)(file.path))?.[1] ?? null,
          (0, session_id_1.fileStem)(file.path)
        ]);
        if (!sessionId) {
          skipped.push({ path: file.path, reason: "has no usable session id" });
          return [];
        }
        return [{ sessionId, file }];
      });
      const sessions = (0, keep_latest_1.keepLatestPerKey)(identified, ({ sessionId }) => sessionId, ({ file }) => file, skipped).map(({ sessionId, file }) => {
        const dirName = (0, path_1.basename)((0, path_1.dirname)(file.path));
        return {
          agent: "pi",
          sessionId,
          sourcePaths: [file.path],
          prepare: async () => (0, build_pi_payload_1.buildPiPayload)({
            sessionId,
            projectDirName: PROJECT_DIR_REGEX.test(dirName) ? dirName : null,
            file: await (0, read_trace_file_1.readTraceFile)(file, (0, path_1.basename)(file.path))
          }, converterVersion)
        };
      });
      return { sessions, skipped };
    };
    exports.groupPiSessions = groupPiSessions;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/group-trace-sessions.js
var require_group_trace_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/group/group-trace-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupTraceSessions = void 0;
    var group_atif_sessions_1 = require_group_atif_sessions();
    var group_claude_code_sessions_1 = require_group_claude_code_sessions();
    var group_codex_sessions_1 = require_group_codex_sessions();
    var group_cursor_sessions_1 = require_group_cursor_sessions();
    var group_opencode_sessions_1 = require_group_opencode_sessions();
    var group_pi_sessions_1 = require_group_pi_sessions();
    var groupTraceSessions = async (files, context) => {
      const byFormat = splitByFormat(files);
      const groups = [
        await (0, group_claude_code_sessions_1.groupClaudeCodeSessions)(byFormat["claude-code"], byFormat["claude-code-subagent-meta"], context),
        await (0, group_codex_sessions_1.groupCodexSessions)(byFormat.codex, context),
        await (0, group_cursor_sessions_1.groupCursorSessions)(byFormat.cursor, context),
        (0, group_opencode_sessions_1.groupOpenCodeSessions)(byFormat.opencode, context),
        (0, group_pi_sessions_1.groupPiSessions)(byFormat.pi, context),
        (0, group_atif_sessions_1.groupAtifSessions)(byFormat.atif, context)
      ];
      const skipped = groups.flatMap((group) => group.skipped);
      return {
        sessions: withoutDuplicateSessions(groups.flatMap((group) => group.sessions), skipped),
        skipped
      };
    };
    exports.groupTraceSessions = groupTraceSessions;
    var splitByFormat = (files) => {
      const byFormat = {
        "claude-code": [],
        "claude-code-subagent-meta": [],
        codex: [],
        pi: [],
        cursor: [],
        opencode: [],
        atif: []
      };
      for (const file of files) {
        byFormat[file.format].push(file);
      }
      return byFormat;
    };
    var withoutDuplicateSessions = (sessions, skipped) => {
      const seen = /* @__PURE__ */ new Map();
      return sessions.filter((session) => {
        const key = `${session.agent}/${session.sessionId}`;
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, session);
          return true;
        }
        skipped.push(...session.sourcePaths.map((path) => ({
          path,
          reason: `${key} is also read from ${existing.sourcePaths[0] ?? ""}`
        })));
        return false;
      });
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/from-files/find-trace-sessions.js
var require_find_trace_sessions = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/from-files/find-trace-sessions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findTraceSessions = void 0;
    var collect_trace_files_1 = require_collect_trace_files();
    var detect_trace_file_1 = require_detect_trace_file();
    var group_trace_sessions_1 = require_group_trace_sessions();
    var findTraceSessions = async (paths, { agentOverride = null, converterVersion, onUnrecognisedFile }) => {
      const { files, skipped } = await (0, collect_trace_files_1.collectTraceFiles)(paths);
      const detected = [];
      let unrecognisedCount = 0;
      for (const file of files) {
        let result;
        try {
          result = await (0, detect_trace_file_1.detectTraceFile)(file, agentOverride);
        } catch (error) {
          skipped.push({ path: file.path, reason: `unreadable: ${String(error)}` });
          continue;
        }
        if (result) {
          detected.push(result);
        } else if (file.explicit) {
          skipped.push({
            path: file.path,
            reason: "not a recognised trace format"
          });
        } else {
          unrecognisedCount++;
          onUnrecognisedFile?.(file.path);
        }
      }
      const grouped = await (0, group_trace_sessions_1.groupTraceSessions)(detected, {
        converterVersion,
        agentOverride
      });
      return {
        sessions: grouped.sessions,
        skipped: [...skipped, ...grouped.skipped],
        unrecognisedCount
      };
    };
    exports.findTraceSessions = findTraceSessions;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/user-config/compile-regex.js
var require_compile_regex = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/user-config/compile-regex.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compileRegex = void 0;
    var compileRegex = (value) => {
      if (typeof value !== "string") {
        return void 0;
      }
      try {
        return new RegExp(value);
      } catch {
        return void 0;
      }
    };
    exports.compileRegex = compileRegex;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/user-config/traces-user-config.js
var require_traces_user_config = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/user-config/traces-user-config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseTracesUserConfig = exports.loadTracesUserConfig = exports.getTracesUserConfigPath = void 0;
    var fs_1 = __require("fs");
    var os_1 = __require("os");
    var path_1 = __require("path");
    var compile_regex_1 = require_compile_regex();
    var getTracesUserConfigPath = () => (0, path_1.join)((0, os_1.homedir)(), ".meticulous", "traces-config.json");
    exports.getTracesUserConfigPath = getTracesUserConfigPath;
    var parseNullableRegex = (value) => value === null ? null : (0, compile_regex_1.compileRegex)(value);
    var FIELDS = {
      enabled: {
        defaultValue: true,
        parse: (value) => typeof value === "boolean" ? value : void 0
      },
      allowedRepoRegex: {
        defaultValue: null,
        parse: parseNullableRegex
      },
      excludeToolOutputRegex: {
        defaultValue: null,
        parse: parseNullableRegex
      }
    };
    var loadTracesUserConfig = (path = (0, exports.getTracesUserConfigPath)()) => {
      let contents;
      try {
        contents = (0, fs_1.readFileSync)(path, "utf8");
      } catch (error) {
        if (error.code !== "ENOENT") {
          return invalidFile(`unreadable (${String(error)})`);
        }
        contents = null;
      }
      return (0, exports.parseTracesUserConfig)(contents);
    };
    exports.loadTracesUserConfig = loadTracesUserConfig;
    var parseTracesUserConfig = (contents) => {
      if (contents === null) {
        return { config: buildDefaultConfig(), problems: [] };
      }
      const record2 = parseRecord(contents);
      if (!record2) {
        return invalidFile("not a JSON object");
      }
      const problems = [];
      const config = buildConfig((key) => readField(key, record2[key], problems));
      return {
        // Someone who wrote this file most likely did so to restrict uploads, so
        // a setting we can't honour stops them all.
        config: problems.length > 0 ? { ...config, enabled: false } : config,
        problems
      };
    };
    exports.parseTracesUserConfig = parseTracesUserConfig;
    var buildConfig = (resolve2) => ({
      enabled: resolve2("enabled"),
      allowedRepoRegex: resolve2("allowedRepoRegex"),
      excludeToolOutputRegex: resolve2("excludeToolOutputRegex")
    });
    var buildDefaultConfig = () => buildConfig((key) => FIELDS[key].defaultValue);
    var invalidFile = (problem) => ({
      config: { ...buildDefaultConfig(), enabled: false },
      problems: [problem]
    });
    var readField = (key, raw, problems) => {
      const spec = FIELDS[key];
      if (raw === void 0) {
        return spec.defaultValue;
      }
      const parsed = spec.parse(raw);
      if (parsed === void 0) {
        problems.push(`"${key}" has an invalid value: ${JSON.stringify(raw)}`);
        return spec.defaultValue;
      }
      return parsed;
    };
    var parseRecord = (contents) => {
      let parsed;
      try {
        parsed = JSON.parse(contents);
      } catch {
        return null;
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    };
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/upload/build-summary.js
var require_build_summary = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/upload/build-summary.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildSummary = void 0;
    var buildSummary = (stats, identity2, uploaderVersion) => ({
      userEmail: identity2.userEmail,
      osUsername: identity2.osUsername,
      hostname: identity2.hostname,
      cwd: stats.cwd,
      gitBranch: stats.gitBranch,
      gitRemoteUrl: identity2.gitRemoteUrl,
      agentVersion: stats.agentVersion,
      title: stats.title,
      models: stats.models,
      startedAt: stats.startedAt,
      endedAt: stats.endedAt,
      stepCount: stats.stepCount,
      subagentCount: stats.subagentCount,
      totalPromptTokens: stats.totals.promptTokens,
      totalCompletionTokens: stats.totals.completionTokens,
      totalCachedTokens: stats.totals.cachedTokens,
      totalCacheCreationTokens: stats.totals.cacheCreationTokens,
      uploaderVersion,
      platform: identity2.platform,
      osRelease: identity2.osRelease,
      timeZone: identity2.timeZone,
      gitRepository: identity2.gitRepository,
      gitBranches: stats.gitBranches,
      pullRequests: stats.pullRequests,
      entrypoint: stats.entrypoint,
      permissionModes: stats.permissionModes,
      userPromptCount: stats.activity.userPromptCount,
      compactionCount: stats.activity.compactionCount,
      toolCallCount: stats.activity.toolCallCount,
      toolErrorCount: stats.activity.toolErrorCount,
      toolCallCounts: stats.activity.toolCallCounts,
      reportedCostUsd: stats.reportedCostUsd,
      environment: identity2.environment,
      environmentId: identity2.environmentId
    });
    exports.buildSummary = buildSummary;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/upload/compute-content-sha256.js
var require_compute_content_sha256 = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/upload/compute-content-sha256.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeContentSha256 = void 0;
    var crypto_1 = __require("crypto");
    var computeContentSha256 = (files) => {
      const hash3 = (0, crypto_1.createHash)("sha256");
      for (const file of files) {
        hash3.update(`${Buffer.byteLength(file.relativePath)}:${file.relativePath}`);
        hash3.update(`${file.sizeBytes}:`);
        hash3.update(file.content);
      }
      return hash3.digest("hex");
    };
    exports.computeContentSha256 = computeContentSha256;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/upload/prepare-session-upload.js
var require_prepare_session_upload = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/upload/prepare-session-upload.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepareSessionUpload = void 0;
    var util_1 = __require("util");
    var zlib_1 = __require("zlib");
    var redact_secrets_1 = require_redact_secrets();
    var exclude_tool_outputs_1 = require_exclude_tool_outputs();
    var compute_content_sha256_1 = require_compute_content_sha256();
    var gzip = (0, util_1.promisify)(zlib_1.gzip);
    var prepareSessionUpload = async (converted, excludeToolOutputRegexes) => {
      const payload = (0, exclude_tool_outputs_1.excludeToolOutputs)(converted, excludeToolOutputRegexes);
      const files = payload.envelope.files.map((file) => {
        const content = (0, redact_secrets_1.redactSecrets)(file.content);
        return { ...file, content, sizeBytes: Buffer.byteLength(content) };
      });
      const atifJson = (0, redact_secrets_1.redactSecrets)(JSON.stringify(payload.trajectory));
      const { stats } = payload;
      return {
        atifJson,
        atifGzipped: await gzip(atifJson),
        rawGzipped: await gzip(JSON.stringify({ ...payload.envelope, files })),
        contentSha256: (0, compute_content_sha256_1.computeContentSha256)(files),
        stats: { ...stats, title: stats.title && (0, redact_secrets_1.redactSecrets)(stats.title) }
      };
    };
    exports.prepareSessionUpload = prepareSessionUpload;
  }
});

// node_modules/@alwaysmeticulous/agent-traces/dist/index.js
var require_dist = __commonJS({
  "node_modules/@alwaysmeticulous/agent-traces/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.asArray = exports.prepareSessionUpload = exports.computeContentSha256 = exports.buildSummary = exports.parseTracesUserConfig = exports.loadTracesUserConfig = exports.getTracesUserConfigPath = exports.compileRegex = exports.findTraceSessions = exports.FILE_TRACE_AGENTS = exports.TOOL_OUTPUT_STRIPPERS = exports.stripAtifRawFiles = exports.EXCLUDED_TOOL_OUTPUT = exports.createToolOutputFilter = exports.excludeToolOutputs = exports.redactSecrets = exports.createIdentityResolver = exports.readGitBranch = exports.readSpooledEventSessionId = exports.parseSpooledEvent = exports.stripPiToolOutputs = exports.parsePiSession = exports.convertPiSession = exports.buildPiPayload = exports.stripOpenCodeToolOutputs = exports.formatOpenCodeExport = exports.tokenSemanticsForVersion = exports.convertOpenCodeSession = exports.stripDevinToolOutputs = exports.redactDevinEventFiles = exports.convertDevinSession = exports.collectDevinMetadata = exports.parseCursorTranscript = exports.stripCursorToolOutputs = exports.parseCursorHookEvents = exports.convertCursorSession = exports.collectCursorMetadata = exports.stripCodexToolOutputs = exports.parseRolloutFileName = exports.readCodexThreadName = exports.parseSessionMetaLine = exports.convertCodexSession = exports.CODEX_SESSION_INDEX_FILE = exports.CODEX_ROLLOUT_DIRS = exports.buildCodexPayload = exports.stripClaudeCodeToolOutputs = exports.convertClaudeCodeSession = exports.buildClaudeCodePayload = exports.validateAtifTrajectory = exports.statsFromAtif = void 0;
    exports.asString = exports.asRecord = exports.asNumber = exports.asNonEmptyString = void 0;
    __exportStar(require_atif_types(), exports);
    __exportStar(require_constants(), exports);
    __exportStar(require_ingest_api_types(), exports);
    __exportStar(require_raw_envelope_types(), exports);
    __exportStar(require_summary_types(), exports);
    __exportStar(require_step_token_breakdown(), exports);
    __exportStar(require_tool_result_duration(), exports);
    __exportStar(require_walk_trajectories(), exports);
    __exportStar(require_branch_names(), exports);
    __exportStar(require_normalize_git_remote_url(), exports);
    __exportStar(require_pull_request_url(), exports);
    var stats_from_atif_1 = require_stats_from_atif();
    Object.defineProperty(exports, "statsFromAtif", { enumerable: true, get: function() {
      return stats_from_atif_1.statsFromAtif;
    } });
    var validate_atif_trajectory_1 = require_validate_atif_trajectory();
    Object.defineProperty(exports, "validateAtifTrajectory", { enumerable: true, get: function() {
      return validate_atif_trajectory_1.validateAtifTrajectory;
    } });
    var build_claude_code_payload_1 = require_build_claude_code_payload();
    Object.defineProperty(exports, "buildClaudeCodePayload", { enumerable: true, get: function() {
      return build_claude_code_payload_1.buildClaudeCodePayload;
    } });
    var convert_session_1 = require_convert_session();
    Object.defineProperty(exports, "convertClaudeCodeSession", { enumerable: true, get: function() {
      return convert_session_1.convertClaudeCodeSession;
    } });
    var strip_claude_code_tool_outputs_1 = require_strip_claude_code_tool_outputs();
    Object.defineProperty(exports, "stripClaudeCodeToolOutputs", { enumerable: true, get: function() {
      return strip_claude_code_tool_outputs_1.stripClaudeCodeToolOutputs;
    } });
    var build_codex_payload_1 = require_build_codex_payload();
    Object.defineProperty(exports, "buildCodexPayload", { enumerable: true, get: function() {
      return build_codex_payload_1.buildCodexPayload;
    } });
    var codex_home_layout_1 = require_codex_home_layout();
    Object.defineProperty(exports, "CODEX_ROLLOUT_DIRS", { enumerable: true, get: function() {
      return codex_home_layout_1.CODEX_ROLLOUT_DIRS;
    } });
    Object.defineProperty(exports, "CODEX_SESSION_INDEX_FILE", { enumerable: true, get: function() {
      return codex_home_layout_1.CODEX_SESSION_INDEX_FILE;
    } });
    var convert_codex_session_1 = require_convert_codex_session();
    Object.defineProperty(exports, "convertCodexSession", { enumerable: true, get: function() {
      return convert_codex_session_1.convertCodexSession;
    } });
    var parse_rollout_line_1 = require_parse_rollout_line();
    Object.defineProperty(exports, "parseSessionMetaLine", { enumerable: true, get: function() {
      return parse_rollout_line_1.parseSessionMetaLine;
    } });
    var read_codex_thread_name_1 = require_read_codex_thread_name();
    Object.defineProperty(exports, "readCodexThreadName", { enumerable: true, get: function() {
      return read_codex_thread_name_1.readCodexThreadName;
    } });
    var rollout_file_name_1 = require_rollout_file_name();
    Object.defineProperty(exports, "parseRolloutFileName", { enumerable: true, get: function() {
      return rollout_file_name_1.parseRolloutFileName;
    } });
    var strip_codex_tool_outputs_1 = require_strip_codex_tool_outputs();
    Object.defineProperty(exports, "stripCodexToolOutputs", { enumerable: true, get: function() {
      return strip_codex_tool_outputs_1.stripCodexToolOutputs;
    } });
    var collect_cursor_metadata_1 = require_collect_cursor_metadata();
    Object.defineProperty(exports, "collectCursorMetadata", { enumerable: true, get: function() {
      return collect_cursor_metadata_1.collectCursorMetadata;
    } });
    var convert_cursor_session_1 = require_convert_cursor_session();
    Object.defineProperty(exports, "convertCursorSession", { enumerable: true, get: function() {
      return convert_cursor_session_1.convertCursorSession;
    } });
    var parse_cursor_hook_events_1 = require_parse_cursor_hook_events();
    Object.defineProperty(exports, "parseCursorHookEvents", { enumerable: true, get: function() {
      return parse_cursor_hook_events_1.parseCursorHookEvents;
    } });
    var strip_cursor_tool_outputs_1 = require_strip_cursor_tool_outputs();
    Object.defineProperty(exports, "stripCursorToolOutputs", { enumerable: true, get: function() {
      return strip_cursor_tool_outputs_1.stripCursorToolOutputs;
    } });
    var parse_cursor_transcript_1 = require_parse_cursor_transcript();
    Object.defineProperty(exports, "parseCursorTranscript", { enumerable: true, get: function() {
      return parse_cursor_transcript_1.parseCursorTranscript;
    } });
    var collect_devin_metadata_1 = require_collect_devin_metadata();
    Object.defineProperty(exports, "collectDevinMetadata", { enumerable: true, get: function() {
      return collect_devin_metadata_1.collectDevinMetadata;
    } });
    var convert_devin_session_1 = require_convert_devin_session();
    Object.defineProperty(exports, "convertDevinSession", { enumerable: true, get: function() {
      return convert_devin_session_1.convertDevinSession;
    } });
    var redact_devin_event_files_1 = require_redact_devin_event_files();
    Object.defineProperty(exports, "redactDevinEventFiles", { enumerable: true, get: function() {
      return redact_devin_event_files_1.redactDevinEventFiles;
    } });
    var strip_devin_tool_outputs_1 = require_strip_devin_tool_outputs();
    Object.defineProperty(exports, "stripDevinToolOutputs", { enumerable: true, get: function() {
      return strip_devin_tool_outputs_1.stripDevinToolOutputs;
    } });
    var convert_opencode_session_1 = require_convert_opencode_session();
    Object.defineProperty(exports, "convertOpenCodeSession", { enumerable: true, get: function() {
      return convert_opencode_session_1.convertOpenCodeSession;
    } });
    var opencode_tokens_1 = require_opencode_tokens();
    Object.defineProperty(exports, "tokenSemanticsForVersion", { enumerable: true, get: function() {
      return opencode_tokens_1.tokenSemanticsForVersion;
    } });
    var format_opencode_export_1 = require_format_opencode_export();
    Object.defineProperty(exports, "formatOpenCodeExport", { enumerable: true, get: function() {
      return format_opencode_export_1.formatOpenCodeExport;
    } });
    var strip_opencode_tool_outputs_1 = require_strip_opencode_tool_outputs();
    Object.defineProperty(exports, "stripOpenCodeToolOutputs", { enumerable: true, get: function() {
      return strip_opencode_tool_outputs_1.stripOpenCodeToolOutputs;
    } });
    var build_pi_payload_1 = require_build_pi_payload();
    Object.defineProperty(exports, "buildPiPayload", { enumerable: true, get: function() {
      return build_pi_payload_1.buildPiPayload;
    } });
    var convert_pi_session_1 = require_convert_pi_session();
    Object.defineProperty(exports, "convertPiSession", { enumerable: true, get: function() {
      return convert_pi_session_1.convertPiSession;
    } });
    var parse_pi_session_1 = require_parse_pi_session();
    Object.defineProperty(exports, "parsePiSession", { enumerable: true, get: function() {
      return parse_pi_session_1.parsePiSession;
    } });
    var strip_pi_tool_outputs_1 = require_strip_pi_tool_outputs();
    Object.defineProperty(exports, "stripPiToolOutputs", { enumerable: true, get: function() {
      return strip_pi_tool_outputs_1.stripPiToolOutputs;
    } });
    var parse_spooled_event_1 = require_parse_spooled_event();
    Object.defineProperty(exports, "parseSpooledEvent", { enumerable: true, get: function() {
      return parse_spooled_event_1.parseSpooledEvent;
    } });
    Object.defineProperty(exports, "readSpooledEventSessionId", { enumerable: true, get: function() {
      return parse_spooled_event_1.readSpooledEventSessionId;
    } });
    var read_git_branch_1 = require_read_git_branch();
    Object.defineProperty(exports, "readGitBranch", { enumerable: true, get: function() {
      return read_git_branch_1.readGitBranch;
    } });
    var resolve_identity_1 = require_resolve_identity();
    Object.defineProperty(exports, "createIdentityResolver", { enumerable: true, get: function() {
      return resolve_identity_1.createIdentityResolver;
    } });
    var redact_secrets_1 = require_redact_secrets();
    Object.defineProperty(exports, "redactSecrets", { enumerable: true, get: function() {
      return redact_secrets_1.redactSecrets;
    } });
    var exclude_tool_outputs_1 = require_exclude_tool_outputs();
    Object.defineProperty(exports, "excludeToolOutputs", { enumerable: true, get: function() {
      return exclude_tool_outputs_1.excludeToolOutputs;
    } });
    var tool_output_filter_1 = require_tool_output_filter();
    Object.defineProperty(exports, "createToolOutputFilter", { enumerable: true, get: function() {
      return tool_output_filter_1.createToolOutputFilter;
    } });
    Object.defineProperty(exports, "EXCLUDED_TOOL_OUTPUT", { enumerable: true, get: function() {
      return tool_output_filter_1.EXCLUDED_TOOL_OUTPUT;
    } });
    var strip_atif_raw_files_1 = require_strip_atif_raw_files();
    Object.defineProperty(exports, "stripAtifRawFiles", { enumerable: true, get: function() {
      return strip_atif_raw_files_1.stripAtifRawFiles;
    } });
    var tool_output_strippers_1 = require_tool_output_strippers();
    Object.defineProperty(exports, "TOOL_OUTPUT_STRIPPERS", { enumerable: true, get: function() {
      return tool_output_strippers_1.TOOL_OUTPUT_STRIPPERS;
    } });
    var file_trace_agents_1 = require_file_trace_agents();
    Object.defineProperty(exports, "FILE_TRACE_AGENTS", { enumerable: true, get: function() {
      return file_trace_agents_1.FILE_TRACE_AGENTS;
    } });
    var find_trace_sessions_1 = require_find_trace_sessions();
    Object.defineProperty(exports, "findTraceSessions", { enumerable: true, get: function() {
      return find_trace_sessions_1.findTraceSessions;
    } });
    var compile_regex_1 = require_compile_regex();
    Object.defineProperty(exports, "compileRegex", { enumerable: true, get: function() {
      return compile_regex_1.compileRegex;
    } });
    var traces_user_config_1 = require_traces_user_config();
    Object.defineProperty(exports, "getTracesUserConfigPath", { enumerable: true, get: function() {
      return traces_user_config_1.getTracesUserConfigPath;
    } });
    Object.defineProperty(exports, "loadTracesUserConfig", { enumerable: true, get: function() {
      return traces_user_config_1.loadTracesUserConfig;
    } });
    Object.defineProperty(exports, "parseTracesUserConfig", { enumerable: true, get: function() {
      return traces_user_config_1.parseTracesUserConfig;
    } });
    var build_summary_1 = require_build_summary();
    Object.defineProperty(exports, "buildSummary", { enumerable: true, get: function() {
      return build_summary_1.buildSummary;
    } });
    var compute_content_sha256_1 = require_compute_content_sha256();
    Object.defineProperty(exports, "computeContentSha256", { enumerable: true, get: function() {
      return compute_content_sha256_1.computeContentSha256;
    } });
    var prepare_session_upload_1 = require_prepare_session_upload();
    Object.defineProperty(exports, "prepareSessionUpload", { enumerable: true, get: function() {
      return prepare_session_upload_1.prepareSessionUpload;
    } });
    var json_guards_1 = require_json_guards();
    Object.defineProperty(exports, "asArray", { enumerable: true, get: function() {
      return json_guards_1.asArray;
    } });
    Object.defineProperty(exports, "asNonEmptyString", { enumerable: true, get: function() {
      return json_guards_1.asNonEmptyString;
    } });
    Object.defineProperty(exports, "asNumber", { enumerable: true, get: function() {
      return json_guards_1.asNumber;
    } });
    Object.defineProperty(exports, "asRecord", { enumerable: true, get: function() {
      return json_guards_1.asRecord;
    } });
    Object.defineProperty(exports, "asString", { enumerable: true, get: function() {
      return json_guards_1.asString;
    } });
  }
});

// src/main.ts
import { homedir } from "node:os";

// src/errors.ts
var UpdateDocsError = class extends Error {
};
var NotInRepository = class extends UpdateDocsError {
  name = "NotInRepository";
  constructor(directory) {
    super(
      `${directory} is not inside a git repository: run update-docs from the repository whose docs it updates`
    );
  }
};
var UsageError = class extends UpdateDocsError {
  name = "UsageError";
};
var UnknownProject = class extends UpdateDocsError {
  name = "UnknownProject";
  constructor(project, known) {
    super(
      `No library project is named "${project}". Projects: ${known.join(", ")}`
    );
  }
};
var ReportInvalid = class extends UpdateDocsError {
  name = "ReportInvalid";
  path;
  constructor(file, path, problem) {
    super(`The report ${file} is invalid at ${path}: ${problem}`);
    this.path = path;
  }
};
var LedgerCorrupt = class extends UpdateDocsError {
  name = "LedgerCorrupt";
  constructor(file, path, problem) {
    super(`The ledger ${file} is invalid at ${path}: ${problem}`);
  }
};
var ConfigMissing = class extends UpdateDocsError {
  name = "ConfigMissing";
  constructor(file) {
    super(
      `This repo has no ${file}: write it as {"guide": "<the docs guide>", "map": "<the map file at the root>", "refuse": [{"glob": "<paths no run may claim>", "reason": "<why>"}]}`
    );
  }
};
var ConfigInvalid = class extends UpdateDocsError {
  name = "ConfigInvalid";
  constructor(file, path, problem) {
    super(`The config ${file} is invalid at ${path}: ${problem}`);
  }
};
var ClaimCorrupt = class extends UpdateDocsError {
  name = "ClaimCorrupt";
  constructor(file, path, problem) {
    super(`The claim ${file} is invalid at ${path}: ${problem}`);
  }
};
var ClaimRefused = class extends UpdateDocsError {
  name = "ClaimRefused";
  path;
  refusal;
  constructor(path, refusal, detail) {
    super(`Cannot claim ${path}: ${detail}`);
    this.path = path;
    this.refusal = refusal;
  }
};
var ProjectClaimed = class extends UpdateDocsError {
  name = "ProjectClaimed";
  constructor({ project, at, stamped, untouched, drafted }) {
    super(
      [
        `${project} already has an open claim, made at ${at}: commit it or release it first. If the run that made it is gone, undo it:`,
        ...stamped.length > 0 ? [`  release ${project} --revert ${stamped.join(" ")}`] : [],
        ...untouched.length > 0 ? [`  release ${project} ${untouched.join(" ")}`] : [],
        ...drafted.map(
          (path) => `  ${path} has no stamp and differs from HEAD, so no run can tell its draft from another session's edit: read git diff -- ${path}, put back what the gone run wrote, then run release ${project} ${path}`
        )
      ].join("\n")
    );
  }
};
var NoClaim = class extends UpdateDocsError {
  name = "NoClaim";
  constructor(project) {
    super(`${project} has no open claim`);
  }
};
var NotClaimed = class extends UpdateDocsError {
  name = "NotClaimed";
  constructor(project, paths) {
    super(`The claim of ${project} does not hold ${paths.join(", ")}`);
  }
};
var NotStamped = class extends UpdateDocsError {
  name = "NotStamped";
  paths;
  constructor(project, command, paths) {
    super(
      `${command} needs a stamp of ${paths.join(", ")}: run stamp ${project} ${paths.join(" ")} once its writer has handed back`
    );
    this.paths = paths;
  }
};
var StampMismatch = class extends UpdateDocsError {
  name = "StampMismatch";
  paths;
  /** `drafts` shows what the run's drafts changed, so a person can undo them. */
  constructor(paths, drafts) {
    super(
      `Changed after the stamp, so another session may have edited them: ${paths.join(", ")}${drafts}`
    );
    this.paths = paths;
  }
};
var ClaimOvertaken = class extends UpdateDocsError {
  name = "ClaimOvertaken";
  paths;
  /** `drafts` shows what the run's drafts changed, so a person can undo them. */
  constructor(paths, how, drafts) {
    super(`${how} since the claim: ${paths.join(", ")}${drafts}`);
    this.paths = paths;
  }
};
var NothingToCommit = class extends UpdateDocsError {
  name = "NothingToCommit";
  constructor(project) {
    super(
      `No claimed path of ${project} differs from HEAD; the claim stays open`
    );
  }
};
var SubjectRefused = class extends UpdateDocsError {
  name = "SubjectRefused";
  constructor(text, problem) {
    super(`The subject "${text}" ${problem}`);
  }
};
var CommitRefused = class extends UpdateDocsError {
  name = "CommitRefused";
  constructor(output) {
    super(`git commit failed; nothing was committed:
${output.trimEnd()}`);
  }
};
var CommitNotAsClaimed = class extends UpdateDocsError {
  name = "CommitNotAsClaimed";
  sha;
  constructor(sha, problem) {
    super(`Commit ${sha} landed, but ${problem}; check it by hand`);
    this.sha = sha;
  }
};

// src/git.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var run = promisify(execFile);
var GitFailed = class extends Error {
  name = "GitFailed";
  exitCode;
  constructor(args, exitCode, stderr) {
    super(`git ${args.join(" ")} exited ${exitCode}: ${stderr.trim()}`);
    this.exitCode = exitCode;
  }
};
var Git = class _Git {
  directory;
  #variables;
  constructor(directory, variables) {
    this.directory = directory;
    this.#variables = variables;
  }
  /** Another git working tree, run with the same environment. */
  at(directory) {
    return new _Git(directory, this.#variables);
  }
  async run(args) {
    try {
      const { stdout } = await run("git", ["-C", this.directory, ...args], {
        encoding: "utf8",
        env: this.#variables,
        maxBuffer: 512 * 1024 * 1024
      });
      return stdout;
    } catch (error) {
      if (isExit(error)) {
        throw new GitFailed(args, error.code, String(error.stderr));
      }
      throw error;
    }
  }
  /** Output that may not be text, such as a blob. */
  async bytes(args) {
    try {
      const { stdout } = await run("git", ["-C", this.directory, ...args], {
        encoding: "buffer",
        env: this.#variables,
        maxBuffer: 512 * 1024 * 1024
      });
      return stdout;
    } catch (error) {
      if (isExit(error)) {
        throw new GitFailed(args, error.code, String(error.stderr));
      }
      throw error;
    }
  }
  /** git grep exits 1 when nothing matches: that is an empty result. */
  async grep(args) {
    try {
      return await this.run(["grep", ...args]);
    } catch (error) {
      if (error instanceof GitFailed && error.exitCode === 1) {
        return "";
      }
      throw error;
    }
  }
};
function isExit(error) {
  return Error.isError(error) && "code" in error && typeof error.code === "number" && "stderr" in error && (typeof error.stderr === "string" || Buffer.isBuffer(error.stderr));
}

// src/update-docs.ts
import { join as join11, posix as posix2, relative, resolve, sep as sep2 } from "node:path";
import { parseArgs } from "node:util";

// src/claims/claim.ts
function draftState(draft) {
  return draft.kind === "absent" ? draft : { kind: "file", sha256: draft.sha256 };
}
var Claim = class _Claim {
  project;
  /** Each claimed path, in the order claimed, with its stamp. */
  stamps;
  head;
  at;
  constructor(fields) {
    this.project = fields.project;
    this.stamps = fields.stamps;
    this.head = fields.head;
    this.at = fields.at;
  }
  get paths() {
    return [...this.stamps.keys()];
  }
  /** The claim with the given paths stamped as they hold now. */
  stamped(at, drafts) {
    const stamps = new Map(this.stamps);
    for (const [path, draft] of drafts) {
      stamps.set(path, { kind: "stamped", at, draft });
    }
    return new _Claim({ ...this, stamps });
  }
  /** The claim without the released paths, or 'empty' when none is left. */
  without(released) {
    const stamps = new Map(
      [...this.stamps].filter(([path]) => !released.includes(path))
    );
    return stamps.size === 0 ? "empty" : new _Claim({ ...this, stamps });
  }
};

// src/claims/path-state.ts
import { hash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
async function readPathState(repoRoot, path) {
  try {
    const content = await readFile(join(repoRoot, path));
    return {
      kind: "file",
      sha256: hash("sha256", content)
    };
  } catch (error) {
    if (Error.isError(error) && "code" in error && error.code === "ENOENT") {
      return { kind: "absent" };
    }
    throw error;
  }
}
function formatPathState(state) {
  return state.kind === "absent" ? "absent" : `sha256:${state.sha256}`;
}
function parsePathState(text) {
  if (text === "absent") {
    return { kind: "absent" };
  }
  const match = /^sha256:([\da-f]{64})$/.exec(text);
  return match?.[1] === void 0 ? "invalid" : { kind: "file", sha256: match[1] };
}
function samePathState(a, b) {
  return formatPathState(a) === formatPathState(b);
}

// src/claims/claim-guard.ts
var ClaimGuard = class {
  #repoRoot;
  #paths;
  constructor(repoRoot, paths) {
    this.#repoRoot = repoRoot;
    this.#paths = paths;
  }
  async asLeft(claim, paths, command) {
    const stamped = [];
    const unstamped = [];
    for (const path of paths) {
      const stamp = claim.stamps.get(path);
      if (stamp?.kind === "stamped") {
        stamped.push([path, stamp.draft]);
      } else {
        unstamped.push(path);
      }
    }
    if (unstamped.length > 0) {
      throw new NotStamped(claim.project, command, unstamped);
    }
    const changed = [];
    for (const [path, draft] of stamped) {
      const now = await readPathState(this.#repoRoot, path);
      if (!samePathState(draftState(draft), now)) {
        changed.push(path);
      }
    }
    if (changed.length > 0) {
      throw new StampMismatch(changed, await this.#drafts(claim, changed));
    }
    const committed = await this.#paths.changedBetween(
      claim.head,
      "HEAD",
      paths
    );
    if (committed.length > 0) {
      throw new ClaimOvertaken(
        committed,
        "A commit changed them",
        await this.#drafts(claim, committed)
      );
    }
    const staged = await this.#paths.staged(paths);
    if (staged.length > 0) {
      throw new ClaimOvertaken(
        staged,
        "Another session staged them",
        await this.#drafts(claim, staged)
      );
    }
  }
  /**
   * What the run's drafts of these paths changed since the claim, with what a
   * person does next: the tool can neither commit nor revert a draft that
   * another session's edit now shares the file with.
   */
  async #drafts(claim, paths) {
    const diffs = [];
    for (const path of paths) {
      const stamp = claim.stamps.get(path);
      if (stamp?.kind === "stamped" && stamp.draft.kind === "file") {
        diffs.push(
          await this.#paths.draftDiff(claim.head, path, stamp.draft.blob)
        );
      }
    }
    return diffs.length === 0 ? "" : `
The draft's own changes, which a person takes out of the file by hand before running release ${claim.project} ${paths.join(" ")}:
${diffs.join("")}`;
  }
};

// src/claims/claim-store.ts
import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile as readFile2,
  readdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { join as join2 } from "node:path";

// src/ledger/shape.ts
var ROOT = "";
var Shape = class {
  #fail;
  constructor(fail) {
    this.#fail = (path, problem) => fail(path === ROOT ? "the document" : path, problem);
  }
  /** An object with exactly the given keys. */
  object(value, path, keys) {
    const record2 = this.record(value, path);
    for (const key of Object.keys(record2)) {
      if (!keys.some((each) => each === key)) {
        throw this.#fail(field(path, key), "unknown key");
      }
    }
    for (const key of keys) {
      if (!Object.hasOwn(record2, key)) {
        throw this.#fail(field(path, key), "missing");
      }
    }
    return new Map(keys.map((key) => [key, record2[key]]));
  }
  /** A map from names to values, such as the ledger's projects. */
  record(value, path) {
    if (!isRecord(value)) {
      throw this.#fail(path, "expected an object");
    }
    return value;
  }
  list(value, path, item) {
    if (!Array.isArray(value)) {
      throw this.#fail(path, "expected an array");
    }
    return value.map((each, index) => item(each, `${path}[${index}]`));
  }
  text(value, path) {
    if (typeof value !== "string") {
      throw this.#fail(path, "expected a string");
    }
    if (value.trim() === "") {
      throw this.#fail(path, "must not be empty");
    }
    return value;
  }
  oneOf(value, path, options) {
    const text = this.text(value, path);
    const option = options.find((each) => each === text);
    if (option === void 0) {
      throw this.#fail(path, `expected one of ${options.join(", ")}`);
    }
    return option;
  }
  instant(value, path) {
    const text = this.text(value, path);
    try {
      return Temporal.Instant.from(text).toString();
    } catch (error) {
      if (error instanceof RangeError) {
        throw this.#fail(path, "expected an ISO 8601 instant");
      }
      throw error;
    }
  }
};
function field(path, key) {
  return path === ROOT ? key : `${path}.${key}`;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/claims/claim-store.ts
var ClaimStore = class {
  #folder;
  constructor(folder) {
    this.#folder = folder;
  }
  /**
   * Records a new claim. A project with an open claim gets no second one:
   * the open claim comes back instead, so the caller can say how to undo it.
   */
  async create(claim) {
    await mkdir(this.#folder, { recursive: true });
    try {
      await writeFile(this.#file(claim.project), serialize(claim), {
        flag: "wx"
      });
      return { kind: "created" };
    } catch (error) {
      if (Error.isError(error) && "code" in error && error.code === "EEXIST") {
        return { kind: "open", claim: await this.read(claim.project) };
      }
      throw error;
    }
  }
  async read(project) {
    const file = this.#file(project);
    let text;
    try {
      text = await readFile2(file, "utf8");
    } catch (error) {
      if (isMissing(error)) {
        throw new NoClaim(project);
      }
      throw error;
    }
    return parse(file, text);
  }
  /** Every open claim; before the first claim there are none. */
  async all() {
    let names2;
    try {
      names2 = await readdir(this.#folder);
    } catch (error) {
      if (isMissing(error)) {
        return [];
      }
      throw error;
    }
    return Promise.all(
      names2.filter((name) => name.endsWith(".json") && !name.startsWith(".")).map((name) => this.read(name.slice(0, -".json".length)))
    );
  }
  /** Writes a temporary file beside the claim, then renames it over it. */
  async replace(claim) {
    const temporary = join2(this.#folder, `.claim-${randomUUID()}.json`);
    await writeFile(temporary, serialize(claim));
    await rename(temporary, this.#file(claim.project));
  }
  async remove(project) {
    await rm(this.#file(project));
  }
  #file(project) {
    return join2(this.#folder, `${project}.json`);
  }
};
function serialize(claim) {
  return `${JSON.stringify(
    {
      project: claim.project,
      head: claim.head,
      at: claim.at,
      paths: Object.fromEntries(
        [...claim.stamps].map(([path, stamp]) => [
          path,
          stamp.kind === "unstamped" ? { kind: "unstamped" } : stamp.draft.kind === "absent" ? { kind: "stamped", at: stamp.at, state: "absent" } : {
            kind: "stamped",
            at: stamp.at,
            state: formatPathState(stamp.draft),
            blob: stamp.draft.blob
          }
        ])
      )
    },
    null,
    2
  )}
`;
}
function parse(file, text) {
  const shape = new Shape(
    (path, problem) => new ClaimCorrupt(file, path, problem)
  );
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ClaimCorrupt(file, "the document", error.message);
    }
    throw error;
  }
  const claim = shape.object(value, ROOT, ["project", "head", "at", "paths"]);
  const paths = shape.record(claim.get("paths"), "paths");
  return new Claim({
    project: shape.text(claim.get("project"), "project"),
    head: shape.text(claim.get("head"), "head"),
    at: shape.instant(claim.get("at"), "at"),
    stamps: new Map(
      Object.entries(paths).map(([path, each]) => {
        const at = `paths.${path}`;
        const kind = shape.oneOf(shape.record(each, at).kind, `${at}.kind`, [
          "unstamped",
          "stamped"
        ]);
        if (kind === "unstamped") {
          shape.object(each, at, ["kind"]);
          return [path, { kind }];
        }
        const record2 = shape.record(each, at);
        const state = parsePathState(shape.text(record2.state, `${at}.state`));
        if (state === "invalid") {
          throw new ClaimCorrupt(
            file,
            `${at}.state`,
            "expected absent or sha256:<hex>"
          );
        }
        let draft;
        if (state.kind === "absent") {
          shape.object(each, at, ["kind", "at", "state"]);
          draft = state;
        } else {
          const stamp = shape.object(each, at, ["kind", "at", "state", "blob"]);
          draft = {
            kind: "file",
            sha256: state.sha256,
            blob: shape.text(stamp.get("blob"), `${at}.blob`)
          };
        }
        return [
          path,
          { kind, at: shape.instant(record2.at, `${at}.at`), draft }
        ];
      })
    )
  });
}
function isMissing(error) {
  return Error.isError(error) && "code" in error && error.code === "ENOENT";
}

// src/claims/claimed-paths.ts
import { mkdir as mkdir2, rm as rm2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname, join as join3 } from "node:path";
var ClaimedPaths = class {
  #git;
  constructor(git) {
    this.#git = git;
  }
  async head() {
    return (await this.#git.run(["rev-parse", "--verify", "HEAD"])).trim();
  }
  /** The paths whose working tree or index differs from HEAD, untracked too. */
  async uncommitted(paths) {
    const status = await this.#literal([
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--",
      ...paths
    ]);
    return paths.filter(
      (path) => status.split("\0").some((entry) => entry.slice(3) === path)
    );
  }
  /** The paths a commit between the two revisions changed; all with none. */
  async changedBetween(from, to, paths) {
    return names(
      await this.#literal([
        "diff",
        "--name-only",
        "-z",
        from,
        to,
        "--",
        ...paths
      ])
    );
  }
  /** The paths whose entry in the shared index differs from HEAD. */
  async staged(paths) {
    return names(
      await this.#literal([
        "diff",
        "--cached",
        "--name-only",
        "-z",
        "--",
        ...paths
      ])
    );
  }
  /** Keeps a path's content as a git blob, and gives the blob's id. */
  async keep(path) {
    return (await this.#git.run(["hash-object", "-w", "--", path])).trim();
  }
  /**
   * What a draft changed: the diff from the path at a revision (or no file)
   * to the draft's blob.
   */
  async draftDiff(revision, path, blob) {
    const entry = await this.#literal(["ls-tree", "-z", revision, "--", path]);
    const from = entry === "" ? await this.#emptyBlob() : `${revision}:${path}`;
    return this.#git.run(["diff", "--no-color", from, blob]);
  }
  /** git knows the empty blob of its object format without storing it. */
  async #emptyBlob() {
    const format = (await this.#git.run(["rev-parse", "--show-object-format"])).trim();
    return format === "sha256" ? "473a0f4c3be8a93681a267e3b1e9a7dcda1185436fe141f7749120a303721813" : "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391";
  }
  /** Puts a path back as it was at a revision: its content, or no file. */
  async restore(revision, path) {
    const entry = await this.#literal(["ls-tree", "-z", revision, "--", path]);
    if (entry === "") {
      await rm2(join3(this.#git.directory, path), { force: true });
      return;
    }
    const file = join3(this.#git.directory, path);
    await mkdir2(dirname(file), { recursive: true });
    await writeFile2(
      file,
      await this.#git.bytes(["cat-file", "blob", `${revision}:${path}`])
    );
  }
  /** The paths a commit changed relative to its own parent. */
  async changedBy(commit) {
    return names(
      await this.#git.run([
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        "-z",
        commit
      ])
    );
  }
  #literal(args) {
    return this.#git.run(["--literal-pathspecs", ...args]);
  }
};
function names(output) {
  return output.split("\0").filter(Boolean);
}

// src/claims/path-commit.ts
var PathCommit = class {
  #git;
  constructor(git) {
    this.#git = git;
  }
  /** The new commit's sha; on a refusal the paths are unstaged again. */
  async commit(paths, messages) {
    let summary;
    try {
      await this.#literal(["add", "--", ...paths]);
      summary = await this.#literal([
        "commit",
        "--only",
        ...messages.flatMap((message) => ["-m", message]),
        "--",
        ...paths
      ]);
    } catch (error) {
      if (error instanceof GitFailed) {
        await this.#literal(["reset", "-q", "--", ...paths]);
        throw new CommitRefused(error.message);
      }
      throw error;
    }
    return this.#sha(summary);
  }
  /**
   * The new commit, from git's own summary line ("[main 1a2b3c4] subject"):
   * HEAD may already name a peer's later commit.
   */
  async #sha(summary) {
    const short = /^\[.* ([\da-f]{4,})\] /.exec(summary)?.[1];
    if (short === void 0) {
      throw new TypeError(`git commit printed no summary line: ${summary}`);
    }
    return (await this.#git.run(["rev-parse", "--verify", `${short}^{commit}`])).trim();
  }
  #literal(args) {
    return this.#git.run(["--literal-pathspecs", ...args]);
  }
};

// src/claude-home.ts
import { hash as hash2 } from "node:crypto";
import { basename, join as join4 } from "node:path";

// src/paths.ts
import { sep } from "node:path";
function under(path, prefix) {
  return path === prefix || path.startsWith(prefix.endsWith(sep) ? prefix : prefix + sep);
}

// src/claude-home.ts
var ClaudeHome = class {
  root;
  constructor(home) {
    this.root = join4(home, ".claude");
  }
  /** The folder of one transcript folder per working directory. */
  get projects() {
    return join4(this.root, "projects");
  }
  /** The folder of the tool's machine-wide config and each repo's state. */
  get state() {
    return join4(this.root, "plans", "update-docs");
  }
  /**
   * The folder of one repository's ledger, claims, run reports and work.
   * The hash of the path keeps apart two repos whose paths differ only in
   * punctuation, such as a/b and a-b.
   */
  repoState(repoRoot) {
    return join4(
      this.state,
      `${basename(repoRoot)}-${hash2("sha256", repoRoot).slice(0, 12)}`
    );
  }
  /** A session that ran here was a tool or hook run, not the user's work. */
  holds(path) {
    return under(path, this.root);
  }
};

// src/commands/claim-command.ts
var ClaimCommand = class {
  #workspace;
  #config;
  #paths;
  #store;
  constructor(parts) {
    this.#workspace = parts.workspace;
    this.#config = parts.config;
    this.#paths = parts.paths;
    this.#store = parts.store;
  }
  /** `paths` are relative to the workspace, with forward slashes. */
  async run(name, paths, now) {
    const project = await this.#workspace.project(name);
    await this.#refuseOpen(project.name);
    for (const path of paths) {
      this.#inScope(project, path);
    }
    const [uncommitted] = await this.#paths.uncommitted(paths);
    if (uncommitted !== void 0) {
      throw new ClaimRefused(
        uncommitted,
        "uncommitted",
        "it has uncommitted changes, maybe another session is editing it"
      );
    }
    const claim = new Claim({
      project: project.name,
      stamps: new Map(paths.map((path) => [path, { kind: "unstamped" }])),
      head: await this.#paths.head(),
      at: now.toString()
    });
    const created = await this.#store.create(claim);
    if (created.kind === "open") {
      throw await this.#claimed(created.claim);
    }
    const others = (await this.#store.all()).filter(
      (other) => other.project !== project.name
    );
    for (const other of others) {
      const shared = other.paths.find((path) => paths.includes(path));
      if (shared !== void 0) {
        await this.#store.remove(project.name);
        throw new ClaimRefused(
          shared,
          "claimed",
          `the open claim of ${other.project} holds it`
        );
      }
    }
    return { exitCode: 0, stdout: "" };
  }
  async #refuseOpen(project) {
    let open2;
    try {
      open2 = await this.#store.read(project);
    } catch (error) {
      if (error instanceof NoClaim) {
        return;
      }
      throw error;
    }
    throw await this.#claimed(open2);
  }
  async #claimed(open2) {
    const stamped = open2.paths.filter(
      (path) => open2.stamps.get(path)?.kind === "stamped"
    );
    const unstamped = open2.paths.filter((path) => !stamped.includes(path));
    const drafted = await this.#paths.uncommitted(unstamped);
    return new ProjectClaimed({
      project: open2.project,
      at: open2.at,
      stamped,
      untouched: unstamped.filter((path) => !drafted.includes(path)),
      drafted
    });
  }
  #inScope(project, path) {
    if (!path.endsWith(".md")) {
      throw new ClaimRefused(path, "not-markdown", "it is not a .md file");
    }
    const refusal = this.#config.refusal(path);
    if (refusal !== void 0) {
      throw new ClaimRefused(path, "repo-config", refusal.reason);
    }
    if (!path.startsWith(`${project.root}/`) && path !== this.#config.map) {
      throw new ClaimRefused(
        path,
        "outside-project",
        `it is neither under ${project.root}/ nor the map ${this.#config.map}`
      );
    }
  }
};

// src/commands/commit-command.ts
var CommitCommand = class {
  #workspace;
  #store;
  #guard;
  #paths;
  #committer;
  constructor(parts) {
    this.#workspace = parts.workspace;
    this.#store = parts.store;
    this.#guard = parts.guard;
    this.#paths = parts.paths;
    this.#committer = parts.committer;
  }
  /** `body` holds the commit's paragraphs after the subject, if any. */
  async run(name, text, body) {
    const subject = this.#subject(text);
    const project = await this.#workspace.project(name);
    const claim = await this.#store.read(project.name);
    await this.#guard.asLeft(claim, claim.paths, "commit");
    const changed = await this.#paths.uncommitted(claim.paths);
    if (changed.length === 0) {
      throw new NothingToCommit(project.name);
    }
    const sha = await this.#committer.commit(changed, [
      `docs(${project.name}): ${subject}`,
      ...body
    ]);
    await this.#store.remove(project.name);
    await this.#landedAsClaimed(sha, changed);
    return { exitCode: 0, stdout: `${sha}
` };
  }
  #subject(text) {
    if (text.trim() === "") {
      throw new SubjectRefused(text, "is empty");
    }
    if (text.includes("\n")) {
      throw new SubjectRefused(text, "spans lines: put the rest in --body");
    }
    if (text.includes("): ")) {
      throw new SubjectRefused(
        text,
        'holds "): ", which the commit-msg hook refuses: write "(#3840); "'
      );
    }
    return text;
  }
  /**
   * A hook can stage more into the commit, such as the pre-commit Sync step
   * staging a tsconfig, so the commit may hold more than the claim changed.
   */
  async #landedAsClaimed(sha, changed) {
    const files = await this.#paths.changedBy(sha);
    const extra = files.filter((file) => !changed.includes(file));
    const missing = changed.filter((file) => !files.includes(file));
    if (extra.length > 0 || missing.length > 0) {
      throw new CommitNotAsClaimed(
        sha,
        `it holds ${files.join(", ")} where the claim changed ${changed.join(", ")}`
      );
    }
  }
};

// src/since.ts
var Since = class _Since {
  static ever = new _Since({ kind: "ever" });
  #window;
  constructor(window) {
    this.#window = window;
  }
  static from(instant2) {
    return new _Since({ kind: "from", instant: instant2 });
  }
  /** The earliest of several starts, for one read that serves them all. */
  static earliest(starts) {
    let earliest = "none";
    for (const start of starts) {
      if (start.#window.kind === "ever") {
        return _Since.ever;
      }
      if (earliest === "none" || Temporal.Instant.compare(start.#window.instant, earliest) < 0) {
        earliest = start.#window.instant;
      }
    }
    return earliest === "none" ? _Since.ever : _Since.from(earliest);
  }
  /** The start as a Date, for a listing that takes one: the epoch for "ever". */
  toDate() {
    return new Date(
      this.#window.kind === "ever" ? 0 : this.#window.instant.epochMilliseconds
    );
  }
  includes(instant2) {
    return this.#window.kind === "ever" || Temporal.Instant.compare(instant2, this.#window.instant) >= 0;
  }
  /** A timestamp that does not parse is outside every window but "ever". */
  includesText(timestamp) {
    if (this.#window.kind === "ever") {
      return true;
    }
    try {
      return this.includes(Temporal.Instant.from(timestamp));
    } catch (error) {
      if (error instanceof RangeError) {
        return false;
      }
      throw error;
    }
  }
  gitArgs() {
    return this.#window.kind === "ever" ? [] : [`--since=${this.#window.instant.toString()}`];
  }
  /** Consumer commits are read only when a window bounds them. */
  get bounded() {
    return this.#window.kind === "from";
  }
};
function parseInstant(text, option) {
  try {
    return Temporal.Instant.from(text);
  } catch (error) {
    if (error instanceof RangeError) {
      throw new UsageError(
        `${option} takes an ISO 8601 instant with an offset, such as 2026-11-16T09:00:00Z; got "${text}"`
      );
    }
    throw error;
  }
}

// src/commands/delta-command.ts
var DeltaCommand = class {
  #workspace;
  #evidence;
  constructor(workspace, evidence) {
    this.#workspace = workspace;
    this.#evidence = evidence;
  }
  async run(ledger) {
    const projects = await this.#workspace.projects();
    const ran = projects.flatMap((project) => {
      const run2 = ledger.runs.get(project.name);
      return run2 === void 0 ? [] : [{ project, lastRun: run2.lastRun }];
    });
    const collected = await this.#evidence.collect(
      ran.map(({ project, lastRun }) => ({
        project,
        since: Since.from(Temporal.Instant.from(lastRun))
      }))
    );
    const changed = ran.flatMap(({ project, lastRun }) => {
      const records = collected.get(project.name) ?? [];
      const count = (source) => records.filter((record2) => record2.source === source).length;
      const counts = {
        packageCommit: count("package-commit"),
        consumerCommit: count("consumer-commit"),
        transcript: count("transcript")
      };
      return Object.values(counts).some((value) => value > 0) ? [{ project: project.name, lastRun, counts }] : [];
    });
    const neverRun = projects.filter((project) => !ledger.runs.has(project.name)).map((project) => project.name);
    return {
      exitCode: 0,
      stdout: `${JSON.stringify({ changed, neverRun }, null, 2)}
`
    };
  }
};

// src/commands/evidence-command.ts
var EvidenceCommand = class {
  #workspace;
  #evidence;
  #budget;
  constructor(workspace, evidence, budget) {
    this.#workspace = workspace;
    this.#evidence = evidence;
    this.#budget = budget;
  }
  async run(name, since) {
    const project = await this.#workspace.project(name);
    const collected = await this.#evidence.collect([{ project, since }]);
    const records = this.#budget.cut(collected.get(project.name) ?? []);
    return {
      exitCode: 0,
      stdout: records.map((record2) => `${JSON.stringify(record2)}
`).join("")
    };
  }
};

// src/commands/finish-command.ts
import { mkdir as mkdir3, writeFile as writeFile3 } from "node:fs/promises";
import { join as join5 } from "node:path";
var FinishCommand = class {
  #workspace;
  #git;
  #runs;
  constructor(workspace, git, runs) {
    this.#workspace = workspace;
    this.#git = git;
    this.#runs = runs;
  }
  async run(name, started, report, reportFile, ledger) {
    const project = await this.#workspace.project(name);
    const commits = await this.#commits(report, reportFile);
    await mkdir3(this.#runs, { recursive: true });
    const stamp = started.toString().replaceAll(":", "-");
    await writeFile3(
      join5(this.#runs, `${stamp}-${project.name}.json`),
      report.text
    );
    await ledger.finished(project.name, {
      lastRun: started.toString(),
      commits,
      queued: report.queued,
      open: report.open,
      blocked: report.blocked
    }).write();
    return { exitCode: 0, stdout: "" };
  }
  /** Each reported commit, with its full sha and date from the workspace. */
  async #commits(report, file) {
    return Promise.all(
      report.committed.map(async ({ sha, subject }, index) => {
        try {
          const [full = "", at = ""] = (await this.#git.run([
            "show",
            "-s",
            "--format=%H%n%cI",
            "--end-of-options",
            `${sha}^{commit}`
          ])).split("\n");
          return { sha: full, subject, at };
        } catch (error) {
          if (error instanceof GitFailed) {
            throw new ReportInvalid(
              file,
              `committed[${index}].sha`,
              `no commit ${sha} in the workspace`
            );
          }
          throw error;
        }
      })
    );
  }
};

// src/commands/open-command.ts
var OpenCommand = class {
  run(ledger) {
    const lines = [...ledger.runs].toSorted(([a], [b]) => a.localeCompare(b)).flatMap(
      ([project, run2]) => run2.open.map(
        ({ title, target }) => `${project}: ${title} (${target})
`
      )
    );
    return { exitCode: lines.length > 0 ? 0 : 1, stdout: lines.join("") };
  }
};

// src/commands/release-command.ts
var ReleaseCommand = class {
  #store;
  #guard;
  #paths;
  constructor(store, guard, paths) {
    this.#store = store;
    this.#guard = guard;
    this.#paths = paths;
  }
  /** No paths given releases every claimed path. */
  async run(project, release, given) {
    const claim = await this.#store.read(project);
    const paths = given.length === 0 ? claim.paths : given;
    const unknown = paths.filter((path) => !claim.paths.includes(path));
    if (unknown.length > 0) {
      throw new NotClaimed(project, unknown);
    }
    if (release === "revert") {
      await this.#guard.asLeft(claim, paths, "release --revert");
      for (const path of paths) {
        await this.#paths.restore(claim.head, path);
      }
    }
    const rest = claim.without(paths);
    await (rest === "empty" ? this.#store.remove(project) : this.#store.replace(rest));
    return { exitCode: 0, stdout: "" };
  }
};

// src/commands/repo-command.ts
var RepoCommand = class {
  #state;
  #config;
  constructor(state, config) {
    this.#state = state;
    this.#config = config;
  }
  run() {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(
        {
          state: this.#state,
          guide: this.#config.guide,
          map: this.#config.map
        },
        null,
        2
      )}
`
    };
  }
};

// src/commands/show-command.ts
var ShowCommand = class {
  #workspace;
  constructor(workspace) {
    this.#workspace = workspace;
  }
  async run(name, ledger) {
    const project = await this.#workspace.project(name);
    const run2 = ledger.runs.get(project.name);
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(run2 ?? { state: "never-run" }, null, 2)}
`
    };
  }
};

// src/commands/stamp-command.ts
var StampCommand = class {
  #repoRoot;
  #store;
  #paths;
  constructor(repoRoot, store, paths) {
    this.#repoRoot = repoRoot;
    this.#store = store;
    this.#paths = paths;
  }
  /** No paths given stamps every claimed path. */
  async run(project, given, now) {
    const claim = await this.#store.read(project);
    const paths = given.length === 0 ? claim.paths : given;
    const unknown = paths.filter((path) => !claim.paths.includes(path));
    if (unknown.length > 0) {
      throw new NotClaimed(project, unknown);
    }
    const drafts = /* @__PURE__ */ new Map();
    for (const path of paths) {
      const state = await readPathState(this.#repoRoot, path);
      drafts.set(
        path,
        state.kind === "absent" ? state : { ...state, blob: await this.#paths.keep(path) }
      );
    }
    await this.#store.replace(claim.stamped(now.toString(), drafts));
    return {
      exitCode: 0,
      stdout: [...drafts].map(([path, draft]) => `${path} ${formatPathState(draft)}
`).join("")
    };
  }
};

// src/evidence/evidence-budget.ts
var BUDGET = 12e4;
var TIERS = [
  "transcript:prompt",
  "consumer-commit",
  "consumer-site",
  "package-commit",
  "transcript:assistant-text",
  "transcript:tool-input"
];
var EvidenceBudget = class {
  cut(records) {
    const ordered = TIERS.flatMap(
      (tier) => this.#ordered(records.filter((record2) => tierOf(record2) === tier))
    );
    const kept = [];
    let size = 0;
    for (const record2 of ordered) {
      const bytes = lineBytes(record2);
      if (size + bytes > BUDGET) {
        break;
      }
      kept.push(record2);
      size += bytes;
    }
    if (kept.length === ordered.length) {
      return kept;
    }
    let omitted = this.#omitted(ordered, kept);
    while (size + lineBytes(omitted) > BUDGET) {
      const last = kept.pop();
      if (last === void 0) {
        break;
      }
      size -= lineBytes(last);
      omitted = this.#omitted(ordered, kept);
    }
    return [...kept, omitted];
  }
  /**
   * Newest first. Transcript texts and tool inputs go by session, the session
   * with the newest record first, so a cut drops whole older sessions.
   */
  #ordered(records) {
    const latest = /* @__PURE__ */ new Map();
    for (const record2 of records) {
      if (record2.source === "transcript") {
        const seen = latest.get(record2.session);
        const at = instant(record2);
        if (seen === void 0 || Temporal.Instant.compare(at, seen) > 0) {
          latest.set(record2.session, at);
        }
      }
    }
    const bySession = (a, b) => {
      if (a.source !== "transcript" || b.source !== "transcript" || a.kind === "prompt" || a.session === b.session) {
        return 0;
      }
      const [endA, endB] = [latest.get(a.session), latest.get(b.session)];
      return (endA === void 0 || endB === void 0 ? 0 : Temporal.Instant.compare(endB, endA)) || a.session.localeCompare(b.session);
    };
    return records.toSorted((a, b) => bySession(a, b) || newestFirst(a, b));
  }
  #omitted(ordered, kept) {
    const left = ordered.slice(kept.length);
    const count = (tier) => left.filter((record2) => tierOf(record2) === tier).length;
    const oldest = kept.toSorted(newestFirst).at(-1);
    return {
      source: "omitted",
      omitted: {
        "transcript:prompt": count("transcript:prompt"),
        "consumer-commit": count("consumer-commit"),
        "consumer-site": count("consumer-site"),
        "package-commit": count("package-commit"),
        "transcript:assistant-text": count("transcript:assistant-text"),
        "transcript:tool-input": count("transcript:tool-input")
      },
      oldestKept: oldest === void 0 ? null : oldest.ts
    };
  }
};
function tierOf(record2) {
  return record2.source === "transcript" ? transcriptTier(record2) : record2.source;
}
function transcriptTier(record2) {
  return `transcript:${record2.kind}`;
}
function instant(record2) {
  return Temporal.Instant.from(record2.ts);
}
function newestFirst(a, b) {
  return Temporal.Instant.compare(instant(b), instant(a)) || a.ref.localeCompare(b.ref);
}
function lineBytes(record2) {
  return Buffer.byteLength(`${JSON.stringify(record2)}
`);
}

// src/evidence/consumer-repos.ts
import { readFile as readFile4, realpath } from "node:fs/promises";
import { join as join7 } from "node:path";

// node_modules/@deepagents/trajectory/dist/index.js
var import_agent_traces = __toESM(require_dist(), 1);
import { readFile as readFile3, readdir as readdir2 } from "node:fs/promises";
import { join as join22 } from "node:path";
import { basename as basename2, dirname as dirname2, join as join6 } from "node:path";
import { open, readFile as readFile22, readdir as readdir22, stat } from "node:fs/promises";
import { dirname as dirname22, join as join32 } from "node:path";
var import_agent_traces2 = __toESM(require_dist(), 1);
var ATIF_SCHEMA_VERSION = "ATIF-v1.8";
var SessionReadError = class extends Error {
  name = "SessionReadError";
  path;
  constructor(path, message, options) {
    super(`${message}: ${path}`, options);
    this.path = path;
  }
};
var SUBAGENT_FILE = /^agent-(.+)\.jsonl$/;
var placeInChain = /* @__PURE__ */ Symbol("placeInChain");
var ClaudeCodeSession = class _ClaudeCodeSession {
  sessionId;
  transcriptPath;
  /** The run this segment belongs to: the first session id of its /clear chain (ADR 0007). */
  runId;
  /** The next segment's transcript, when the chain continues after this one. */
  continuedBy;
  constructor(sessionId, transcriptPath, runId, continuedBy) {
    this.sessionId = sessionId;
    this.transcriptPath = transcriptPath;
    this.runId = runId;
    this.continuedBy = continuedBy;
  }
  /** The session of a main transcript path, such as a hook's `transcript_path`. */
  static fromTranscriptPath(path) {
    const name = basename2(path);
    if (!name.endsWith(".jsonl") || basename2(dirname2(path)) === "subagents") {
      throw new TypeError(
        `not a Claude Code main transcript (expected <session-id>.jsonl; a subagent file is a ClaudeCodeSubagent): ${path}`
      );
    }
    const sessionId = name.slice(0, -".jsonl".length);
    return new _ClaudeCodeSession(sessionId, path, sessionId, void 0);
  }
  /** The chain gives each segment its run and its successor. */
  static [placeInChain](session, runId, continuedBy) {
    return new _ClaudeCodeSession(
      session.sessionId,
      session.transcriptPath,
      runId,
      continuedBy
    );
  }
  /** The folder that holds this session's subagent transcripts. */
  get subagentsPath() {
    return join6(dirname2(this.transcriptPath), this.sessionId, "subagents");
  }
};
var ClaudeCodeSubagent = class _ClaudeCodeSubagent {
  agentId;
  /** The session that started this subagent. */
  sessionId;
  transcriptPath;
  constructor(agentId, sessionId, transcriptPath) {
    this.agentId = agentId;
    this.sessionId = sessionId;
    this.transcriptPath = transcriptPath;
  }
  /** The subagent of a subagent transcript path, such as a hook's `agent_transcript_path`. */
  static fromTranscriptPath(path) {
    const match = SUBAGENT_FILE.exec(basename2(path));
    const subagents = dirname2(path);
    if (!match || basename2(subagents) !== "subagents") {
      throw new TypeError(
        `not a Claude Code subagent transcript (expected <session-id>/subagents/agent-<id>.jsonl): ${path}`
      );
    }
    return new _ClaudeCodeSubagent(match[1], basename2(dirname2(subagents)), path);
  }
  /** The `.meta.json` file beside the transcript, which names the call that spawned it. */
  get metaPath() {
    return this.transcriptPath.replace(/\.jsonl$/, ".meta.json");
  }
  /** ATIF's per-document id of this subagent's trajectory. */
  get trajectoryId() {
    return `agent-${this.agentId}`;
  }
};
var ClaudeCodeAdapter = class {
  agent = "claude-code";
  async read(session, options = {}) {
    const path = session.transcriptPath;
    let text;
    try {
      text = await readFile3(path, "utf8");
    } catch (cause) {
      throw new SessionReadError(path, "could not read the transcript", {
        cause
      });
    }
    const diagnostics = [];
    const steps = [];
    const messages = /* @__PURE__ */ new Map();
    const calls = /* @__PURE__ */ new Map();
    const meta = {};
    const unmapped = /* @__PURE__ */ new Map();
    let version;
    const isMain = session instanceof ClaudeCodeSession;
    for (const { entry, line } of entries(text, path, diagnostics)) {
      version ??= stringOr(entry.version);
      if (isMain && entry.isSidechain === true) {
        diagnostics.push({
          code: "sidechain_entry",
          path,
          line,
          message: "an isSidechain row inside a main transcript belongs to a subagent"
        });
        continue;
      }
      if (entry.type === "assistant") {
        const step = agentStep(entry, messages, steps.length + 1);
        if (step.step_id === steps.length + 1) steps.push(step);
        for (const call of step.tool_calls ?? [])
          calls.set(call.tool_call_id, step);
      } else if (entry.type === "user" && toolResults(entry).length > 0) {
        for (const block of toolResults(entry)) {
          const id = stringOr(block.tool_use_id) ?? "";
          const caller = calls.get(id);
          if (!caller) {
            diagnostics.push({
              code: "orphan_tool_result",
              path,
              line,
              message: `no call ${id} in the transcript for this tool result`
            });
            continue;
          }
          caller.observation ??= { results: [] };
          caller.observation.results.push(observationResult(entry, block));
        }
      } else if (entry.type === "user") {
        steps.push(personStep(entry, steps.length + 1));
      } else if (entry.type === "attachment" && record(entry.attachment)?.type === "queued_command") {
        steps.push(queuedStep(entry, steps.length + 1));
      } else if (entry.type === "attachment") {
        steps.push(attachmentStep(entry, steps.length + 1));
      } else if (entry.type === "system") {
        steps.push(systemRowStep(entry, steps.length + 1));
      } else if (!collectSessionEntry(entry, meta)) {
        const type = stringOr(entry.type) ?? "(no type)";
        unmapped.set(type, (unmapped.get(type) ?? 0) + 1);
      }
    }
    for (const [entryType, count] of unmapped) {
      diagnostics.push({
        code: "unmapped_entry",
        path,
        entryType,
        count,
        message: `${count} ${entryType} entries are bookkeeping with no step`
      });
    }
    const [first, ...rest] = steps;
    if (!first) {
      throw new SessionReadError(path, "the transcript holds no step");
    }
    const model = steps.find(
      (step) => step.source === "agent" && step.model_name != null
    )?.model_name;
    const trajectory = {
      schema_version: ATIF_SCHEMA_VERSION,
      ...isMain ? {
        session_id: session.runId,
        ...session.continuedBy ? { continued_trajectory_ref: session.continuedBy } : {}
      } : {
        session_id: session.sessionId,
        trajectory_id: session.trajectoryId
      },
      agent: {
        name: this.agent,
        version: version ?? "unknown",
        ...model ? { model_name: model } : {}
      },
      steps: [first, ...rest],
      final_metrics: finalMetrics(steps),
      ...Object.keys(meta).length > 0 ? { extra: { claude_code: meta } } : {}
    };
    if (isMain && options.subagents !== false) {
      const embedded = await this.#subagents(session, trajectory, diagnostics);
      if (embedded.length > 0) trajectory.subagent_trajectories = embedded;
    }
    return { trajectory, diagnostics };
  }
  /**
   * Each `<session>/subagents/agent-*.jsonl`, in name order, as an embedded
   * trajectory. The spawning call's result refers to it through the meta
   * file's `toolUseId`, searched in the root and in every other subagent, so a
   * subagent that another subagent started links too.
   */
  async #subagents(session, root, diagnostics) {
    let names2;
    try {
      names2 = await readdir2(session.subagentsPath);
    } catch (error) {
      if (errnoCode(error) === "ENOENT") return [];
      throw new SessionReadError(
        session.subagentsPath,
        "could not list the subagents",
        {
          cause: error
        }
      );
    }
    const embedded = [];
    for (const name of names2.filter((file) => /^agent-.+\.jsonl$/.test(file)).toSorted()) {
      const subagent = ClaudeCodeSubagent.fromTranscriptPath(
        join22(session.subagentsPath, name)
      );
      try {
        const result = await this.read(subagent, { subagents: false });
        diagnostics.push(...result.diagnostics);
        embedded.push({ subagent, trajectory: result.trajectory });
      } catch (error) {
        if (!(error instanceof SessionReadError)) throw error;
        diagnostics.push({
          code: "unreadable_subagent",
          path: subagent.transcriptPath,
          message: error.message
        });
      }
    }
    const results = /* @__PURE__ */ new Map();
    for (const trajectory of [
      root,
      ...embedded.map((entry) => entry.trajectory)
    ]) {
      for (const step of trajectory.steps) {
        for (const result of step.observation?.results ?? []) {
          if (result.source_call_id) results.set(result.source_call_id, result);
        }
      }
    }
    for (const { subagent, trajectory } of embedded) {
      const spawnedBy = stringOr(
        record(await readJson(subagent.metaPath))?.toolUseId
      );
      const result = spawnedBy ? results.get(spawnedBy) : void 0;
      if (!result) {
        diagnostics.push({
          code: "unlinked_subagent",
          path: subagent.transcriptPath,
          message: spawnedBy ? `no result of call ${spawnedBy} spawned this subagent` : "no meta file names the call that spawned this subagent"
        });
        continue;
      }
      result.subagent_trajectory_ref = [
        ...result.subagent_trajectory_ref ?? [],
        {
          trajectory_id: trajectory.trajectory_id,
          session_id: trajectory.session_id
        }
      ];
    }
    return embedded.map((entry) => entry.trajectory);
  }
};
function personStep(entry, stepId) {
  const origin = record(entry.origin)?.kind;
  const isMeta = entry.isMeta === true;
  const message = textOf(record(entry.message)?.content);
  const claudeCode = {
    ...identity(entry),
    ...typeof origin === "string" ? { origin } : {},
    ...isMeta ? { is_meta: true } : {}
  };
  const source = typeof origin === "string" || !isMeta ? "user" : "system";
  return {
    step_id: stepId,
    source,
    timestamp: stringOr(entry.timestamp),
    message,
    extra: { claude_code: claudeCode }
  };
}
function agentStep(entry, messages, nextStepId) {
  const message = record(entry.message) ?? {};
  const id = stringOr(message.id) ?? stringOr(entry.uuid) ?? String(nextStepId);
  let known = messages.get(id);
  if (!known) {
    const claudeCode2 = { ...identity(entry), message_id: id };
    known = {
      claudeCode: claudeCode2,
      step: {
        step_id: nextStepId,
        source: "agent",
        timestamp: stringOr(entry.timestamp),
        message: "",
        extra: { claude_code: claudeCode2 }
      }
    };
    messages.set(id, known);
  }
  const { step, claudeCode } = known;
  const model = stringOr(message.model);
  if (model && model !== SYNTHETIC_MODEL) step.model_name = model;
  const requestId = stringOr(entry.requestId);
  if (requestId) claudeCode.request_id = requestId;
  const stopReason = stringOr(message.stop_reason);
  if (stopReason) claudeCode.stop_reason = stopReason;
  const usage = record(message.usage);
  if (usage) step.metrics = metricsOf(usage);
  for (const block of Array.isArray(message.content) ? message.content : []) {
    const part = record(block);
    if (part?.type === "text" && typeof part.text === "string") {
      step.message = step.message === "" ? part.text : `${String(step.message)}
${part.text}`;
    } else if (part?.type === "thinking" && typeof part.thinking === "string") {
      step.reasoning_content = step.reasoning_content == null ? part.thinking : `${step.reasoning_content}
${part.thinking}`;
    } else if (part?.type === "tool_use") {
      step.tool_calls ??= [];
      step.tool_calls.push({
        tool_call_id: stringOr(part.id) ?? "",
        function_name: stringOr(part.name) ?? "",
        arguments: record(part.input) ?? {}
      });
    }
  }
  return step;
}
var SYNTHETIC_MODEL = "<synthetic>";
function metricsOf(usage) {
  const input = numberOr(usage.input_tokens);
  const cacheCreation = numberOr(usage.cache_creation_input_tokens);
  const cacheRead = numberOr(usage.cache_read_input_tokens);
  return {
    prompt_tokens: input + cacheCreation + cacheRead,
    completion_tokens: numberOr(usage.output_tokens),
    cached_tokens: cacheRead,
    extra: {
      input_tokens: input,
      cache_creation_input_tokens: cacheCreation,
      cache_read_input_tokens: cacheRead
    }
  };
}
function toolResults(entry) {
  const content = record(entry.message)?.content;
  return Array.isArray(content) ? content.flatMap(
    (block) => isRecord2(block) && block.type === "tool_result" ? [block] : []
  ) : [];
}
function observationResult(entry, block) {
  const content = typeof block.content === "string" ? block.content : textParts(block.content);
  return {
    source_call_id: stringOr(block.tool_use_id),
    content,
    extra: {
      claude_code: {
        ...identity(entry),
        is_error: block.is_error === true,
        ...entry.toolUseResult === void 0 ? {} : { tool_use_result: entry.toolUseResult }
      }
    }
  };
}
function textParts(content) {
  if (!Array.isArray(content)) return [];
  return content.flatMap(
    (block) => isRecord2(block) && block.type === "text" && typeof block.text === "string" ? [{ type: "text", text: block.text }] : []
  );
}
function numberOr(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function attachmentStep(entry, stepId) {
  const attachment = record(entry.attachment) ?? {};
  const content = attachment.content;
  let message = "";
  if (Array.isArray(content)) {
    message = content.filter((part) => typeof part === "string").join("\n");
  } else if (typeof content === "string") {
    message = content;
  }
  return {
    step_id: stepId,
    source: "system",
    timestamp: stringOr(entry.timestamp),
    message,
    extra: { claude_code: { ...identity(entry), attachment } }
  };
}
function systemRowStep(entry, stepId) {
  return {
    step_id: stepId,
    source: "system",
    timestamp: stringOr(entry.timestamp),
    message: typeof entry.content === "string" ? entry.content : "",
    extra: { claude_code: { ...identity(entry), system: entry } }
  };
}
function collectSessionEntry(entry, meta) {
  switch (entry.type) {
    case "derived-from":
      meta.derived_from = Array.isArray(entry.sessions) ? entry.sessions : [];
      return true;
    case "ai-title":
      if (typeof entry.aiTitle === "string") meta.ai_title = entry.aiTitle;
      return true;
    case "custom-title":
      if (typeof entry.customTitle === "string")
        meta.custom_title = entry.customTitle;
      return true;
    case "summary":
      if (typeof entry.summary === "string") {
        const summaries = Array.isArray(meta.summaries) ? meta.summaries : [];
        meta.summaries = [...summaries, entry.summary];
      }
      return true;
    case "pr-link": {
      const links = Array.isArray(meta.pr_links) ? meta.pr_links : [];
      meta.pr_links = [...links, entry];
      return true;
    }
    default:
      return false;
  }
}
function finalMetrics(steps) {
  let prompt = 0;
  let completion = 0;
  let cached = 0;
  for (const step of steps) {
    if (step.source !== "agent" || !step.metrics) continue;
    prompt += step.metrics.prompt_tokens ?? 0;
    completion += step.metrics.completion_tokens ?? 0;
    cached += step.metrics.cached_tokens ?? 0;
  }
  return {
    total_prompt_tokens: prompt,
    total_completion_tokens: completion,
    total_cached_tokens: cached,
    total_steps: steps.length
  };
}
function queuedStep(entry, stepId) {
  const attachment = record(entry.attachment) ?? {};
  const origin = record(attachment.origin)?.kind;
  return {
    step_id: stepId,
    source: "user",
    timestamp: stringOr(entry.timestamp),
    message: typeof attachment.prompt === "string" ? attachment.prompt : "",
    extra: {
      claude_code: {
        ...identity(entry),
        ...typeof origin === "string" ? { origin } : {},
        queued: true
      }
    }
  };
}
function identity(entry) {
  const keys = {
    uuid: entry.uuid,
    parent_uuid: entry.parentUuid,
    timestamp: entry.timestamp,
    cwd: entry.cwd,
    entrypoint: entry.entrypoint,
    prompt_id: entry.promptId
  };
  return Object.fromEntries(
    Object.entries(keys).filter(([, value]) => value !== void 0)
  );
}
function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.flatMap(
    (block) => isRecord2(block) && block.type === "text" && typeof block.text === "string" ? [block.text] : []
  ).join("\n");
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function record(value) {
  return isRecord2(value) ? value : void 0;
}
function errnoCode(error) {
  return isRecord2(error) ? error.code : void 0;
}
function stringOr(value) {
  return typeof value === "string" ? value : void 0;
}
function* entries(text, path, diagnostics) {
  const lines = text.split("\n");
  for (const [index, raw] of lines.entries()) {
    if (raw.trim() === "") continue;
    const line = index + 1;
    const entry = parseObject(raw);
    if (entry) {
      yield { entry, line };
    } else if (index === lines.length - 1) {
      diagnostics.push({
        code: "partial_last_line",
        path,
        line,
        message: "the last line is not yet complete JSON; the agent may still be writing it"
      });
    } else {
      diagnostics.push({
        code: "invalid_json_line",
        path,
        line,
        message: "the line is not a JSON object"
      });
    }
  }
}
function parseObject(raw) {
  try {
    const value = JSON.parse(raw);
    return record(value);
  } catch {
    return void 0;
  }
}
async function readJson(path) {
  try {
    return JSON.parse(await readFile3(path, "utf8"));
  } catch {
    return void 0;
  }
}
var HEAD_BYTES = 64 * 1024;
var ClaudeCodeStore = class {
  root;
  constructor(options) {
    this.root = options.root;
  }
  /**
   * Each main transcript (`projects/<project>/<id>.jsonl`) changed at or after
   * `since`, newest first, with the first `cwd` of its first 64 KB (ADR 0008's
   * amendment). It never reads a whole transcript, and subagent transcripts are
   * not sessions.
   */
  async *sessions(options) {
    const since = options.since.getTime();
    const found2 = [];
    for (const project of await this.#projects()) {
      for (const name of await listOrEmpty(project)) {
        if (!name.endsWith(".jsonl")) continue;
        const path = join32(project, name);
        const changed = (await stat(path)).mtimeMs;
        if (changed >= since) found2.push({ path, changed });
      }
    }
    for (const { path } of found2.toSorted((a, b) => b.changed - a.changed)) {
      yield {
        session: ClaudeCodeSession.fromTranscriptPath(path),
        cwd: await headCwd(path)
      };
    }
  }
  /** The session whose transcript a project holds, or undefined when none does. */
  async session(sessionId) {
    if (!isSessionId(sessionId)) return void 0;
    for (const project of await this.#projects()) {
      const path = join32(project, `${sessionId}.jsonl`);
      if (await isFile(path)) return ClaudeCodeSession.fromTranscriptPath(path);
    }
    return void 0;
  }
  /**
   * The segments of the session's /clear chain, oldest first (ADR 0007, as
   * agent-plugin housekeeping's `lib/session.mjs` walks it). It follows every
   * `claude_code_session` a `derived-from` entry names, whatever its `via`,
   * skips ids already in the chain (a resume names its own session), and looks
   * beside the current transcript before every project. Each segment carries
   * the chain's first id as its run and the next segment's transcript.
   */
  async chain(session) {
    const seen = /* @__PURE__ */ new Set();
    const found2 = [];
    const missing = [];
    const queue = [
      { id: session.sessionId, segment: session }
    ];
    for (let next = queue.shift(); next; next = queue.shift()) {
      if (seen.has(next.id)) continue;
      seen.add(next.id);
      if (!next.segment) {
        missing.push(next.id);
        continue;
      }
      found2.push(next.segment);
      for (const id of await derivedFrom(next.segment.transcriptPath)) {
        if (seen.has(id)) continue;
        const beside = join32(
          dirname22(next.segment.transcriptPath),
          `${id}.jsonl`
        );
        const segment = isSessionId(id) && await isFile(beside) ? ClaudeCodeSession.fromTranscriptPath(beside) : await this.session(id);
        queue.push({ id, segment });
      }
    }
    const oldestFirst = found2.toReversed();
    const runId = oldestFirst[0]?.sessionId ?? session.sessionId;
    return {
      sessions: oldestFirst.map(
        (segment, index) => ClaudeCodeSession[placeInChain](
          segment,
          runId,
          oldestFirst[index + 1]?.transcriptPath
        )
      ),
      missing
    };
  }
  async #projects() {
    const projects = join32(this.root, "projects");
    const names2 = await listOrEmpty(projects);
    return names2.map((name) => join32(projects, name));
  }
};
async function derivedFrom(path) {
  let text;
  try {
    text = await readFile22(path, "utf8");
  } catch (cause) {
    throw new SessionReadError(path, "could not read the transcript", {
      cause
    });
  }
  const ids = [];
  for (const line of text.split("\n")) {
    if (!line.includes('"derived-from"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (!isRecord22(entry) || entry.type !== "derived-from" || !Array.isArray(entry.sessions)) {
      continue;
    }
    for (const from of entry.sessions) {
      if (isRecord22(from) && from.type === "claude_code_session" && typeof from.id === "string") {
        ids.push(from.id);
      }
    }
  }
  return ids;
}
async function headCwd(path) {
  await using file = await open(path).catch((error) => {
    const code = isRecord22(error) ? error.code : void 0;
    if (code === "ENOENT" || code === "EACCES") return void 0;
    throw error;
  });
  if (file === void 0) return void 0;
  const head = Buffer.alloc(HEAD_BYTES);
  const { bytesRead } = await file.read(head, 0, HEAD_BYTES, 0);
  for (const line of head.toString("utf8", 0, bytesRead).split("\n")) {
    if (!line.includes('"cwd"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (isRecord22(entry) && typeof entry.cwd === "string") return entry.cwd;
  }
  return void 0;
}
async function listOrEmpty(path) {
  try {
    return await readdir22(path);
  } catch (error) {
    const code = isRecord22(error) ? error.code : void 0;
    if (code === "ENOENT" || code === "ENOTDIR") return [];
    throw error;
  }
}
async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (isRecord22(error) && error.code === "ENOENT") return false;
    throw error;
  }
}
function isSessionId(id) {
  return id !== "" && id !== "." && id !== ".." && !/[/\\]/.test(id);
}
function isRecord22(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/evidence/excerpt.ts
var TEXT_EXCERPT = 1500;
var TOOL_INPUT_EXCERPT = 800;
function excerpt(text, needles, length) {
  if (text.length <= length) {
    return text;
  }
  const hits = needles.map((needle) => text.indexOf(needle)).filter((index) => index >= 0);
  const anchor = hits.length > 0 ? Math.min(...hits) : 0;
  const before = Math.floor(length / 3);
  const start = Math.max(0, Math.min(anchor - before, text.length - length));
  const end = start + length;
  return `${start > 0 ? "\u2026" : ""}${text.slice(start, end)}${end < text.length ? "\u2026" : ""}`;
}

// src/evidence/consumer-repos.ts
var SITES_PER_REPO = 20;
var FIELD = "";
var ConsumerRepos = class {
  #claude;
  #workspace;
  constructor(claude, workspace) {
    this.#claude = claude;
    this.#workspace = workspace;
  }
  async discover() {
    const excluded = await this.#excluded();
    const workspace = await realpath(this.#workspace.directory);
    const outside = (path) => !this.#claude.holds(path) && !excluded.some((prefix) => under(path, prefix));
    const cwds = /* @__PURE__ */ new Set();
    const sessions = new ClaudeCodeStore({ root: this.#claude.root }).sessions({
      since: /* @__PURE__ */ new Date(0)
    });
    for await (const { cwd } of sessions) {
      if (cwd !== void 0 && outside(cwd)) {
        cwds.add(cwd);
      }
    }
    const tops = /* @__PURE__ */ new Set();
    for (const cwd of cwds) {
      try {
        tops.add(
          (await this.#workspace.at(cwd).run(["rev-parse", "--show-toplevel"])).trim()
        );
      } catch (error) {
        if (!(error instanceof GitFailed)) {
          throw error;
        }
      }
    }
    return [...tops].filter((top) => top !== workspace && outside(top)).toSorted().map((top) => new ConsumerRepo(this.#workspace.at(top)));
  }
  /** The prefixes the user excluded; no config file means none. */
  async #excluded() {
    const file = join7(this.#claude.state, "config.json");
    let text;
    try {
      text = await readFile4(file, "utf8");
    } catch (error) {
      if (isMissing2(error)) {
        return [];
      }
      throw error;
    }
    const value = JSON.parse(text);
    if (typeof value === "object" && value !== null && "exclude" in value && Array.isArray(value.exclude) && value.exclude.every((prefix) => typeof prefix === "string")) {
      return value.exclude.filter(
        (prefix) => typeof prefix === "string"
      );
    }
    throw new TypeError(`${file} must be {"exclude": ["/absolute/prefix"]}`);
  }
};
var ConsumerRepo = class {
  path;
  #git;
  constructor(git) {
    this.path = git.directory;
    this.#git = git;
  }
  /** The npm names a tracked package.json of the repo declares. */
  async declares(npmNames) {
    const found2 = await this.#git.grep([
      "-h",
      "-o",
      "-F",
      ...npmNames.flatMap((name) => ["-e", `"${name}"`]),
      "--",
      "*package.json"
    ]);
    return new Set(
      found2.split("\n").filter(Boolean).map((quoted) => quoted.slice(1, -1))
    );
  }
  /** The lines that name the package today, outside the manifests. */
  async sites(project) {
    const ts = (await this.#git.run(["log", "-1", "--format=%cI"])).trim();
    const found2 = await this.#git.grep([
      "-n",
      "-I",
      "-F",
      "-e",
      project.npmName,
      "--",
      ":!*package.json",
      ":!package-lock.json"
    ]);
    return found2.split("\n").filter(Boolean).slice(0, SITES_PER_REPO).map((line) => {
      const [file = "", number = "", ...text] = line.split(":");
      return {
        source: "consumer-site",
        ts,
        ref: `${this.path}/${file}:${number}`,
        text: excerpt(text.join(":"), project.needles, TEXT_EXCERPT),
        repo: this.path
      };
    });
  }
  /** The commits since a start that add or remove a line naming the package. */
  async commits(project, since) {
    const log = await this.#git.run([
      "log",
      ...since.gitArgs(),
      `-G${project.npmName.replaceAll(/[.[\]*^$\\]/g, "\\$&")}`,
      `--format=%H${FIELD}%cI${FIELD}%s`
    ]);
    return log.split("\n").filter(Boolean).map((line) => {
      const [sha = "", ts = "", subject = ""] = line.split(FIELD);
      return {
        source: "consumer-commit",
        ts,
        ref: sha,
        text: subject,
        repo: this.path
      };
    });
  }
};
function isMissing2(error) {
  return Error.isError(error) && "code" in error && error.code === "ENOENT";
}

// src/evidence/package-history.ts
var RECORD = "";
var FIELD2 = "";
var PATHS_PER_COMMIT = 5;
var PackageHistory = class {
  #git;
  constructor(git) {
    this.#git = git;
  }
  async commits(project, since) {
    const log = await this.#git.run([
      "log",
      ...since.gitArgs(),
      `--format=${RECORD}%H${FIELD2}%cI${FIELD2}%s`,
      "--name-only",
      "--",
      project.root
    ]);
    const records = [];
    for (const entry of log.split(RECORD).slice(1)) {
      const [header = "", ...files] = entry.split("\n").filter(Boolean);
      const [sha = "", ts = "", subject = ""] = header.split(FIELD2);
      if (files.some((file) => !file.endsWith(".md"))) {
        records.push({
          source: "package-commit",
          ts,
          ref: sha,
          text: [
            subject,
            ...files.slice(0, PATHS_PER_COMMIT),
            ...files.length > PATHS_PER_COMMIT ? [`and ${files.length - PATHS_PER_COMMIT} more`] : []
          ].join("\n")
        });
      }
    }
    return records;
  }
};

// src/evidence/transcripts.ts
import { readFile as readFile5 } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { basename as basename3, dirname as dirname3 } from "node:path";

// src/evidence/transcript-selection.ts
var PER_SESSION = 12;
var TranscriptSelection = class {
  select(records) {
    const sessions = Map.groupBy(
      this.#unique(this.#oldestFirst(records)),
      ({ session }) => session
    );
    return [...sessions.values()].flatMap((session) => this.#capped(session)).toSorted(byTime);
  }
  /**
   * Oldest first. A copied line keeps its timestamp, so of two records at one
   * instant, the one of the session that ended first, the original, comes
   * first: the files are read in parallel, in no fixed order.
   */
  #oldestFirst(records) {
    const ends = /* @__PURE__ */ new Map();
    for (const { session, ts } of records) {
      const end2 = ends.get(session);
      if (end2 === void 0 || ts > end2) {
        ends.set(session, ts);
      }
    }
    const end = (record2) => ends.get(record2.session) ?? "";
    return records.toSorted(
      (a, b) => byTime(a, b) || end(a).localeCompare(end(b))
    );
  }
  /** Each text once, in the session that gave it first. */
  #unique(records) {
    const first = /* @__PURE__ */ new Map();
    return records.filter(({ kind, text, session }) => {
      const key = `${kind}\0${text}`;
      const owner = first.get(key) ?? session;
      first.set(key, owner);
      return owner === session;
    });
  }
  /** One session's records, oldest first, as many as PER_SESSION allows. */
  #capped(session) {
    const newest = (records, count) => records.slice(Math.max(0, records.length - count));
    const prompts = newest(
      session.filter(({ kind }) => kind === "prompt"),
      PER_SESSION
    );
    const others = newest(
      session.filter(({ kind }) => kind !== "prompt"),
      PER_SESSION - prompts.length
    );
    return [...prompts, ...others];
  }
};
function byTime(a, b) {
  return a.ts.localeCompare(b.ts);
}

// src/evidence/transcripts.ts
var UPDATE_DOCS = /^\/(?:[\w-]+:)?update-docs(?:\s|$)|<command-name>\/(?:[\w-]+:)?update-docs<\/command-name>/;
var TranscriptArchive = class {
  #claude;
  #repoRoot;
  #selection = new TranscriptSelection();
  #adapter = new ClaudeCodeAdapter();
  constructor(claude, repoRoot) {
    this.#claude = claude;
    this.#repoRoot = repoRoot;
  }
  async scan(watches) {
    const found2 = new Map(
      watches.map(({ project }) => [project.name, []])
    );
    const sessions = await this.#sessions(
      Since.earliest(watches.map(({ since }) => since))
    );
    const needles = [
      ...new Set(watches.flatMap(({ project }) => project.needles))
    ].map((needle) => Buffer.from(needle));
    const next = sessions[Symbol.iterator]();
    const worker = async () => {
      for (const listed of next) {
        const buffer = await readFile5(listed.session.transcriptPath);
        if (needles.some((needle) => buffer.includes(needle))) {
          for (const record2 of await this.#records(listed, watches)) {
            found2.get(record2.project)?.push(record2.record);
          }
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(16, availableParallelism() * 2) }, worker)
    );
    return new Map(
      [...found2].map(([project, records]) => [
        project,
        this.#selection.select(records)
      ])
    );
  }
  /**
   * The sessions changed since the start. One that ran under ~/.claude (a
   * tool or hook run), or that records no working folder, is dropped before
   * it is read.
   */
  async #sessions(since) {
    const listed = [];
    const store = new ClaudeCodeStore({ root: this.#claude.root });
    for await (const info of store.sessions({ since: since.toDate() })) {
      const { cwd } = info;
      if (cwd !== void 0 && !this.#claude.holds(cwd)) {
        listed.push({ ...info, cwd });
      }
    }
    return listed;
  }
  /**
   * The records of the steps before the session's first /update-docs prompt:
   * from that prompt on, the steps are that run's own work. A session with no
   * prompt before it is dropped. A session in the workspace gives no tool
   * input, since git history holds the package's own development; a
   * consumer's tool inputs show how it uses the package.
   */
  async #records({ session, cwd }, watches) {
    let steps;
    try {
      ({ steps } = (await this.#adapter.read(session, { subagents: false })).trajectory);
    } catch (error) {
      if (error instanceof SessionReadError) return [];
      throw error;
    }
    const before = [];
    let prompted = false;
    for (const step of steps) {
      const prompt = typedPrompt(step);
      if (prompt !== void 0 && UPDATE_DOCS.test(prompt)) break;
      prompted ||= prompt !== void 0;
      before.push(step);
    }
    if (!prompted) return [];
    const origin = under(cwd, this.#repoRoot) ? "workspace" : "consumer";
    const file = `${basename3(dirname3(session.transcriptPath))}/${basename3(session.transcriptPath)}`;
    const records = [];
    for (const step of before) {
      const uuid = claudeCodeOf(step)?.uuid;
      if (typeof step.timestamp !== "string" || typeof uuid !== "string") {
        continue;
      }
      for (const { kind, text } of found(step)) {
        if (kind === "tool-input" && origin === "workspace") continue;
        for (const { project, since } of watches) {
          if (project.names(text) && since.includesText(step.timestamp)) {
            records.push({
              project: project.name,
              record: {
                source: "transcript",
                kind,
                ts: step.timestamp,
                ref: `${file}#${uuid}`,
                text: excerpt(
                  text,
                  project.needles,
                  kind === "tool-input" ? TOOL_INPUT_EXCERPT : TEXT_EXCERPT
                ),
                session: session.sessionId,
                cwd
              }
            });
          }
        }
      }
    }
    return records;
  }
};
function typedPrompt(step) {
  const claudeCode = claudeCodeOf(step);
  if (step.source !== "user" || claudeCode?.is_meta === true || claudeCode?.origin !== void 0 && claudeCode.origin !== "human") {
    return void 0;
  }
  return typeof step.message === "string" ? step.message : void 0;
}
function claudeCodeOf(step) {
  const claudeCode = step.extra?.claude_code;
  return typeof claudeCode === "object" && claudeCode !== null ? claudeCode : void 0;
}
function* found(step) {
  const prompt = typedPrompt(step);
  if (prompt !== void 0) {
    yield { kind: "prompt", text: prompt };
    return;
  }
  if (step.source !== "agent") return;
  if (typeof step.message === "string" && step.message !== "") {
    yield { kind: "assistant-text", text: step.message };
  }
  for (const call of step.tool_calls ?? []) {
    yield { kind: "tool-input", text: JSON.stringify(call.arguments) };
  }
}

// src/evidence/evidence.ts
var Evidence = class {
  #history;
  #consumers;
  #transcripts;
  constructor(claude, git) {
    this.#history = new PackageHistory(git);
    this.#consumers = new ConsumerRepos(claude, git);
    this.#transcripts = new TranscriptArchive(claude, git.directory);
  }
  /** The records of each watched project, by project name. */
  async collect(watches) {
    const [transcripts, repos] = await Promise.all([
      this.#transcripts.scan(watches),
      this.#consumers.discover()
    ]);
    const npmNames = watches.map(({ project }) => project.npmName);
    const declared = await Promise.all(
      repos.map(async (repo) => ({
        repo,
        names: await repo.declares(npmNames)
      }))
    );
    const collected = /* @__PURE__ */ new Map();
    for (const { project, since } of watches) {
      const consumers = declared.filter(({ names: names2 }) => names2.has(project.npmName)).map(({ repo }) => repo);
      const sites = await Promise.all(
        consumers.map((repo) => repo.sites(project))
      );
      const commits = since.bounded ? await Promise.all(
        consumers.map((repo) => repo.commits(project, since))
      ) : [];
      collected.set(project.name, [
        ...await this.#history.commits(project, since),
        ...sites.flat(),
        ...commits.flat(),
        ...transcripts.get(project.name) ?? []
      ]);
    }
    return collected;
  }
};

// src/ledger/ledger.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { mkdir as mkdir4, readFile as readFile6, rename as rename2, writeFile as writeFile4 } from "node:fs/promises";
import { dirname as dirname4, join as join8 } from "node:path";

// src/ledger/items.ts
var QUEUED_KINDS = [
  "recipe",
  "readme-section",
  "concept",
  "glossary-term",
  "context-map-row",
  "adr",
  "stale-claim"
];
var Items = class {
  #shape;
  constructor(shape) {
    this.#shape = shape;
  }
  queued(value, path) {
    return this.#shape.list(value, path, (each, at) => {
      const item = this.#shape.object(each, at, [
        "kind",
        "title",
        "evidence",
        "reason"
      ]);
      return {
        kind: this.#shape.oneOf(item.get("kind"), `${at}.kind`, QUEUED_KINDS),
        title: this.#shape.text(item.get("title"), `${at}.title`),
        evidence: this.#shape.list(
          item.get("evidence"),
          `${at}.evidence`,
          (ref, p) => this.#shape.text(ref, p)
        ),
        reason: this.#shape.text(item.get("reason"), `${at}.reason`)
      };
    });
  }
  open(value, path) {
    return this.#shape.list(value, path, (each, at) => {
      const item = this.#shape.object(each, at, ["title", "target"]);
      return {
        title: this.#shape.text(item.get("title"), `${at}.title`),
        target: this.#shape.text(item.get("target"), `${at}.target`)
      };
    });
  }
  blocked(value, path) {
    return this.#shape.list(value, path, (each, at) => {
      const item = this.#shape.object(each, at, ["title", "target", "reason"]);
      return {
        title: this.#shape.text(item.get("title"), `${at}.title`),
        target: this.#shape.text(item.get("target"), `${at}.target`),
        reason: this.#shape.text(item.get("reason"), `${at}.reason`)
      };
    });
  }
};

// src/ledger/ledger.ts
var Ledger = class _Ledger {
  #file;
  #projects;
  constructor(file, projects) {
    this.#file = file;
    this.#projects = projects;
  }
  /** The ledger at file; before the first run there is none, so it is empty. */
  static async read(file) {
    let text;
    try {
      text = await readFile6(file, "utf8");
    } catch (error) {
      if (Error.isError(error) && "code" in error && error.code === "ENOENT") {
        return new _Ledger(file, /* @__PURE__ */ new Map());
      }
      throw error;
    }
    const shape = new Shape(
      (path, problem) => new LedgerCorrupt(file, path, problem)
    );
    const items = new Items(shape);
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new LedgerCorrupt(file, "the document", error.message);
      }
      throw error;
    }
    const projects = shape.record(
      shape.object(value, ROOT, ["projects"]).get("projects"),
      "projects"
    );
    return new _Ledger(
      file,
      new Map(
        Object.entries(projects).map(([name, value2]) => {
          const at = `projects.${name}`;
          const run2 = shape.object(value2, at, [
            "lastRun",
            "commits",
            "queued",
            "open",
            "blocked"
          ]);
          return [
            name,
            {
              lastRun: shape.instant(run2.get("lastRun"), `${at}.lastRun`),
              commits: shape.list(
                run2.get("commits"),
                `${at}.commits`,
                (each, p) => {
                  const commit = shape.object(each, p, [
                    "sha",
                    "subject",
                    "at"
                  ]);
                  return {
                    sha: shape.text(commit.get("sha"), `${p}.sha`),
                    subject: shape.text(commit.get("subject"), `${p}.subject`),
                    at: shape.instant(commit.get("at"), `${p}.at`)
                  };
                }
              ),
              queued: items.queued(run2.get("queued"), `${at}.queued`),
              open: items.open(run2.get("open"), `${at}.open`),
              blocked: items.blocked(run2.get("blocked"), `${at}.blocked`)
            }
          ];
        })
      )
    );
  }
  /** The projects a run finished for, by name. */
  get runs() {
    return this.#projects;
  }
  /**
   * The ledger after a run: its commits are added, and its queued, open and
   * blocked items replace the earlier ones, so a watched run that wrote a
   * queued candidate drops it.
   */
  finished(project, run2) {
    const before = this.#projects.get(project);
    return new _Ledger(
      this.#file,
      new Map([
        ...this.#projects,
        [
          project,
          {
            lastRun: run2.lastRun,
            commits: [...before?.commits ?? [], ...run2.commits],
            queued: run2.queued,
            open: run2.open,
            blocked: run2.blocked
          }
        ]
      ])
    );
  }
  /** Writes a temporary file beside the ledger, then renames it over it. */
  async write() {
    await mkdir4(dirname4(this.#file), { recursive: true });
    const temporary = join8(dirname4(this.#file), `.ledger-${randomUUID2()}.json`);
    const projects = Object.fromEntries(
      [...this.#projects].toSorted(([a], [b]) => a.localeCompare(b))
    );
    await writeFile4(temporary, `${JSON.stringify({ projects }, null, 2)}
`);
    await rename2(temporary, this.#file);
  }
};

// src/ledger/run-report.ts
import { readFile as readFile7 } from "node:fs/promises";
var RunReport = class _RunReport {
  committed;
  queued;
  blocked;
  open;
  /** The report as written, kept beside the ledger as the run's record. */
  text;
  constructor(text, fields) {
    this.text = text;
    this.committed = fields.committed;
    this.queued = fields.queued;
    this.blocked = fields.blocked;
    this.open = fields.open;
  }
  static async read(file) {
    const text = await readFile7(file, "utf8");
    const fail = (path, problem) => new ReportInvalid(file, path, problem);
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw fail("the document", `not JSON (${error.message})`);
      }
      throw error;
    }
    const shape = new Shape(fail);
    const items = new Items(shape);
    const report = shape.object(value, ROOT, [
      "committed",
      "queued",
      "blocked",
      "open"
    ]);
    const blocked = items.blocked(report.get("blocked"), "blocked");
    const open2 = items.open(report.get("open"), "open");
    for (const [index, item] of open2.entries()) {
      if (blocked.some(
        ({ title, target }) => title === item.title && target === item.target
      )) {
        throw fail(
          `open[${index}]`,
          "an item is either open or blocked; this one is listed in both"
        );
      }
    }
    return new _RunReport(text, {
      committed: shape.list(
        report.get("committed"),
        "committed",
        (each, at) => {
          const change = shape.object(each, at, ["sha", "subject"]);
          return {
            sha: shape.text(change.get("sha"), `${at}.sha`),
            subject: shape.text(change.get("subject"), `${at}.subject`)
          };
        }
      ),
      queued: items.queued(report.get("queued"), "queued"),
      blocked,
      open: open2
    });
  }
};

// src/workspace/repo-config.ts
import { readFile as readFile8 } from "node:fs/promises";
import { join as join9, matchesGlob } from "node:path";
var RepoConfig = class _RepoConfig {
  static file = ".claude/update-docs.json";
  guide;
  map;
  refuse;
  constructor(fields) {
    this.guide = fields.guide;
    this.map = fields.map;
    this.refuse = fields.refuse;
  }
  static async read(repoRoot) {
    const file = join9(repoRoot, _RepoConfig.file);
    let text;
    try {
      text = await readFile8(file, "utf8");
    } catch (error) {
      if (Error.isError(error) && "code" in error && error.code === "ENOENT") {
        throw new ConfigMissing(file);
      }
      throw error;
    }
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ConfigInvalid(file, "the document", error.message);
      }
      throw error;
    }
    const shape = new Shape(
      (path, problem) => new ConfigInvalid(file, path, problem)
    );
    const config = shape.object(value, ROOT, ["guide", "map", "refuse"]);
    return new _RepoConfig({
      guide: shape.text(config.get("guide"), "guide"),
      map: shape.text(config.get("map"), "map"),
      refuse: shape.list(config.get("refuse"), "refuse", (each, at) => {
        const refusal = shape.object(each, at, ["glob", "reason"]);
        return {
          glob: shape.text(refusal.get("glob"), `${at}.glob`),
          reason: shape.text(refusal.get("reason"), `${at}.reason`)
        };
      })
    });
  }
  /** The repository's reason to refuse a claim of the path, if any. */
  refusal(path) {
    return this.refuse.find(({ glob }) => matchesGlob(path, glob));
  }
};

// src/workspace/workspace.ts
import { readFile as readFile9 } from "node:fs/promises";
import { join as join10, posix } from "node:path";

// src/workspace/project.ts
var Project = class {
  name;
  npmName;
  /** The project root, relative to the workspace, with forward slashes. */
  root;
  constructor(name, npmName, root) {
    this.name = name;
    this.npmName = npmName;
    this.root = root;
  }
  /** The texts that name the project: its npm name and its root folder. */
  get needles() {
    return [this.npmName, `${this.root}/`];
  }
  names(text) {
    return this.needles.some((needle) => text.includes(needle));
  }
};

// src/workspace/workspace.ts
var Workspace = class {
  #git;
  constructor(git) {
    this.#git = git;
  }
  async projects() {
    const files = (await this.#git.run(["ls-files", "-z", "--", ":(glob)**/project.json"])).split("\0").filter(Boolean);
    const projects = [];
    for (const file of files) {
      const { name, projectType } = await this.#manifest(file);
      if (projectType !== "library") {
        continue;
      }
      const root = posix.dirname(file);
      const { name: npmName } = await this.#manifest(
        posix.join(root, "package.json")
      );
      projects.push(new Project(name, npmName, root));
    }
    return projects.toSorted((a, b) => a.name.localeCompare(b.name));
  }
  async project(name) {
    const projects = await this.projects();
    const found2 = projects.find((project) => project.name === name);
    if (found2 === void 0) {
      throw new UnknownProject(
        name,
        projects.map((project) => project.name)
      );
    }
    return found2;
  }
  async #manifest(file) {
    const value = JSON.parse(
      await readFile9(join10(this.#git.directory, file), "utf8")
    );
    if (typeof value === "object" && value !== null && "name" in value && typeof value.name === "string") {
      return {
        name: value.name,
        projectType: "projectType" in value ? value.projectType : void 0
      };
    }
    throw new TypeError(`${file} has no "name" string`);
  }
};

// src/update-docs.ts
var USAGE = `Usage:
  update-docs repo
  update-docs evidence <project> [--since <ISO 8601>]
  update-docs delta
  update-docs open
  update-docs show <project>
  update-docs finish <project> --started <ISO 8601> --report <path>
  update-docs claim <project> <path>...
  update-docs stamp <project> [<path>...]
  update-docs commit <project> --subject <text> [--body <text>]
  update-docs release <project> [--revert] [<path>...]`;
var UpdateDocs = class {
  #claude;
  #repoRoot;
  /** The folder of this repository's ledger, claims and run reports. */
  #state;
  #git;
  #workspace;
  constructor({ home, repoRoot, variables }) {
    this.#claude = new ClaudeHome(home);
    this.#repoRoot = repoRoot;
    this.#state = this.#claude.repoState(repoRoot);
    this.#git = new Git(repoRoot, variables);
    this.#workspace = new Workspace(this.#git);
  }
  async run(argv) {
    const [command, ...rest] = argv;
    switch (command) {
      case "repo": {
        this.#bare(rest);
        return new RepoCommand(
          this.#state,
          await RepoConfig.read(this.#repoRoot)
        ).run();
      }
      case "evidence": {
        const { project, values } = this.#withProject(rest, {
          since: { type: "string" }
        });
        return new EvidenceCommand(
          this.#workspace,
          this.#evidence(),
          new EvidenceBudget()
        ).run(
          project,
          values.since === void 0 ? Since.ever : Since.from(parseInstant(values.since, "--since"))
        );
      }
      case "delta": {
        this.#bare(rest);
        return new DeltaCommand(this.#workspace, this.#evidence()).run(
          await this.#ledger()
        );
      }
      case "open": {
        this.#bare(rest);
        return new OpenCommand().run(await this.#ledger());
      }
      case "show": {
        const { project } = this.#withProject(rest, {});
        return new ShowCommand(this.#workspace).run(
          project,
          await this.#ledger()
        );
      }
      case "finish": {
        const { project, values } = this.#withProject(rest, {
          started: { type: "string" },
          report: { type: "string" }
        });
        if (values.started === void 0 || values.report === void 0) {
          throw new UsageError(`finish takes --started and --report
${USAGE}`);
        }
        return new FinishCommand(
          this.#workspace,
          this.#git,
          join11(this.#state, "runs")
        ).run(
          project,
          parseInstant(values.started, "--started"),
          await RunReport.read(values.report),
          values.report,
          await this.#ledger()
        );
      }
      case "claim": {
        const { project, paths } = this.#withPaths(rest, {});
        if (paths.length === 0) {
          throw new UsageError(`claim takes one path or more
${USAGE}`);
        }
        return new ClaimCommand({
          workspace: this.#workspace,
          config: await RepoConfig.read(this.#repoRoot),
          paths: new ClaimedPaths(this.#git),
          store: this.#claims()
        }).run(project, paths, Temporal.Now.instant());
      }
      case "stamp": {
        const { project, paths } = this.#withPaths(rest, {});
        return new StampCommand(
          this.#repoRoot,
          this.#claims(),
          new ClaimedPaths(this.#git)
        ).run(project, paths, Temporal.Now.instant());
      }
      case "commit": {
        const { project, values } = this.#withProject(rest, {
          subject: { type: "string" },
          body: { type: "string" }
        });
        if (values.subject === void 0) {
          throw new UsageError(`commit takes --subject
${USAGE}`);
        }
        const paths = new ClaimedPaths(this.#git);
        return new CommitCommand({
          workspace: this.#workspace,
          store: this.#claims(),
          guard: new ClaimGuard(this.#repoRoot, paths),
          paths,
          committer: new PathCommit(this.#git)
        }).run(
          project,
          values.subject,
          values.body === void 0 ? [] : [values.body]
        );
      }
      case "release": {
        const { project, paths, values } = this.#withPaths(rest, {
          revert: { type: "boolean" }
        });
        const claimed = new ClaimedPaths(this.#git);
        return new ReleaseCommand(
          this.#claims(),
          new ClaimGuard(this.#repoRoot, claimed),
          claimed
        ).run(project, values.revert === true ? "revert" : "drop", paths);
      }
      default: {
        throw new UsageError(USAGE);
      }
    }
  }
  #evidence() {
    return new Evidence(this.#claude, this.#git);
  }
  #ledger() {
    return Ledger.read(join11(this.#state, "ledger.json"));
  }
  #claims() {
    return new ClaimStore(join11(this.#state, "claims"));
  }
  /** A command that takes one project and the given options. */
  #withProject(args, options) {
    const { project, paths, values } = this.#withPaths(args, options);
    if (paths.length > 0) {
      throw new UsageError(USAGE);
    }
    return { project, values };
  }
  /**
   * A command that takes one project, then paths, each made relative to the
   * workspace with forward slashes, once.
   */
  #withPaths(args, options) {
    const { positionals, values } = this.#parse(args, options);
    const [project, ...given] = positionals;
    if (project === void 0) {
      throw new UsageError(USAGE);
    }
    const paths = [
      ...new Set(
        given.map(
          (path) => relative(this.#repoRoot, resolve(this.#repoRoot, path)).split(sep2).join(posix2.sep)
        )
      )
    ];
    return { project, paths, values };
  }
  /** A command that takes no argument. */
  #bare(args) {
    if (this.#parse(args, {}).positionals.length > 0) {
      throw new UsageError(USAGE);
    }
  }
  #parse(args, options) {
    try {
      return parseArgs({
        args: [...args],
        options,
        allowPositionals: true,
        strict: true
      });
    } catch (error) {
      if (error instanceof TypeError && "code" in error) {
        throw new UsageError(`${error.message}
${USAGE}`);
      }
      throw error;
    }
  }
};

// src/main.ts
try {
  const { exitCode, stdout } = await new UpdateDocs({
    home: process.env.HOME ?? homedir(),
    repoRoot: await repositoryRoot(),
    variables: process.env
  }).run(process.argv.slice(2));
  process.stdout.write(stdout);
  process.exitCode = exitCode;
} catch (error) {
  if (!(error instanceof UpdateDocsError)) {
    throw error;
  }
  process.stderr.write(`${error.message}
`);
  process.exitCode = 2;
}
async function repositoryRoot() {
  try {
    return (await new Git(process.cwd(), process.env).run([
      "rev-parse",
      "--show-toplevel"
    ])).trim();
  } catch (error) {
    if (error instanceof GitFailed && error.exitCode === 128) {
      throw new NotInRepository(process.cwd());
    }
    throw error;
  }
}
