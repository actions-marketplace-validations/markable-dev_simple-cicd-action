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

type ExecOptions = {
  on: OnChangesOptions,
  key?: string,
};

export type Inputs = {
  'on-files-change'?: OnFileChangeOpts | OnFileChangeOpts[],
  'exec': ExecOptions[],
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

const transformExecOptions = (execOptions: ExecOptions, index: number) => {
  const { on: onOptions } = execOptions;
  const optionKeyPrefix = `exec[${index}].`;
  const getOptionKey = (name: string): string => `${optionKeyPrefix}${name}`;
  const getOnOptionKey = (name: string): string => getOptionKey(`on.${name}`);
  if (!onOptions) {
    throw new TypeError(`Expect input \`${getOptionKey('on')}\` to not be empty`);
  }
  const eventAndRefKeys: string[] = [];
  ['events', 'branches', 'tags'].forEach(key => {
    if (onOptions[key]) {
      eventAndRefKeys.push(getOnOptionKey(key));
    }
  });
  if (!eventAndRefKeys.length) {
    throw new TypeError(`Expect input \`${getOptionKey('on')}\` to not be empty`);
  }

  if (eventAndRefKeys.length > 1 && eventAndRefKeys.includes('events')) {
    core.warning(`Conflict inputs: ${eventAndRefKeys}. Input ${getOnOptionKey('events')} will be used.`);
  } else if (!eventAndRefKeys.includes('events')) {
    onOptions.events = eventAndRefKeys.reduce((acc, key) => {
      acc.events[key] = onOptions[key];
      return acc;
    }, { events: {} as OnRefChangesOptions } as OnEvtChangesOptions);
  }
  if (Array.isArray(onOptions.events)) {
    onOptions.events = onOptions.events.reduce((acc, key) => {
      return Object.assign(acc, { [key]: {} });
    }, {});
  }

  onOptions.fileMatchers = (onOptions.files || []).map((options: OnFileChangeOpts) => new ChangedFileMatcher(options.key, options));
  onOptions.eventMatchers = Object.keys(onOptions.events).map((event: string) =>
    new RefMatcher(event, onOptions.events[event])
  );
};

const getInputs = () => {
  const token = getInput('token', { required: true });
  const exec = getYamlInput<ExecOptions>('exec', { required: true });
  return {
    token,
    exec,
  }
};

export const parseInputs = ({ exec, token } = getInputs()): Inputs => {
  const execKeys: string[] = [];

  exec.forEach((opts, index) => {
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
    exec,
  };
};
