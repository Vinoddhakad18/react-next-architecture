---
to: src/services/index.ts
inject: true
append: true
skip_if: export { <%= entityCamel %>Service } from './<%= singular %>.service';
---
export { <%= entityCamel %>Service } from './<%= singular %>.service';
export type { Create<%= entityPascal %>Request, Update<%= entityPascal %>Request } from './<%= singular %>.service';
