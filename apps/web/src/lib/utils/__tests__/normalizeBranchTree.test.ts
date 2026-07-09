import { extractBranchTreePayload, normalizeBranchTreeNode } from '../normalizeBranchTree';

describe('normalizeBranchTree', () => {
  it('maps snake_case branch fields', () => {
    const node = normalizeBranchTreeNode({
      id: 1,
      branch_name: 'HQ',
      branch_code: 'HQ-01',
      children: [],
    });

    expect(node.branchName).toBe('HQ');
    expect(node.branchCode).toBe('HQ-01');
  });

  it('maps name/code fallback fields from tree API', () => {
    const node = normalizeBranchTreeNode({
      id: 2,
      name: 'Regional Office',
      code: 'RO-01',
      children: [{ id: 3, name: 'Sub Branch', code: 'SB-01', children: [] }],
    });

    expect(node.branchName).toBe('Regional Office');
    expect(node.branchCode).toBe('RO-01');
    expect(node.children[0]?.branchName).toBe('Sub Branch');
  });

  it('extracts nested API payloads', () => {
    const tree = extractBranchTreePayload({
      success: true,
      data: [{ id: 1, branch_name: 'HQ', branch_code: 'HQ-01', children: [] }],
    });

    expect(tree).toHaveLength(1);
    expect(tree[0]?.branchName).toBe('HQ');
  });
});
