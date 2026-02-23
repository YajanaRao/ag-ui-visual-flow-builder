# Visual Flow Builder - E2E Test Cases

## Test Suite Overview

This document outlines all end-to-end test cases for the Visual Flow Builder application.

---

## 1. Application Loading Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-1.1 | Application loads successfully | Page title is "flow-builder", main UI visible |
| TC-1.2 | Canvas renders | React Flow canvas is visible with controls |
| TC-1.3 | Initial node exists | "Welcome Node" is displayed on canvas |
| TC-1.4 | Sidebar shows placeholder | "Select a node to edit" message visible |
| TC-1.5 | JSON preview visible | JSON preview section at bottom |

---

## 2. Node Management Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-2.1 | Add new node via button | New node appears on canvas |
| TC-2.2 | Click node selects it | Sidebar shows node properties |
| TC-2.3 | Edit node ID | ID updates in JSON preview |
| TC-2.4 | Edit node title | Title updates on node and JSON |
| TC-2.5 | Edit node description | Description updates in JSON preview |
| TC-2.6 | Delete node via sidebar | Node removed from canvas and JSON |
| TC-2.7 | Set node as start | Star icon appears, only one start node |
| TC-2.8 | Click canvas deselects node | Sidebar shows placeholder message |

---

## 3. Edge Management Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-3.1 | Add edge from sidebar | Edge section expands with new edge |
| TC-3.2 | Select edge target | Target node dropdown updates JSON |
| TC-3.3 | Edit edge condition | Condition updates in JSON |
| TC-3.4 | Delete edge | Edge removed from node's edges array |
| TC-3.5 | Visual edge on canvas | Edge renders between connected nodes |

---

## 4. Validation Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-4.1 | Empty title error | Error message displayed for node |
| TC-4.2 | Missing start node error | Global error shown in toolbar |
| TC-4.3 | Edge missing condition | Error shown on edge in sidebar |
| TC-4.4 | Edge missing target | Error shown on edge in sidebar |
| TC-4.5 | Node with error has red border | Visual indicator on invalid nodes |

---

## 5. JSON Preview Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-5.1 | JSON updates on changes | JSON reflects current state |
| TC-5.2 | Copy JSON to clipboard | Button shows "Copied!" feedback |
| TC-5.3 | Download JSON | File download triggers |
| TC-5.4 | JSON is valid format | Properly formatted JSON structure |

---

## 6. Import/Export Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-6.1 | Import valid JSON | Flow reconstructs on canvas |
| TC-6.2 | Import updates node count | Correct number of nodes after import |
| TC-6.3 | Import invalid JSON | Error alert shown |

---

## 7. Keyboard Shortcuts Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-7.1 | Delete key removes node | Selected node deleted from canvas |
| TC-7.2 | Delete in input field | Normal delete behavior, not node |

---

## Test Priority

### Critical (Must Pass)
- TC-1.1, TC-1.2, TC-1.3
- TC-2.1, TC-2.2, TC-2.3, TC-2.4, TC-2.6
- TC-3.1, TC-3.2, TC-3.3
- TC-5.1, TC-5.2

### High Priority
- TC-2.5, TC-2.7, TC-2.8
- TC-3.4, TC-3.5
- TC-4.1, TC-4.2
- TC-6.1, TC-6.2

### Medium Priority
- TC-4.3, TC-4.4, TC-4.5
- TC-5.3, TC-5.4
- TC-6.3
- TC-7.1, TC-7.2

---

## Execution

Run all tests:
```bash
npx playwright test
```

Run specific test file:
```bash
npx playwright test e2e/node-management.spec.ts
```

Run with UI:
```bash
npx playwright test --ui
```

View report:
```bash
npx playwright show-report
```
