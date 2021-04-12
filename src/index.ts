import * as core from '@actions/core';
import { Comparision, FileChangingCollector } from './file-changing-collector';
import { OctokitClient } from './octokit';
import { parseInputs } from './inputs';
import * as outputs from './outputs';

const getInput = async (name: string, options?: core.InputOptions): Promise<string> => {
  let val = core.getInput(name, options);
  return val;
  // const patterns = val.match(/\$\{\{ *[^ ]+ *\}\}/gm);
  // if (!patterns) {
  //   return val;
  // }
  // for await (const ptn of patterns) {
  //   const str = await echo(ptn);
  //   val = val.replace(ptn, str || '');
  // }
  // return val;
};
const getArrayInput = async (name: string, options?: core.InputOptions): Promise<string[]> => {
  const ret = await getInput(name, options);
  if (Array.isArray(ret)) {
    return ret;
  }
  if (typeof ret === 'string') {
    return ret.split('\n');
  }
  return [ret];
};

async function entry (id = 0) {
  const inputs = parseInputs();
  console.dir(inputs.exec.options, { depth: 10 });
  const { token } = inputs;
  // await exec('ls', ['/home/runner/work/_temp/_github_workflow/']);
  // await exec('ls', ['/home/runner/work/_temp/_runner_file_commands']);
  // if (typeof process.env.GITHUB_EVENT_PATH === 'string') {
  //   await exec('cat', [process.env.GITHUB_EVENT_PATH]);
  // }

  const octokit = OctokitClient.getInstance(token);
  const fileChangingCollector = new FileChangingCollector(octokit);

  const getComparision = async (fileChangingCollector: FileChangingCollector) => {
    const comparision = await fileChangingCollector.getComparision();

    const keys = Object.keys(comparision);
    core.info('Comparsion:');
    keys.forEach(key => {
      core.info(`  ${key}: ${JSON.stringify(comparision[key])}`);
    });
    return comparision;
  };

  let comparision: Comparision | undefined;
  try {
    comparision = await getComparision(fileChangingCollector);
  } catch (error) {
    if (error.name === 'HttpError' && error.status === 404) {
      core.debug(error);
    } else {
      throw error;
    }
  }

  await outputs.exec(inputs, comparision);
};

async function run(): Promise<void> {
  // Languages:
  //   - Node
  //   - Python
  //   - Java
  // Strategies:
  //   - Single project in each repo
  //   - Multiple projects in one repo, triggered by file changing
  // Flows:
  //   1 Lint
  //     1.1 Command lines only
  //   2 Test
  //     1.1 Command lines only
  //   3 Build
  //     3.3 Build docker image with at least two strategies:
  //       3.3.1 commit id as tag
  //       3.3.2 release tag as tag
  //   4 Deployment
  //     4.1 Dev deployments in multiple strategies:
  //       4.1.1 Command lines
  //       4.1.2 ArgoCD
  //       4.1.3 Helm
  core.info(`Debug: ${core.isDebug()}`);
  try {
    await entry();
  } catch (error) {
    console.error(error.stack);
    core.setFailed(error.message);
  }
};

run();
