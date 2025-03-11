Angular Tools
A collection of scripts to help clean up an old Angular codebase.

remove-unused-artifacts.js
This script iterates through various artifacts in your codebase, attempts to delete them, and then tries to build your Angular app. If the build succeeds, the script commits the change and moves on to the next artifact.

Artifacts checked:
Components
Directives
Pipes
Services
Guards
Interceptors
Interfaces
Enums
⚠ WARNING:
Before running this script, create a new branch and ensure all your changes are committed.

ℹ IMPORTANT:
If your modules use CUSTOM_ELEMENTS_SCHEMA, the app may still build successfully even if components are removed. This means the script might delete components that are still in use.

Workarounds:
Convert components using CUSTOM_ELEMENTS_SCHEMA into standalone components before running this script.
If you're on an older Angular version that doesn't support standalone components, move components requiring CUSTOM_ELEMENTS_SCHEMA into their own modules.
remove-unused-component-functions.js
This script scans all components in your codebase, identifies unused functions, and removes them.

Notes:
The script ignores:
Constructors
Functions starting with ng or ion
It may miss other interface implementations, so a manual review is recommended.
After running the script, ensure your project still builds and runs correctly.
