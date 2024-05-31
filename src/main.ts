import core from "@actions/core";
import github from "@actions/github";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  try {
    const token = core.getInput("repo-token");
    const group = core.getInput("group");
    const maxConcurrent = parseInt(core.getInput("max-concurrent"));
    const intervalMs = parseInt(core.getInput("check-interval-ms")) || 60000; // Default to 60 seconds
    const octokit = github.getOctokit(token);

    const { context } = github;
    const { owner, repo } = context.repo;

    while (true) {
      // Obtener los trabajos en ejecución en el grupo especificado
      const { data: workflows } =
        await octokit.rest.actions.listWorkflowRunsForRepo({
          owner,
          repo,
          status: "in_progress",
        });

      const runningWorkflows = workflows.workflow_runs.filter((run) => {
        const workflowGroup = run.head_commit?.message.match(/Group:\s*(\w+)/);
        return workflowGroup && workflowGroup[1] === group;
      });

      if (runningWorkflows.length < maxConcurrent) {
        core.notice(
          `Running workflow in group ${group}. ${
            runningWorkflows.length + 1
          }/${maxConcurrent} workflows running.`,
        );
        break;
      } else {
        core.notice(`Too many workflows running in group ${group}. Waiting...`);
        await sleep(intervalMs);
      }
    }

    // Continuar con el resto del trabajo de la acción
    // Tu código aquí
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
