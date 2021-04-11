import * as core from '@actions/core';
import { FileChangingCollector } from './file-changing-collector';
import { OctokitClient } from './octokit';
import { parse } from './parse-yaml';
import { OnFileChangeOpts, exporter } from './changing-exporter';
import { echo, echoContext, echoEnv } from './echo';

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
const getYamlInput = async <T = object>(name: string, options?: core.InputOptions): Promise<T[]> => {
  const ret = await getInput(name, options);
  if (!ret) {
    return [];
  }
  const val = parse(ret);
  return Array.isArray(val) ? val : [val as T];
};

async function entry (id = 0) {
  const token = (await getInput('token')) || (await echoContext('github', 'token')) || '';
  const onFileChange = await getYamlInput<OnFileChangeOpts>('on-files-change');
  const obj = await getYamlInput('test-object');
  console.log({
    inputToken: (await getInput('token')).length,
  });
  console.log(onFileChange);
  console.log(obj);
  console.log(process.env.GITHUB_EVENT_PATH);

  const octokit = OctokitClient.getInstance(token);
  const fileChangingCollector = new FileChangingCollector(octokit);

  const getComparision = async (fileChangingCollector: FileChangingCollector) => {
    const comparision = await fileChangingCollector.getComparision();

    const keys = Object.keys(comparision);
    core.info('Comparsion:');
    keys.forEach(key => {
      core.info(`  ${key}: ${comparision[key]}`);
    });
    return comparision;
  };
  const comparision = await getComparision(fileChangingCollector);

  const { exportByKeys, changedFiles } = exporter(comparision, onFileChange);

  const keys = Object.keys(exportByKeys);
  core.setOutput('id', id);
  core.setOutput('keys', JSON.stringify(keys));
  core.setOutput('changed_files', JSON.stringify(changedFiles));
  core.info(JSON.stringify(exportByKeys, null, 2));
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
  try {
    await entry();
  } catch (error) {
    core.debug(error.stack);
    core.setFailed(error.message);
  }
};

run();
