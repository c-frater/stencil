import fs from 'fs-extra';
import { join } from 'path';
import { BuildOptions } from '../utils/options';
import { RollupOptions, rollup } from 'rollup';
import { denoStdPlugin } from './plugins/deno-std-plugin';
import terser from 'terser';

export async function pathUtils(opts: BuildOptions) {
  const pathUtilsDir = join(opts.bundleHelpersDir, 'path-utils');
  const inputFile = join(pathUtilsDir, 'deno-source.js');
  const esmFile = join(pathUtilsDir, 'path-utils.js');
  const cjsFile = join(pathUtilsDir, 'path-utils.cjs.js');

  if (!opts.isProd) {
    const exists = fs.existsSync(esmFile);
    if (exists) {
      return;
    }
  }

  const denoBundle: RollupOptions = {
    input: inputFile,
    plugins: [
      {
        name: 'denoPathUtilsPlugin',
        load(id) {
          if (id.endsWith('_constants.ts')) {
            return pathConstants;
          }
          return null;
        },
      },
      denoStdPlugin(),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  const build = await rollup(denoBundle);
  const esmOutput = await build.generate({
    format: 'cjs',
    file: esmFile,
    preferConst: true,
    esModule: false,
    strict: false,
    intro: esmIntro,
    outro,
  });

  let esmCode = esmOutput.output[0].code;
  esmCode = esmCode.replace(/Deno/g, 'ctx');

  const esmMinifyResults = terser.minify(esmCode, {
    ecma: 2018,
    compress: {
      passes: 2,
      ecma: 2018,
      module: true,
    },
    output: {
      ecma: 2018,
    },
  });

  if (esmMinifyResults.error) {
    throw esmMinifyResults.error;
  }

  await fs.writeFile(esmFile, esmMinifyResults.code);

  const cjsOutput = await build.generate({
    format: 'cjs',
    file: cjsFile,
    preferConst: true,
    esModule: false,
    strict: false,
    intro: cjsIntro,
    outro,
  });

  let cjsCode = cjsOutput.output[0].code;
  cjsCode = cjsCode.replace(/Deno/g, 'ctx');

  const cjsMinifyResults = terser.minify(cjsCode, {
    ecma: 2018,
    compress: {
      passes: 2,
      ecma: 2018,
    },
    output: {
      ecma: 2018,
    },
  });

  if (cjsMinifyResults.error) {
    throw cjsMinifyResults.error;
  }

  await fs.writeFile(cjsFile, cjsMinifyResults.code);
}

const esmIntro = `
export const getPathUtils = (pathConfig) => {
  const exports = {};
  const ctx = {
    cwd: pathConfig.cwd,
    env: pathConfig.env,
    isWindows: !!pathConfig.isWindows
  };
`;

const cjsIntro = `
exports.getPathUtils = (pathConfig) => {
  const exports = {};
  const ctx = {
    cwd: pathConfig.cwd,
    env: pathConfig.env,
    isWindows: !!pathConfig.isWindows
  };
`;

const outro = `
  return exports;
};
`;

const pathConstants = `
// Providing our own isWindows export
export const isWindows = ctx.isWindows;

// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/

// Alphabet chars.
export const CHAR_UPPERCASE_A = 65; /* A */
export const CHAR_LOWERCASE_A = 97; /* a */
export const CHAR_UPPERCASE_Z = 90; /* Z */
export const CHAR_LOWERCASE_Z = 122; /* z */

// Non-alphabetic chars.
export const CHAR_DOT = 46; /* . */
export const CHAR_FORWARD_SLASH = 47; /* / */
export const CHAR_BACKWARD_SLASH = 92; /* \ */
export const CHAR_VERTICAL_LINE = 124; /* | */
export const CHAR_COLON = 58; /* : */
export const CHAR_QUESTION_MARK = 63; /* ? */
export const CHAR_UNDERSCORE = 95; /* _ */
export const CHAR_LINE_FEED = 10; /* \n */
export const CHAR_CARRIAGE_RETURN = 13; /* \r */
export const CHAR_TAB = 9; /* \t */
export const CHAR_FORM_FEED = 12; /* \f */
export const CHAR_EXCLAMATION_MARK = 33; /* ! */
export const CHAR_HASH = 35; /* # */
export const CHAR_SPACE = 32; /*   */
export const CHAR_NO_BREAK_SPACE = 160; /* \u00A0 */
export const CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279; /* \uFEFF */
export const CHAR_LEFT_SQUARE_BRACKET = 91; /* [ */
export const CHAR_RIGHT_SQUARE_BRACKET = 93; /* ] */
export const CHAR_LEFT_ANGLE_BRACKET = 60; /* < */
export const CHAR_RIGHT_ANGLE_BRACKET = 62; /* > */
export const CHAR_LEFT_CURLY_BRACKET = 123; /* { */
export const CHAR_RIGHT_CURLY_BRACKET = 125; /* } */
export const CHAR_HYPHEN_MINUS = 45; /* - */
export const CHAR_PLUS = 43; /* + */
export const CHAR_DOUBLE_QUOTE = 34; /* " */
export const CHAR_SINGLE_QUOTE = 39; /* ' */
export const CHAR_PERCENT = 37; /* % */
export const CHAR_SEMICOLON = 59; /* ; */
export const CHAR_CIRCUMFLEX_ACCENT = 94; /* ^ */
export const CHAR_GRAVE_ACCENT = 96; /*  */
export const CHAR_AT = 64; /* @ */
export const CHAR_AMPERSAND = 38; /* & */
export const CHAR_EQUAL = 61; /* = */

// Digits
export const CHAR_0 = 48; /* 0 */
export const CHAR_9 = 57; /* 9 */
`;
