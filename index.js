const glob = require('glob');
const path = require('path');
const fs = require('fs');
const { watch } = require('fs/promises');
const { EntryPlugin, EntryDependency } = require('webpack');

class TypescriptDirectoryCompileWebpackPlugin
{
	/**
	 * @param {string} srcFullDir Full path of source directory where TS files are
	 * @param {string} outFullDir Full path of output directory where JS files will be generated
	 */
	constructor(srcFullDir, outFullDir)
	{
		if (!srcFullDir.endsWith(path.sep))
			srcFullDir += path.sep;
		this.srcFullDir = srcFullDir;
		if (!outFullDir.endsWith(path.sep))
			outFullDir += path.sep;
		this.outFullDir = outFullDir;
	}

	/**
	 * Get webpack entry
	 *
	 * @return {object} Webpack entry object
	 */
	getEntry()
	{
		return glob.sync(this.srcFullDir + "**" + path.sep + "*.ts").reduce((rtn, filePath) => {
			let entry = filePath.replace(/\.ts$/, '');
			if (entry.startsWith(this.srcFullDir))
				entry = entry.substring(this.srcFullDir.length);
			rtn[entry] = filePath;
			return rtn;
		}, {});
	}

	/**
	 * Get output path
	 *
	 * @return {string} Full output path
	 */
	getOutputPath() {
		return this.outFullDir;
	}

	async apply(compiler)
	{
		const that = this;
		// If watching
		if (compiler.options.watch)
		{
			const watcher = watch(that.srcFullDir, {
				recursive: true
			});
			for await (const event of watcher)
			{
				try
				{
					if (event.eventType === "rename")
					{
						const filePath = that.srcFullDir + event.filename;
						let name = filePath.replace(/\.ts$/, '');
						if (name.startsWith(this.srcFullDir))
							name = name.substring(this.srcFullDir.length);
						const exists = fs.existsSync(filePath);
						if (exists)
						{
							if (fs.statSync(filePath).isFile())
							{
								const entryDependency = new EntryPlugin(compiler.context, filePath, { name: name });
								entryDependency.apply(compiler);

								// TODO: Without this, it crashes if a file is added while compiling (e.g. on initial startup). See https://github.com/TypeStrong/ts-loader/pull/1290. By making sure compiler is idle, we avoid that, but it might mean that we miss recompiling a file in certain cases
								if (compiler.idle)
								{
									compiler.watching.invalidate((err, stats) => {
										if (err)
										{
											console.error("Failed to invalidate watcher.");
											console.error(err);
										}
									});
								}
							}
						}
						// Invalid watcher
						else
						{
							compiler.watching.invalidate((err, stats) => {
								if (err)
								{
									console.error("Failed to invalidate watcher.");
									console.error(err);
								}
							});

							// Remove compiled version
							try {
								const compiledFilePath = that.outFullDir + name + ".js";
								if (fs.existsSync(compiledFilePath))
								{
									if (fs.statSync(compiledFilePath).isFile())
										fs.unlinkSync(compiledFilePath);
								}
								else
								{
									const compiledDirPath = that.outFullDir + name;
									if (fs.statSync(compiledDirPath).isDirectory())
										fs.rmdirSync(compiledDirPath);
								}
							} catch (e) {
								console.error(e);
							}
						}
					}
				} catch (e) {
					console.error(e);
				}
			}
		}
	}
}

module.exports = {
	TypescriptDirectoryCompileWebpackPlugin: TypescriptDirectoryCompileWebpackPlugin
};
