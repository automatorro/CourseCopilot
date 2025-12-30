// Minimal Node polyfills for browser APIs used in exporter
class NodeFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  result: string | ArrayBuffer | null = null;
  readAsDataURL(blob: Blob) {
    blob.arrayBuffer()
      .then((buf) => {
        const base64 = Buffer.from(buf).toString('base64');
        const mime = blob.type || 'application/octet-stream';
        this.result = `data:${mime};base64,${base64}`;
        this.onload && this.onload.call(this as any, {} as any);
      })
      .catch((e) => {
        this.onerror && this.onerror.call(this as any, e as any);
      });
  }
}

// @ts-ignore
if (typeof (global as any).FileReader === 'undefined') {
  // @ts-ignore
  (global as any).FileReader = NodeFileReader as any;
}

export {};
