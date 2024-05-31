"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const github_1 = __importDefault(require("@actions/github"));
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function run() {
    try {
        const token = core_1.default.getInput("repo-token");
        const group = core_1.default.getInput("group");
        const maxConcurrent = parseInt(core_1.default.getInput("max-concurrent"));
        const intervalMs = parseInt(core_1.default.getInput("check-interval-ms")) || 60000; // Default to 60 seconds
        const octokit = github_1.default.getOctokit(token);
        const { context } = github_1.default;
        const { owner, repo } = context.repo;
        while (true) {
            // Obtener los trabajos en ejecución en el grupo especificado
            const { data: workflows } = await octokit.rest.actions.listWorkflowRunsForRepo({
                owner,
                repo,
                status: "in_progress",
            });
            const runningWorkflows = workflows.workflow_runs.filter((run) => {
                var _a;
                const workflowGroup = (_a = run.head_commit) === null || _a === void 0 ? void 0 : _a.message.match(/Group:\s*(\w+)/);
                return workflowGroup && workflowGroup[1] === group;
            });
            if (runningWorkflows.length < maxConcurrent) {
                core_1.default.notice(`Running workflow in group ${group}. ${runningWorkflows.length + 1}/${maxConcurrent} workflows running.`);
                break;
            }
            else {
                core_1.default.notice(`Too many workflows running in group ${group}. Waiting...`);
                await sleep(intervalMs);
            }
        }
        // Continuar con el resto del trabajo de la acción
        // Tu código aquí
    }
    catch (error) {
        core_1.default.setFailed(error.message);
    }
}
run();
