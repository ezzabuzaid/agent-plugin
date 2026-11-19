import { readFile } from 'node:fs/promises';
import { join, posix } from 'node:path';

import { UnknownProject } from '../errors.ts';
import type { Git } from '../git.ts';
import { Project } from './project.ts';

interface Manifest {
  readonly name: string;
  readonly projectType: unknown;
}

/**
 * The library projects of the workspace: each tracked project.json whose
 * projectType is "library", wherever it sits. Tracked files only, so the
 * project.json of an installed package in an ignored folder is none.
 */
export class Workspace {
  readonly #git: Git;

  constructor(git: Git) {
    this.#git = git;
  }

  async projects(): Promise<Project[]> {
    const files = (
      await this.#git.run(['ls-files', '-z', '--', ':(glob)**/project.json'])
    )
      .split('\0')
      .filter(Boolean);
    const projects: Project[] = [];
    for (const file of files) {
      const { name, projectType } = await this.#manifest(file);
      if (projectType !== 'library') {
        continue;
      }
      const root = posix.dirname(file);
      const { name: npmName } = await this.#manifest(
        posix.join(root, 'package.json'),
      );
      projects.push(new Project(name, npmName, root));
    }
    return projects.toSorted((a, b) => a.name.localeCompare(b.name));
  }

  async project(name: string): Promise<Project> {
    const projects = await this.projects();
    const found = projects.find((project) => project.name === name);
    if (found === undefined) {
      throw new UnknownProject(
        name,
        projects.map((project) => project.name),
      );
    }
    return found;
  }

  async #manifest(file: string): Promise<Manifest> {
    const value: unknown = JSON.parse(
      await readFile(join(this.#git.directory, file), 'utf8'),
    );
    if (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      typeof value.name === 'string'
    ) {
      return {
        name: value.name,
        projectType: 'projectType' in value ? value.projectType : undefined,
      };
    }
    throw new TypeError(`${file} has no "name" string`);
  }
}
