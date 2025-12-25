globalThis.FileList = class FileListPolyfill implements FileList {
  [index: number]: File;
  length = 0;
  item(_: number): File | null {
    return null;
  }
};
