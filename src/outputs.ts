import * as core from '@actions/core';
import { Comparision } from './file-changing-collector';
import { Inputs } from './inputs';
import { getSelfRef } from './ref';

type RefData = {
  refSlug?: string;
  refName?: string;
  sha: string;
  tag?: string;
  branch?: string;
  release?: string;
  releaseOrSlug?: string;
};

type Changed = {
  key: string,
  changed: Comparision,
} & RefData;

type Matrix = {
  keys: {
    key: string[]
  },
  matches: {
    match: Changed[],
  },
};

type Results = {
  keys: string[],
  matches: { [key: string]: Changed },
  matrix: Matrix,
} & RefData;

export const parse = async ({ exec: { options: execPipelines } }: Inputs, comparision: Comparision) => {
  const ref = await getSelfRef();
  const refData = {
    sha: ref.sha,
    refSlug: ref.slug,
    refName: ref.name,
    release: ref.release ? ref.release : undefined,
    releaseOrSlug: ref.release || ref.slug,
  } as RefData;
  if (ref.type === 'tags') {
    refData.tag = ref.name;
  } else if (ref.type === 'heads') {
    refData.branch = ref.name;
  }
  const results: Results = {
    keys: [],
    matches: {},
    matrix: {
      keys: {
        key: [],
      },
      matches: {
        match: [],
      }
    },
    ...refData,
  };

  // Pick ref matches the rules passed in by user
  const pipe = execPipelines.find(pipe => {
    const { on: { eventMatchers } } = pipe;
    if (!eventMatchers || !eventMatchers.length) {
      return true;
    }

    return eventMatchers.some(eventMatcher => eventMatcher.match());
  });
  if (!pipe) {
    core.info(`Didn't find matched pipe.`);
    return results;
  }
  core.info(`Matched pipe: ${JSON.stringify(pipe)}`);

  // Pick changed files
  for await (const fileMatcher of pipe.on.fileMatchers) {
    const matches = fileMatcher.match(comparision);
    if (matches.all.length && !results.keys.includes(fileMatcher.key)) {
      results.keys.push(fileMatcher.key);
      results.matches[fileMatcher.key] = {
        key: fileMatcher.key,
        changed: matches,
        ...refData,
      };
    }
  }

  results.matrix.keys.key = results.keys;
  results.matrix.matches.match = Object.values(results.matches);

  return results;
};

export const exec = async (inputs: Inputs, comparision: Comparision) => {
  const results = await parse(inputs, comparision);
  core.info(`Set outputs:`);
  core.info(`  matrix.keys`);
  core.setOutput('keysMatrix', JSON.stringify(results.matrix.keys));
  core.info(`  matrix.matches`);
  core.setOutput('matchesMatrix', JSON.stringify(results.matrix.matches));
  Object.keys(results).forEach(key => {
    const val = results[key];
    if (typeof val === 'string') {
      core.info(`  ${key}: "${val}"`);
      core.setOutput(key, val);
      return;
    }
    if (val) {
      const json = JSON.stringify(val);
      core.info(`  ${key}: '${json}'`);
      core.setOutput(key, json);
    }
  });
};
