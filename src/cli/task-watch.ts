import { Config, CheckVersion, DevServer } from '../declarations';
import { runPrerenderTask } from './task-prerender';
import { startupLog } from './startup-log';

export async function taskWatch(config: Config, checkVersion: CheckVersion) {
  let devServer: DevServer = null;
  let exitCode = 0;

  try {
    const compilerPath = config.sys.getCompilerExecutingPath();
    const coreCompiler: typeof import('@stencil/core/compiler') = await import(compilerPath);
    startupLog(config, coreCompiler);

    const checkVersionPromise = checkVersion ? checkVersion(config, coreCompiler.version) : null;
    const compiler = await coreCompiler.createCompiler(config);
    const watcher = await compiler.createWatcher();

    if (config.flags.serve) {
      const devServerPath = config.sys.getDevServerExecutingPath();
      const { start }: typeof import('@stencil/core/dev-server') = await import(devServerPath);
      devServer = await start(config.devServer, config.logger, watcher);
    }

    config.sys.onProcessInterrupt(() => {
      compiler.destroy();
    });

    if (checkVersionPromise != null) {
      const checkVersionResults = await checkVersionPromise;
      checkVersionResults();
    }

    if (devServer) {
      const rmDevServerLog = watcher.on('buildFinish', () => {
        // log the dev server url one time
        config.logger.info(`${config.logger.cyan(devServer.browserUrl)}\n`);
        rmDevServerLog();
      });
    }

    if (config.flags.prerender) {
      watcher.on('buildFinish', async results => {
        if (!results.hasError) {
          const prerenderDiagnostics = await runPrerenderTask(coreCompiler, config, results.hydrateAppFilePath, results.componentGraph, null);
          config.logger.printDiagnostics(prerenderDiagnostics);
        }
      });
    }

    const closeResults = await watcher.start();
    if (closeResults.exitCode > 0) {
      exitCode = closeResults.exitCode;
    }
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (devServer) {
    await devServer.close();
  }

  if (exitCode > 0) {
    config.sys.exit(exitCode);
  }
}
