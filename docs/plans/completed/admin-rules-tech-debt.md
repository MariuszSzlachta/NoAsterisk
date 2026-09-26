# Admin Rules Technical-Debt Closure

Status: **COMPLETED**

This plan closed three follow-up findings from the admin-rules implementation:

1. category fixtures and types were centralized under `entities/category`;
2. the shared Select component gained `id` and `aria-labelledby` support;
3. admin-rules consumers stopped maintaining redundant category-option state.

The current tree contains the shared category entity and the accessible Select
contract. The repository quality gates verify the resulting boundaries and
types. This record replaces the former root-level mixed-language plan.
