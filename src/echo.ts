import * as exec from '@actions/exec';
import * as core from '@actions/core';

export const echo = async function (...params: string[]): Promise<string | undefined> {
  const outputBufList: Buffer[] = [];
  const errBufList: Buffer[] = [];

  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        outputBufList.push(data);
      },
      stderr: (data: Buffer) => {
        errBufList.push(data);
      },
    },
    cwd: '.'
  };

  await exec.exec('echo', params, options);
  const output = outputBufList.length ? Buffer.concat(outputBufList).toString() : undefined;
  const error = errBufList.length && Buffer.concat(errBufList).toString();
  error && core.setFailed(error);
  return output;
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
