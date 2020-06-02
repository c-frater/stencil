import { PlatformPath } from '../../../declarations';
import { getPathUtils } from '@path-utils';
import { IS_WINDOWS_ENV, normalizePath } from '@utils';

const pathUtils = getPathUtils({
  isWindows: IS_WINDOWS_ENV,
});

const path: PlatformPath = pathUtils.path;

if (IS_WINDOWS_ENV) {
  path.normalize = (...args: string[]) => normalizePath(path.normalize.apply(path, args));
  path.join = (...args: string[]) => normalizePath(path.join.apply(path, args));
  path.relative = (...args: string[]) => normalizePath(path.relative.apply(path, args));
  path.resolve = (...args: string[]) => normalizePath(path.resolve.apply(path, args));
}

export const basename = path.basename;
export const dirname = path.dirname;
export const extname = path.extname;
export const isAbsolute = path.isAbsolute;
export const join = path.join;
export const normalize = path.normalize;
export const relative = path.relative;
export const resolve = path.resolve;
export const sep = path.sep;
export const delimiter = path.delimiter;
export const posix = path.posix;
export const win32 = path.win32;

export default path;
