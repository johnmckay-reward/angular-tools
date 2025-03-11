# Angular Tools
A collection of scripts useful for cleaning up an old Angular codebase.

## `remove-unused-artifacts.js`

This script iterates through various artifacts in your codebase, attempts to delete them, and then tries to build your Angular app. If the build succeeds, the script commits the change and proceeds to the next artifact.

The following artifacts are checked:
- Components
- Directives
- Pipes
- Services
- Guards
- Interceptors
- Interfaces
- Enums

> **⚠ WARNING:**  
> Before running this script, create a new branch and ensure all your changes are committed.

> **ℹ IMPORTANT:**  
> If your modules use `CUSTOM_ELEMENTS_SCHEMA`, the app may still build successfully even if components are removed. This means the script might delete components that are still in use.

### Workarounds:
- Convert individual components using `CUSTOM_ELEMENTS_SCHEMA` into standalone components *before* running this script.
- If you're on an older Angular version that doesn't support standalone components, move components requiring `CUSTOM_ELEMENTS_SCHEMA` into their own modules.


## `remove-unused-component-functions.js`

This script scans an Angular project, identifies unused methods in .component.ts files, and removes them if they are not referenced in TypeScript or HTML templates.

### Features

* Recursively searches for .component.ts files.
* Identifies Angular component classes decorated with @Component.
* Checks if class methods are used in TypeScript or HTML.
* Removes methods that are not referenced anywhere.
* Skips Angular lifecycle hooks (ngOnInit, ionViewDidEnter, etc.).
* Generates a report summarizing removed and kept methods.

### Installation

Ensure you have Node.js installed. Then, install dependencies:

    npm install ts-morph

### Usage

Run the script with an optional directory path:

    node remove-unused-component-functions.js path/to/angular/project

If no path is provided, it defaults to the current directory (.).

### Output

* Logs processed files and removed methods.
* Saves modified .component.ts files automatically.
* Displays a report of skipped, removed, and retained methods.

