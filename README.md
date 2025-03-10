# angular-tools
Various Scripts I found useful for cleaning up an old Angular codebase

## remove-unused-artifacts.js

This script will iterate each of the following in your codebase, delete it, and then try and build your Angular app. If the build succeeds, it will commit this change, and then move onto the next artifact:

* Component
* Directive
* Pipe
* Service
* Guard
* Interceptor
* Interface
* Enum

> [!IMPORTANT]  
> If you use CUSTOM_ELEMENTS_SCHEMA in your modules, the app will still build even with components removed, some workarounds:
> Convert the individual components which use CUSTOM_ELEMENTS_SCHEMA to standalone *before* running this script
> If on an older Angular version which doesn't support standalone components, move the components which need CUSTOM_ELEMENTS_SCHEMA into their own modules
