'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BranchTreeNode } from '@/types/api/branch';
import { cn } from '@/lib/utils/cn';

export interface BranchTreeSelectProps {
  label?: string;
  tree: BranchTreeNode[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

interface BranchMatch {
  node: BranchTreeNode;
  path: string[];
}

function walkTree(
  nodes: BranchTreeNode[],
  visit: (node: BranchTreeNode, ancestors: BranchTreeNode[]) => void,
  ancestors: BranchTreeNode[] = []
) {
  for (const node of nodes) {
    visit(node, ancestors);
    if (node.children.length > 0) {
      walkTree(node.children, visit, [...ancestors, node]);
    }
  }
}

function buildBranchLookup(tree: BranchTreeNode[]) {
  const map = new Map<number, { name: string; code: string }>();
  walkTree(tree, (node) => {
    map.set(node.id, { name: node.branchName, code: node.branchCode });
  });
  return map;
}

function getAncestorIds(tree: BranchTreeNode[], targetIds: number[]) {
  const ancestors = new Set<number>();
  const targets = new Set(targetIds);

  walkTree(tree, (node, nodeAncestors) => {
    if (targets.has(node.id)) {
      nodeAncestors.forEach((ancestor) => ancestors.add(ancestor.id));
    }
  });

  return ancestors;
}

function nodeMatchesQuery(node: BranchTreeNode, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    node.branchName.toLowerCase().includes(normalized) ||
    node.branchCode.toLowerCase().includes(normalized)
  );
}

function collectMatches(nodes: BranchTreeNode[], query: string, path: string[] = []): BranchMatch[] {
  const matches: BranchMatch[] = [];

  for (const node of nodes) {
    const currentPath = [...path, node.branchName];
    if (nodeMatchesQuery(node, query)) {
      matches.push({ node, path: currentPath });
    }
    if (node.children.length > 0) {
      matches.push(...collectMatches(node.children, query, currentPath));
    }
  }

  return matches;
}

function filterTree(nodes: BranchTreeNode[], query: string): BranchTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  return nodes.reduce<BranchTreeNode[]>((acc, node) => {
    const filteredChildren = filterTree(node.children, query);
    const selfMatches = nodeMatchesQuery(node, query);

    if (selfMatches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren,
      });
    }

    return acc;
  }, []);
}

function BranchTreeNodeItem({
  node,
  depth,
  selectedIds,
  expandedIds,
  onToggleSelect,
  onToggleExpand,
  forceExpanded,
}: {
  node: BranchTreeNode;
  depth: number;
  selectedIds: number[];
  expandedIds: Set<number>;
  onToggleSelect: (id: number, checked: boolean) => void;
  onToggleExpand: (id: number) => void;
  forceExpanded?: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = forceExpanded || expandedIds.has(node.id);
  const isChecked = selectedIds.includes(node.id);

  return (
    <li>
      <div
        className="flex items-center gap-1 py-1 pr-2 text-sm text-slate-700"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            onClick={() => onToggleExpand(node.id)}
            aria-label={isExpanded ? `Collapse ${node.branchName}` : `Expand ${node.branchName}`}
          >
            <span className="text-lg leading-none">{isExpanded ? '▾' : '▸'}</span>
          </button>
        ) : (
          <span className="h-7 w-7 shrink-0" aria-hidden />
        )}
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="shrink-0"
            checked={isChecked}
            onChange={(e) => onToggleSelect(node.id, e.target.checked)}
          />
          <span className="truncate">
            {node.branchName}
            {node.branchCode ? (
              <span className="ml-1 text-slate-500">({node.branchCode})</span>
            ) : null}
          </span>
        </label>
      </div>
      {hasChildren && isExpanded ? (
        <ul>
          {node.children.map((child) => (
            <BranchTreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
              forceExpanded={forceExpanded}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function BranchTreeSelect({ label, tree, selectedIds, onChange }: BranchTreeSelectProps) {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const branchLookup = useMemo(() => buildBranchLookup(tree), [tree]);
  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;

  const filteredTree = useMemo(
    () => (isSearching ? filterTree(tree, trimmedSearch) : tree),
    [tree, trimmedSearch, isSearching]
  );

  const searchMatches = useMemo(
    () => (isSearching ? collectMatches(tree, trimmedSearch) : []),
    [tree, trimmedSearch, isSearching]
  );

  useEffect(() => {
    if (tree.length === 0 || selectedIds.length === 0) {
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);
      getAncestorIds(tree, selectedIds).forEach((id) => next.add(id));
      return next;
    });
  }, [tree, selectedIds]);

  useEffect(() => {
    if (!isSearching) {
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);
      walkTree(filteredTree, (node) => {
        if (node.children.length > 0) {
          next.add(node.id);
        }
      });
      return next;
    });
  }, [filteredTree, isSearching]);

  const handleToggleSelect = (id: number, checked: boolean) => {
    onChange(
      checked ? [...selectedIds, id] : selectedIds.filter((selectedId) => selectedId !== id)
    );
  };

  const handleToggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const next = new Set<number>();
    walkTree(tree, (node) => {
      if (node.children.length > 0) {
        next.add(node.id);
      }
    });
    setExpandedIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleRemoveSelected = (id: number) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <fieldset className="space-y-2">
      {label ? <legend className="text-sm font-medium text-slate-700">{label}</legend> : null}

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          {selectedIds.map((id) => {
            const branch = branchLookup.get(id);
            const chipLabel = branch
              ? `${branch.name}${branch.code ? ` (${branch.code})` : ''}`
              : `Branch #${id}`;

            return (
              <span
                key={id}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                <span className="truncate">{chipLabel}</span>
                <button
                  type="button"
                  className="shrink-0 text-slate-400 hover:text-slate-700"
                  onClick={() => handleRemoveSelected(id)}
                  aria-label={`Remove ${chipLabel}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by branch name or code..."
            className={cn(
              'block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm',
              'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500'
            )}
          />
          {!isSearching ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="text-xs font-medium text-purple-600 hover:text-purple-700"
                onClick={handleExpandAll}
              >
                Expand all
              </button>
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
                onClick={handleCollapseAll}
              >
                Collapse all
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {selectedIds.length} selected
            {isSearching ? ` · ${searchMatches.length} match${searchMatches.length === 1 ? '' : 'es'}` : ''}
          </span>
        </div>

        {tree.length === 0 ? (
          <p className="text-sm text-slate-500">No branches available.</p>
        ) : isSearching ? (
          <ul className="max-h-52 overflow-y-auto">
            {searchMatches.length === 0 ? (
              <li className="py-4 text-center text-sm text-slate-500">No branches match your search.</li>
            ) : (
              searchMatches.map(({ node, path }) => {
                const isChecked = selectedIds.includes(node.id);
                return (
                  <li key={node.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="mt-0.5 shrink-0"
                        checked={isChecked}
                        onChange={(e) => handleToggleSelect(node.id, e.target.checked)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-800">
                          {node.branchName}
                          {node.branchCode ? (
                            <span className="ml-1 text-slate-500">({node.branchCode})</span>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{path.join(' › ')}</span>
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          <ul className="max-h-52 overflow-y-auto">
            {filteredTree.map((node) => (
              <BranchTreeNodeItem
                key={node.id}
                node={node}
                depth={0}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onToggleSelect={handleToggleSelect}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </ul>
        )}
      </div>
    </fieldset>
  );
}
