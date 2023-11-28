import Moleculer from "moleculer";
import os from "os";
import fs from "fs";
import path from "path";
import * as glob from "glob";
import { logger } from "./logger";

/**
 * Creates an instance of ServiceBroker
 *
 * @param {Object} opts Contains commands defined in the CLI
 * @param {string} opts.transporter Transporter configuration
 * @param {string} opts.connectionString Connection string
 * @param {boolean} opts.version Show version number
 * @param {boolean} opts.help Show help
 * @param {string} opts.config Location of the configuration file
 * @param {string} opts.ns Namespace
 * @param {string} opts.level Logging level
 * @param {string} opts.id Node ID
 * @param {boolean} opts.hot enable hot reload
 * @param {string} opts.serializer serializer
 * @param {string} opts.commands Custom REPL command file mask (e.g.: ./commands/*.js)
 * @returns {import('moleculer').ServiceBroker}
 */
export default async function handler(opts) {
	let replCommands;
	if (opts.commands) {
		replCommands = [];

		if (opts.commands.endsWith("/")) {
			opts.commands += "**/*.*js";
		}

		const files = glob.sync(opts.commands);
		files.forEach((file) => {
			try {
				logger.info(`Load custom REPL commands from '${file}'...`);
				let cmd = require(path.resolve(file));
				cmd = cmd.default != null && cmd.__esModule ? cmd.default : cmd;

				if (!Array.isArray(cmd)) cmd = [cmd];

				replCommands.push(...cmd);
			} catch (err) {
				logger.error(err);
			}
		});
	}

	const configFile = process.env.MOLECULER_CONFIG || opts.config;
	/** @type {import("moleculer").BrokerOptions} Service Broker config file*/
	const config = (configFile ? loadConfigFile(configFile) : null) || {};

	if (config.logger === undefined) config.logger = true;

	if (opts.level) {
		if (String(opts.level) === "silent") config.logger = false;
		else config.logLevel = opts.level;
	}

	if (opts.ns) config.namespace = opts.ns;

	if (opts.transporter) config.transporter = opts.transporter;
	else if (opts.connectionString) config.transporter = opts.connectionString;
	else if (process.env.TRANSPORTER)
		config.transporter = process.env.TRANSPORTER;
	else if (config.nodeID === undefined && String(opts._[0]) === "connect") {
		if (!config.transporter) {
			config.transporter = "TCP"; // TCP the default if no connection string
		}
	}

	if (opts.id) config.nodeID = opts.id;
	else if (config.nodeID === undefined)
		config.nodeID = `cli-${os.hostname().toLowerCase()}-${process.pid}`;

	if (opts.serializer) config.serializer = opts.serializer;

	if (opts.hot) config.hotReload = opts.hot;

	if (replCommands) config.replCommands = replCommands;

	const broker = new Moleculer.ServiceBroker(config);

	await broker.start();

	return broker;
}

/**
 * Load configuration file
 *
 */
function loadConfigFile(configFile: string) {
	const filePath = path.isAbsolute(configFile)
		? configFile
		: path.resolve(process.cwd(), configFile);
	if (filePath) {
		if (!fs.existsSync(filePath))
			throw new Error(`Config file not found: ${filePath}`);

		const ext = path.extname(filePath);
		switch (ext) {
			case ".json":
			case ".ts":
			case ".js": {
				logger.info(`Load broker configuration from '${filePath}'...`);
				const content = require(filePath);
				if (typeof content === "function") return content.call(this);

				return content.default != null && content.__esModule
					? content.default
					: content;
			}
			default:
				throw new Error(`Not supported file extension: ${ext}`);
		}
	}
}
