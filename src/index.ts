import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { FileChangingCollector, FileStatusOrAll } from './file-changing-collector';
import { GlobMatcherOptions, GlobMatcher } from './glob-matcher';
import { OctokitClient } from './octokit';
import { parse } from './parse-yaml';

type OnFileChangeOpts = {
  globber?: GlobMatcher;
  changeTypes?: FileStatusOrAll | FileStatusOrAll[];
} & GlobMatcherOptions;

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

  const getInput = (name: string, options?: core.InputOptions): string => {
    return core.getInput(name, options);
  };
  const getArrayInput = (name: string, options?: core.InputOptions): string[] => {
    const ret = getInput(name, options);
    if (Array.isArray(ret)) {
      return ret;
    }
    if (typeof ret === 'string') {
      return ret.split('\n');
    }
    return [ret];
  };
  const getYamlInput = <T = object>(name: string, options?: core.InputOptions): T[] => {
    const ret = getInput(name, options);
    if (!ret) {
      return [];
    }
    const val = parse(ret);
    return Array.isArray(val) ? val : [val as T];
  };
  const token = getInput('token');
  const onFileChange = getYamlInput<OnFileChangeOpts>('on-files-change');

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

  const globbers = onFileChange.map(opt => {
    if (opt.files) {
      opt.globber = new GlobMatcher(opt.files);
    }
    opt.changeTypes = opt.changeTypes || 'all';
    if (!Array.isArray(opt.changeTypes)) {
      opt.changeTypes = [opt.changeTypes];
    } else if (opt.changeTypes.length > 1 && opt.changeTypes.includes('all')) {
      opt.changeTypes = ['all'];
    }
    opt.matches = opt.changeTypes.reduce((acc: string[], changeType: string): string[] => acc.concat(comparision[changeType]), []);
  });
};

run();
