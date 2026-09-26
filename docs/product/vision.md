# NoAsterisk Product Vision and Problem

> **Source status:** Foundational product intent from the original concept. It is historical source context, not a claim that every described capability is implemented.

## Genesis and problem

The application is created as a response to the limitations of managing a budget in Apple Numbers:
- manual data entry — time-consuming and error-prone
- data is not up to date — card payments slip through, expenses "disappear"
- no automation of bank imports
- no insight into sub-budgets and trends in real time

Ultimately, the application is meant to be a SaaS product sold to other users, not just a private tool — which influences architectural decisions from the very beginning.

---

## What is this application

A web application for managing personal and family budgets with:
- bank data import via CSV (anonymized on the client side)
- automatic transaction categorization through configurable rules
- sub-budget, balance, and trend views
- a permissions system allowing budget sharing between users

---

## Current focused product references

- [Capability map](./README.md)
- [Privacy and security](./capabilities/privacy-and-security.md)


## Source provenance

- Original source: legacy product plan
- Pre-atomization path: `docs/product/product-concept.md`
- Original source lines: 5–27
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
