---
to: src/services/index.ts
unless_exists: true
---
/**
 * Services Module Exports
 */

export { <%= entityCamel %>Service } from './<%= singular %>.service';
export type { Create<%= entityPascal %>Request, Update<%= entityPascal %>Request } from './<%= singular %>.service';
