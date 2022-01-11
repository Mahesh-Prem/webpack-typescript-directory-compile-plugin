This Webpack plugin takes a source directory of typescript files and compiles them to a destination directory.

## Including Package
```bash
npm install @ssigwart/webpack-typescript-directory-compile-plugin --save-dev
```

## Example Usage

```js
const path = require('path');
const { TypescriptDirectoryCompileWebpackPlugin } = require('@ssigwart/webpack-typescript-directory-compile-plugin');

const tsDirCompilePlugin = new TypescriptDirectoryCompileWebpackPlugin(path.resolve(__dirname, "./ts/web"), path.resolve(__dirname, "www/js"));

module.exports = {
	entry: tsDirCompilePlugin.getEntry(),
	output: {
		path: tsDirCompilePlugin.getOutputPath(),
		filename: "[name].js",
	},
	resolve: {
		extensions: [".ts"],
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: "ts-loader" },
		],
	},
	plugins: [
		tsDirCompilePlugin
	]
};
```
