# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Spec-Driven Development** framework repository that implements a structured approach to feature development through specifications, planning, and task execution. The system uses a constitution-based development model with automated scripts and templates.

## Development Workflow

### Core Commands (via .claude/commands/)

1. **/specify** - Start new feature development
   - Usage: `/specify "feature description"`
   - Creates a new feature branch and specification file
   - Uses `scripts/create-new-feature.sh` to set up branch and directory structure

2. **/plan** - Create implementation plan from specification
   - Usage: `/plan "implementation details"`
   - Generates technical architecture and design documents
   - Creates research.md, data-model.md, contracts/, and quickstart.md

3. **/tasks** - Break down plan into executable tasks
   - Usage: `/tasks "context"`
   - Generates tasks.md with numbered, ordered implementation tasks
   - Supports parallel execution markers [P]

### Development Scripts

All scripts in `scripts/` directory should be run from repository root:

- `scripts/create-new-feature.sh` - Creates feature branch and directory structure
- `scripts/setup-plan.sh` - Sets up planning phase directories and files  
- `scripts/check-task-prerequisites.sh` - Validates task prerequisites
- `scripts/update-agent-context.sh` - Updates AI assistant context files

## Architecture Principles

### Constitutional Requirements (from memory/constitution.md)

The project follows constitutional principles that must be verified at key gates:

1. **Library-First Architecture** - Every feature starts as a standalone library
2. **CLI Interface** - Libraries expose functionality via command-line interfaces  
3. **Test-First Development (NON-NEGOTIABLE)** - TDD with Red-Green-Refactor cycle
4. **Integration Testing** - Focus on contract tests and real dependencies
5. **Observability** - Structured logging and error context
6. **Versioning** - MAJOR.MINOR.BUILD format with strict breaking change handling

### Project Structure

Features are organized under `specs/[###-feature-name]/` with:
- `spec.md` - Business requirements and user scenarios
- `plan.md` - Technical implementation plan  
- `research.md` - Technical research and decisions
- `data-model.md` - Entity definitions and relationships
- `contracts/` - API contracts and schemas
- `quickstart.md` - Integration test scenarios
- `tasks.md` - Executable implementation tasks

## Templates

Key templates in `templates/` directory:
- `spec-template.md` - Feature specification structure
- `plan-template.md` - Implementation planning template  
- `tasks-template.md` - Task breakdown template

## Development Gates

1. **Constitution Check** - Verify compliance with architectural principles
2. **Specification Review** - Ensure requirements are testable and unambiguous
3. **Design Validation** - Confirm technical approach aligns with constitution
4. **Task Dependencies** - Verify proper ordering and parallel execution markers

## Key Files to Reference

- `/memory/constitution.md` - Core development principles (template format)
- `.claude/commands/` - Command definitions and workflows
- `scripts/common.sh` - Shared script utilities
- `templates/` - Development templates and patterns

## Current Feature Development

### Active Feature: Product Listing Page (Branch: 001-help-me-create)
**Tech Stack**: React 18+, Node.js + Express, SQLite, CSS Modules  
**Architecture**: Web application (frontend + backend)  
**Database**: Local SQLite with better-sqlite3  
**Testing**: Jest + React Testing Library  
**Scope**: 100-200 products, 25 per page, price filtering, name search, sorting

### Recent Changes
- Added Product Listing feature specification and implementation plan
- Created data model with Product, Filter, SortCriteria, PaginationState entities  
- Generated OpenAPI contracts for /api/products endpoint
- Defined integration test scenarios for core user workflows

## Commands
```bash
npm run dev          # Start development servers
npm test             # Run test suite  
npm run build        # Production build
npm run typecheck    # TypeScript validation
```

Last updated: 2025-09-09