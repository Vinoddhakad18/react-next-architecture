---
to: src/types/api/index.ts
inject: true
append: true
skip_if: export * from './<%= singular %>';
---
export * from './<%= singular %>';
