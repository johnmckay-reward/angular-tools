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

