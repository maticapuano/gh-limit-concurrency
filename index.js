const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const token = core.getInput("repo-token");
    const group = core.getInput("group");
    const maxConcurrent = parseInt(core.getInput("max-concurrent"));
    const octokit = github.getOctokit(token);

    const { context } = github;
    const { owner, repo } = context.repo;

    // Obtener los trabajos en ejecución en el grupo especificado
    const { data: workflows } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      status: "in_progress",
    });

    const runningWorkflows = workflows.workflow_runs.filter((run) => {
      const workflowGroup = run.head_commit.message.match(/Group:\s*(\w+)/);
      return workflowGroup && workflowGroup[1] === group;
    });

    // Si hay más trabajos ejecutándose que el máximo permitido, fallar la acción
    if (runningWorkflows.length >= maxConcurrent) {
      core.setFailed(
        `Too many workflows running in group ${group}. Maximum allowed is ${maxConcurrent}.`,
      );
      return;
    }

    // Dejar una anotación indicando el grupo
    core.notice(
      `Running workflow in group ${group}. ${
        runningWorkflows.length + 1
      }/${maxConcurrent} workflows running.`,
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
