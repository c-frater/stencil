import type {
  CompilerSystem,
  CompilerFsStats,
  CompilerSystemRenameResults,
  CompilerSystemRemoveDirectoryResults,
  CompilerSystemUnlinkResults,
  CompilerSystemMakeDirectoryResults,
  CompilerSystemWriteFileResults,
  Logger,
} from '../../declarations';
import { basename, delimiter, dirname, extname, isAbsolute, join, normalize, parse, relative, resolve, sep, win32, posix } from './deps';
import { normalizePath } from '@utils';
import type { Deno as DenoTypes } from '../../../types/lib.deno';
import { denoCopyTasks } from './deno-copy-tasks';
import { createDenobWorkerMainController } from './deno-worker-main';

export function createDenoSys(c: { Deno: any; logger: Logger }) {
  let tmpDir: string = null;
  const deno: typeof DenoTypes = c.Deno;
  const destroys = new Set<() => Promise<void> | void>();

  const sys: CompilerSystem = {
    async access(p) {
      try {
        await deno.stat(p);
        return true;
      } catch (e) {
        return false;
      }
    },
    accessSync(p) {
      try {
        deno.statSync(p);
        return true;
      } catch (e) {
        return false;
      }
    },
    addDestory(cb) {
      destroys.add(cb);
    },
    removeDestory(cb) {
      destroys.delete(cb);
    },
    async copyFile(src, dst) {
      try {
        await deno.copyFile(src, dst);
        return true;
      } catch (e) {
        return false;
      }
    },
    createWorkerController: maxConcurrentWorkers => createDenobWorkerMainController(deno, sys, maxConcurrentWorkers),
    async destroy() {
      const waits: Promise<void>[] = [];
      destroys.forEach(cb => {
        try {
          const rtn = cb();
          if (rtn && rtn.then) {
            waits.push(rtn);
          }
        } catch (e) {
          console.error(`node sys destroy: ${e}`);
        }
      });
      await Promise.all(waits);
      destroys.clear();
    },
    dynamicImport(p) {
      return import(p);
    },
    encodeToBase64(str) {
      return Buffer.from(str).toString('base64');
    },
    exit(exitCode) {
      deno.exit(exitCode);
    },
    getCurrentDirectory() {
      return normalizePath(deno.cwd());
    },
    glob(_pattern, _opts) {
      return null;
    },
    async isSymbolicLink(p) {
      try {
        const stat = await deno.stat(p);
        return stat.isSymlink;
      } catch (e) {
        return false;
      }
    },
    getCompilerExecutingPath() {
      const current = new URL('../../compiler/stencil.js', import.meta.url);
      return normalizePath(current.pathname);
    },
    normalizePath,
    async mkdir(p, opts) {
      const results: CompilerSystemMakeDirectoryResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        newDirs: [],
        error: null,
      };
      try {
        await deno.mkdir(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    mkdirSync(p, opts) {
      const results: CompilerSystemMakeDirectoryResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        newDirs: [],
        error: null,
      };
      try {
        deno.mkdirSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    nextTick(cb) {
      // https://doc.deno.land/https/github.com/denoland/deno/releases/latest/download/lib.deno.d.ts#queueMicrotask
      queueMicrotask(cb);
    },
    platformPath: {
      basename,
      dirname,
      extname,
      isAbsolute,
      join,
      normalize,
      parse,
      relative,
      resolve,
      sep,
      delimiter,
      posix,
      win32,
    },
    async readdir(p) {
      const dirEntries: string[] = [];
      try {
        for await (const dirEntry of deno.readDir(p)) {
          dirEntries.push(normalizePath(join(p, dirEntry.name)));
        }
      } catch (e) {}
      return dirEntries;
    },
    readdirSync(p) {
      const dirEntries: string[] = [];
      try {
        for (const dirEntry of deno.readDirSync(p)) {
          dirEntries.push(normalizePath(join(p, dirEntry.name)));
        }
      } catch (e) {}
      return dirEntries;
    },
    async readFile(p) {
      try {
        const decoder = new TextDecoder('utf-8');
        const data = await deno.readFile(p);
        return decoder.decode(data);
      } catch (e) {}
      return undefined;
    },
    readFileSync(p) {
      try {
        const decoder = new TextDecoder('utf-8');
        const data = deno.readFileSync(p);
        return decoder.decode(data);
      } catch (e) {}
      return undefined;
    },
    async realpath(p) {
      try {
        return await deno.realPath(p);
      } catch (e) {}
      return undefined;
    },
    realpathSync(p) {
      try {
        return deno.realPathSync(p);
      } catch (e) {}
      return undefined;
    },
    async rename(oldPath, newPath) {
      const results: CompilerSystemRenameResults = {
        oldPath,
        newPath,
        error: null,
        oldDirs: [],
        oldFiles: [],
        newDirs: [],
        newFiles: [],
        renamed: [],
        isFile: false,
        isDirectory: false,
      };
      try {
        await deno.rename(oldPath, newPath);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    resolvePath(p) {
      return normalizePath(p);
    },
    async rmdir(p, opts) {
      const results: CompilerSystemRemoveDirectoryResults = { basename: basename(p), dirname: dirname(p), path: p, removedDirs: [], removedFiles: [], error: null };
      try {
        await deno.remove(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    rmdirSync(p, opts) {
      const results: CompilerSystemRemoveDirectoryResults = { basename: basename(p), dirname: dirname(p), path: p, removedDirs: [], removedFiles: [], error: null };
      try {
        deno.removeSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    async stat(p) {
      try {
        const stat = await deno.stat(p);
        const results: CompilerFsStats = { isFile: () => stat.isFile, isDirectory: () => stat.isDirectory, isSymbolicLink: () => stat.isSymlink, size: stat.size };
        return results;
      } catch (e) {}
      return undefined;
    },
    statSync(p) {
      try {
        const stat = deno.statSync(p);
        const results: CompilerFsStats = { isFile: () => stat.isFile, isDirectory: () => stat.isDirectory, isSymbolicLink: () => stat.isSymlink, size: stat.size };
        return results;
      } catch (e) {}
      return undefined;
    },
    tmpdir() {
      if (tmpDir == null) {
        tmpDir = deno.makeTempDirSync();
      }
      return tmpDir;
    },
    async unlink(p) {
      const results: CompilerSystemUnlinkResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        error: null,
      };
      try {
        await deno.remove(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    unlinkSync(p) {
      const results: CompilerSystemUnlinkResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        error: null,
      };
      try {
        deno.removeSync(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    async writeFile(p, content) {
      const results: CompilerSystemWriteFileResults = {
        path: p,
        error: null,
      };
      try {
        const encoder = new TextEncoder();
        await deno.writeFile(p, encoder.encode(content));
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    writeFileSync(p, content) {
      const results: CompilerSystemWriteFileResults = {
        path: p,
        error: null,
      };
      try {
        const encoder = new TextEncoder();
        deno.writeFileSync(p, encoder.encode(content));
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    watchDirectory(p, callback, recursive) {
      const fsWatcher = deno.watchFs(p, { recursive });

      const dirWatcher = async () => {
        try {
          for await (const fsEvent of fsWatcher) {
            for (const fsPath of fsEvent.paths) {
              const fileName = normalizePath(fsPath);

              if (fsEvent.kind === 'create') {
                callback(fileName, 'dirAdd');
                sys.events.emit('dirAdd', fileName);
              } else if (fsEvent.kind === 'modify') {
                callback(fileName, 'fileUpdate');
                sys.events.emit('fileUpdate', fileName);
              } else if (fsEvent.kind === 'remove') {
                callback(fileName, 'dirDelete');
                sys.events.emit('dirDelete', fileName);
              }
            }
          }
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      dirWatcher();

      const close = async () => {
        try {
          await fsWatcher.return();
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      sys.addDestory(close);

      return {
        close,
      };
    },
    watchFile(p, callback) {
      const fsWatcher = deno.watchFs(p, { recursive: false });

      const fileWatcher = async () => {
        try {
          for await (const fsEvent of fsWatcher) {
            for (const fsPath of fsEvent.paths) {
              const fileName = normalizePath(fsPath);

              if (fsEvent.kind === 'create') {
                callback(fileName, 'fileAdd');
                sys.events.emit('fileAdd', fileName);
              } else if (fsEvent.kind === 'modify') {
                callback(fileName, 'fileUpdate');
                sys.events.emit('fileUpdate', fileName);
              } else if (fsEvent.kind === 'remove') {
                callback(fileName, 'fileDelete');
                sys.events.emit('fileDelete', fileName);
              }
            }
          }
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      fileWatcher();

      const close = async () => {
        try {
          await fsWatcher.return();
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      sys.addDestory(close);

      return {
        close,
      };
    },
    async generateContentHash(content) {
      // https://github.com/denoland/deno/issues/1891
      // https://jsperf.com/hashcodelordvlad/121
      const len = content.length;
      if (len === 0) return '';
      let hash = 0;
      for (let i = 0; i < len; i++) {
        hash = (hash << 5) - hash + content.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      if (hash < 0) {
        hash = hash * -1;
      }
      return hash + '';
    },
    copy: (copyTasks, srcDir) => denoCopyTasks(deno, copyTasks, srcDir),
    details: {
      // https://github.com/denoland/deno/issues/3802
      cpuModel: 'cpu-model',
      cpus: 8,
      freemem: () => 0,
      platform: deno.build.os,
      release: deno.build.vendor,
      runtime: 'deno',
      runtimeVersion: deno.version.deno,
      totalmem: 0,
    },
  };

  ((gbl: any) => {
    gbl.Buffer = {};

    const currentUrl = new URL('./', import.meta.url);
    gbl.__filename = currentUrl.pathname;
    gbl.__dirname = dirname(gbl.__filename);

    const process = (gbl.process = gbl.process || {});
    process.argv = [deno.execPath(), gbl.__filename, ...deno.args];
    process.binding = () => ({});
    process.cwd = () => deno.cwd();
    process.chdir = (dir: string) => deno.chdir(dir);
    process.env = {};
    process.nextTick = (cb: () => void) => queueMicrotask(cb);
    process.platform = deno.build.os === 'windows' ? 'win32' : deno.build.os;
    process.version = 'v12.0.0';
  })(globalThis);

  return sys;
}
