import * as core from '@actions/core';
import YAML from 'yaml';

export const parse = <T>(content: string): T | undefined => {
  try {
    return YAML.parse(content) as T;
  } catch (error) {
    core.error(error.message);
    core.setFailed(`Parse input ${content} errored: ${error.message}`);
  }
};
