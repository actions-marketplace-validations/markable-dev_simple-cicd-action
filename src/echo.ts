import * as core from '@actions/core';
import { exec } from './exec';

export const echo = async function (...params: string[]): Promise<string | undefined> {
  return exec('echo', params)
    .catch(error => {
      core.setFailed(error.message)
    }) as Promise<string | undefined>;
};

export const echoContext = async (context: string, varPath: string) =>
  echo('$' + `{{${context}.${varPath}}}`);

export const echoStep = async (step: string, varPath: string) =>
  echoContext('steps', `${step}.${varPath}`);

export const echoNeeds = async (job: string, varPath: string) =>
  echoContext('needs', `${job}.${varPath}`);

export const echoOutput = async (context: string, variable: string) =>
  echoContext(context, `outputs.${variable}`);

export const echoStepOutput = async (step: string, variable: string) =>
  echoStep(step, `outputs.${variable}`);

export const echoNeedsOutput = async (job: string, variable: string) =>
  echoNeeds(job, `outputs.${variable}`);

export const echoSecret = async (secret: string) =>
  echoContext('secrets', secret);

export const echoEnv = async (env: string) =>
  echo('${' + env + '}');
