---
to: src/types/api/index.ts
unless_exists: true
---
export * from './auth';
export * from './branch';
export * from './item';
export * from './menu';
export * from './role';
export * from './user';
export * from './<%= singular %>';
