---
to: src/types/api/<%= singular %>.ts
---
export interface <%= entityPascal %> {
  id: string;
  <% fields.forEach((field) => { %><%= field.name %>: <%= field.tsType %>;
  <% }) %>
}

export interface <%= entityPascal %>ListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface <%= pluralPascal %>ListResponse {
  data: <%= entityPascal %>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Create<%= entityPascal %>Request {
  <% fields.forEach((field) => { %><%= field.name %>: <%= field.tsType %>;
  <% }) %>
}

export interface Update<%= entityPascal %>Request {
  <% fields.forEach((field) => { %><%= field.name %>?: <%= field.tsType %>;
  <% }) %>
}
