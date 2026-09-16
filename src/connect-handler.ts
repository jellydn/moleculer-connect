import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as glob from "glob";
import Moleculer from "moleculer";
import type { ArgumentsCamelCase } from "yargs";

import { logger } from "./logger";

type LegacyBrokerOptions = Moleculer.BrokerOptions & {
    replCommands?: unknown[];
    replDelimiter?: string;
};

export interface ConnectOptions {
    commands?: string | null;
    config?: string;
    connectionString?: string;
    hot?: boolean;
    id?: string | null;
    level?: string;
    ns?: string;
    serializer?: string | null;
    transporter?: string;
}

export type ConnectArguments = ArgumentsCamelCase<ConnectOptions>;

function applyCustomReplCommands(config: Moleculer.BrokerOptions, commands: unknown[]) {
    const existing = config.replOptions?.customCommands ?? [];
    config.replOptions = {
        ...config.replOptions,
        customCommands: [...existing, ...commands] as Moleculer.ReplOptions["customCommands"],
    };
}

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
export default async function handler(opts: ConnectArguments) {
    let replCommands: unknown[] | undefined;
    if (opts.commands) {
        const commands: unknown[] = [];

        if (opts.commands.endsWith("/")) {
            opts.commands += "**/*.*js";
        }

        const files = glob.sync(opts.commands);
        for (const file of files) {
            try {
                logger.info(`Load custom REPL commands from '${file}'...`);
                const importedModule = await import(pathToFileURL(path.resolve(file)).href);
                let cmd = importedModule.default ?? importedModule;
                cmd = cmd.default != null && cmd.__esModule ? cmd.default : cmd;

                if (!Array.isArray(cmd)) cmd = [cmd];

                commands.push(...cmd);
            } catch (err) {
                logger.error(err);
            }
        }
        replCommands = commands;
    }

    const configFile = process.env.MOLECULER_CONFIG || opts.config;
    const config: LegacyBrokerOptions =
        (configFile ? await loadConfigFile(configFile) : null) || {};

    if (config.logger === undefined) config.logger = true;

    if (opts.level) {
        if (String(opts.level) === "silent") config.logger = false;
        else config.logLevel = opts.level as Moleculer.BrokerOptions["logLevel"];
    }

    if (opts.ns) config.namespace = opts.ns;

    const transporter = opts.transporter || opts.connectionString || process.env.TRANSPORTER;
    if (transporter) {
        // Moleculer accepts connection URL strings at runtime, but its types omit them.
        config.transporter = transporter as Moleculer.BrokerOptions["transporter"];
    } else if (config.nodeID === undefined && String(opts._[0]) === "connect") {
        if (!config.transporter) {
            config.transporter = "TCP"; // TCP the default if no connection string
        }
    }

    if (opts.id) config.nodeID = opts.id;
    else if (config.nodeID === undefined)
        config.nodeID = `cli-${os.hostname().toLowerCase()}-${process.pid}`;

    if (opts.serializer) {
        config.serializer = opts.serializer as Moleculer.BrokerOptions["serializer"];
    }

    if (opts.hot) config.hotReload = opts.hot;

    if (config.replCommands?.length) {
        applyCustomReplCommands(config, config.replCommands);
        config.replCommands = undefined;
    }
    if (config.replDelimiter) {
        config.replOptions = {
            ...config.replOptions,
            delimiter: config.replOptions?.delimiter ?? config.replDelimiter,
        };
        config.replDelimiter = undefined;
    }
    if (replCommands) applyCustomReplCommands(config, replCommands);

    // Protocol v5 (0.15) can still talk to v4 (0.14) clusters when version checks are off.
    config.transit = {
        ...config.transit,
        disableVersionCheck: config.transit?.disableVersionCheck ?? true,
    };

    const broker = new Moleculer.ServiceBroker(config);

    await broker.start();

    return broker;
}

/**
 * Resolve file path, either absolute or relative to the current working directory.
 */
function resolveFilePath(configFile: string): string {
    return path.isAbsolute(configFile) ? configFile : path.resolve(process.cwd(), configFile);
}

/**
 * Validate if the file exists and is supported.
 */
function validateFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Config file not found: ${filePath}`);
    }

    const supportedExtensions = [".json", ".ts", ".js"];
    const ext = path.extname(filePath);

    if (!supportedExtensions.includes(ext)) {
        throw new Error(`Unsupported file extension: ${ext}`);
    }
}

/**
 * Load and return the configuration from the file.
 */
async function loadConfiguration(filePath: string) {
    const ext = path.extname(filePath);
    logger.info(`Loading broker configuration from '${filePath}'...`);

    if (ext === ".ts" || ext === ".js") {
        const importedModule = await import(filePath);
        return importedModule.default ?? importedModule;
    }

    if (ext === ".json") {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
}

/**
 * Load configuration file
 */
export async function loadConfigFile(configFile: string) {
    const filePath = resolveFilePath(configFile);
    validateFile(filePath);
    return loadConfiguration(filePath);
}
