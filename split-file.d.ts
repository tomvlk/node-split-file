/**
 * Type definitions for split-file
 * Project: https://github.com/tomvlk/node-split-file
 * Definitions: bundled
 */

/**
 * Split the given file into the specified number of parts.
 *
 * @param file Absolute or relative path to the input file.
 * @param parts Number of parts to create (must be >= 1).
 * @param dest Optional destination directory for the generated parts. Defaults to the input file directory.
 * @returns Promise that resolves with an array of full paths to the created part files.
 */
declare function splitFile(
  file: string,
  parts: number,
  dest?: string
): Promise<string[]>;

/**
 * Split the given file into multiple parts, each with a maximum size in bytes.
 *
 * @param file Absolute or relative path to the input file.
 * @param maxSize Maximum size (in bytes) for each part. The last part may be smaller.
 * @param dest Optional destination directory for the generated parts. Defaults to the input file directory.
 * @returns Promise that resolves with an array of full paths to the created part files.
 */
declare function splitFileBySize(
  file: string,
  maxSize: number,
  dest?: string
): Promise<string[]>;

/**
 * Merge the specified part files into a single output file.
 *
 * @param names Array of full paths to the part files, in the correct order.
 * @param outputFile Full path to the output file to be written.
 * @returns Promise that resolves with the full path to the output file when merging completes.
 */
declare function mergeFiles(names: string[], outputFile: string): Promise<string>;

declare const splitFileModule: {
  splitFile: typeof splitFile;
  splitFileBySize: typeof splitFileBySize;
  mergeFiles: typeof mergeFiles;
};

export = splitFileModule;
