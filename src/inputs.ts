import { ChangedFileMatcher, OnFileChangeOpts } from './changing-exporter';
import * as core from '@actions/core';
import { parse } from './parse-yaml';
import { RefMatcher } from './ref-matcher';

type OnRefChangesOptions = {
  branches: string | string[],
  tags: string | string[],
};

type OnEvtChangesOptions = { [event: string]: OnRefChangesOptions | string | string[] };

type OnChangesOptions = {
  files: OnFileChangeOpts[],
  fileMatchers: ChangedFileMatcher[],
  events: string[] | OnEvtChangesOptions,
  eventMatchers: RefMatcher[],
} & OnRefChangesOptions;

type ExecCondition = {
  on: OnChangesOptions,
  key?: string,
};

type ExecInputCondition = {
  on: OnChangesOptions | string | string[],
  key?: string,
};

type ExecInputOptions = {
  options: ExecInputCondition[];
};

type ExecOptions = {
  options: ExecCondition[];
};

export type Inputs = {
  'on-files-change'?: OnFileChangeOpts | OnFileChangeOpts[],
  'exec': ExecOptions,
  'token': string,
  'test-object'?: object,
};

const getInput = (name: string, options?: core.InputOptions): string => {
  return core.getInput(name, options);
};

export const getYamlInput = <T = object>(name: string, options?: core.InputOptions): T[] => {
  const ret = getInput(name, options);
  if (!ret) {
    return [];
  }
  const val = parse(ret);
  return Array.isArray(val) ? val : [val as T];
};

const transformExecOptions = (execOptions: ExecInputCondition, index: number) => {
  let { on: onOptions } = execOptions;
  const optionKeyPrefix = `exec[${index}].`;
  const getOptionKey = (name: string): string => `${optionKeyPrefix}${name}`;
  const getOnOptionKey = (name: string): string => getOptionKey(`on.${name}`);
  if (!onOptions) {
    throw new TypeError(`Expect input \`${getOptionKey('on')}\` to not be empty`);
  }

  if (typeof onOptions === 'string') {
    onOptions = [onOptions];
  }
  if (Array.isArray(onOptions)) {
    onOptions = onOptions.reduce((acc, key) => {
      if (key === 'files') {
        core.setFailed(`Input \`${getOnOptionKey('files')}\` cannot be shorthand string value.`);
      }
      return Object.assign(acc, { [key]: {} });
    }, {} as OnChangesOptions);
    onOptions.files = onOptions.files || [];
    onOptions.events = onOptions.events || [];
  }
  const onOptionsObj = onOptions as OnChangesOptions;

  const eventAndRefKeys: string[] = [];
  ['events', 'branches', 'tags'].forEach(key => {
    if (onOptionsObj[key]) {
      eventAndRefKeys.push(key);
    }
  });
  if (!eventAndRefKeys.length) {
    throw new TypeError(`Expect input \`${getOptionKey('on')}\` to not be empty`);
  }

  if (eventAndRefKeys.length > 1 && eventAndRefKeys.includes('events')) {
    core.warning(`Conflict inputs: ${eventAndRefKeys}. Input ${getOnOptionKey('events')} will be used.`);
  } else if (!eventAndRefKeys.includes('events')) {
    onOptionsObj.events = eventAndRefKeys.reduce((acc, key) => {
      acc.events[key] = onOptionsObj[key];
      return acc;
    }, { events: {} as OnRefChangesOptions } as OnEvtChangesOptions);
  }
  if (Array.isArray(onOptionsObj.events)) {
    onOptionsObj.events = onOptionsObj.events.reduce((acc, key) => {
      return Object.assign(acc, { [key]: {} });
    }, {});
  }

  onOptionsObj.fileMatchers = (onOptionsObj.files || []).map((options: OnFileChangeOpts) => new ChangedFileMatcher(options.key, options));
  onOptionsObj.eventMatchers = Object.keys(onOptionsObj.events).map((event: string) =>
    new RefMatcher(event, onOptionsObj.events[event])
  );
};

const getInputs = () => {
  const token = getInput('token', { required: true });
  const [exec] = getYamlInput<ExecInputOptions>('exec', { required: true });
  return {
    token,
    exec,
  }
};

export const parseInputs = ({ exec, token } = getInputs()): Inputs => {
  const execKeys: string[] = [];

  exec.options.forEach((opts, index) => {
    transformExecOptions(opts, index);
    if (!opts.key) {
      return;
    }
    if (execKeys.includes(opts.key)) {
      throw new Error(`Duplicated exec key: ${opts.key}`);
    }
    execKeys.push(opts.key);
  });

  return {
    token,
    exec: exec as ExecOptions,
  };
};
