import * as execAction from '@actions/exec';

export const exec = async (commandLine: string, args?: string[], options: execAction.ExecOptions = {}) => {
  const outputBufList: Buffer[] = [];
  const errBufList: Buffer[] = [];

  options = Object.assign({
    listeners: {
      stdout: (data: Buffer) => {
        outputBufList.push(data);
      },
      stderr: (data: Buffer) => {
        errBufList.push(data);
      },
    },
    cwd: '.'
  }, options);

  await execAction.exec(commandLine, args, options);
  const output = outputBufList.length ? Buffer.concat(outputBufList).toString() : undefined;
  const error = errBufList.length && Buffer.concat(errBufList).toString();
  if (error) {
    throw new Error(error);
  }
  return output;
};
