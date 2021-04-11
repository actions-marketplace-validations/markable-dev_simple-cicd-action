import { OnFileChangeOpts } from './changing-exporter';

export type Inputs = {
  'on-files-change'?: OnFileChangeOpts | OnFileChangeOpts[],
  'token': string,
  'test-object'?: object,
};
