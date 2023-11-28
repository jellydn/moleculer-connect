#!/usr/bin/env node

import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pkg from "../package.json";

import connectCommand from "./connect";
import { logger } from "./logger";

logger.info(`Moleculer-Connect CLI v${pkg.version}`);

yargs(hideBin(process.argv))
	.command(
		"$0",
		connectCommand.describe,
		connectCommand.builder,
		connectCommand.handler
	)
	.demandCommand(1)
	.help().argv;

process.on("exit", () => {
	logger.info("Bye!");
});
