# RED QUEEN: OPERATIONS

# Developer Handbook

Version 1.0

---

# Introduction

The Developer Handbook defines the engineering principles, architecture, coding standards, and development workflow for Red Queen: Operations.

This document is intended for AI coding agents and human developers working on the project.

Unlike the Master Game Bible, which defines gameplay, mechanics, and design philosophy, the Developer Handbook explains how those systems should be implemented.

Together, these two documents form the complete production foundation of the project.

---

# Relationship Between Documents

Every contributor must understand the responsibility of each document.

## Master Game Bible

Defines:

- gameplay;
- mechanics;
- progression;
- world building;
- user experience;
- visual direction.

The Master Game Bible answers the question:

**What should be built?**

---

## Developer Handbook

Defines:

- software architecture;
- project structure;
- engineering standards;
- coding conventions;
- implementation rules;
- database architecture;
- frontend architecture;
- backend architecture;
- AI integration;
- deployment workflow.

The Developer Handbook answers the question:

**How should it be built?**

---

# Source of Truth

The Master Game Bible is the canonical source for every gameplay and design decision.

The Developer Handbook is the canonical source for every engineering decision.

If implementation conflicts with design, the implementation should be corrected.

The game must adapt to the Bible.

The Bible must never adapt to implementation shortcuts.

---

# Development Philosophy

Every line of code should support long-term maintainability.

The project should remain understandable after years of development.

Engineering decisions should prioritize:

- simplicity;
- readability;
- modularity;
- scalability;
- consistency;
- performance.

Avoid unnecessary abstraction.

Avoid premature optimization.

Avoid overengineering.

The simplest correct solution is usually the best solution.

---

# Engineering Principles

The project follows several non-negotiable engineering principles.

## Modular Architecture

Every gameplay system must function independently.

Each module should have a single responsibility.

Modules communicate through well-defined interfaces.

Changes to one module should have minimal impact on others.

---

## Data Driven Design

Gameplay should be driven by data rather than hardcoded values.

Operations, equipment, Classes, Roles, rewards, balancing values, and future content should be configurable without modifying application code.

---

## Reusable Components

Every UI component should be reusable.

Business logic should never be duplicated.

Shared functionality should exist in one location only.

---

## AI Friendly Codebase

The project is intentionally structured for AI-assisted development.

Code should be:

- predictable;
- well documented;
- consistently named;
- easy to navigate.

Every module should be understandable without requiring knowledge of the entire codebase.

---

## Long-Term Scalability

Version 1 is only the beginning.

Every system should support future expansion without requiring architectural redesign.

New Operations.

New Classes.

New Roles.

New Equipment.

New Factions.

New Marketplace features.

New AI capabilities.

All should integrate naturally into the existing architecture.

# PART II — TECHNOLOGY STACK

---

# Overview

The technology stack is intentionally small, modern, scalable, and AI-friendly.

Every technology included in the project has a clear purpose.

Avoid introducing additional frameworks or libraries unless they solve a real engineering problem.

Technology choices should remain stable throughout Version 1 development.

---

# Frontend

The frontend is built using:

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

The frontend is responsible for:

- user interface;
- navigation;
- animations;
- gameplay interactions;
- state visualization.

Business logic should remain outside UI components whenever possible.

---

# Backend

The backend is powered by:

- Supabase
- PostgreSQL
- Edge Functions
- Row Level Security

The backend manages:

- authentication;
- player profiles;
- inventory;
- equipment;
- operations;
- combat history;
- marketplace;
- assets;
- progression.

---

# Database

Supabase PostgreSQL is the single source of truth for all persistent game data.

All gameplay progression must be stored in the database.

Application state should never be considered permanent until synchronized with Supabase.

---

# Authentication

Authentication is handled through Solana Wallet Adapter.

Wallet authentication represents the player's persistent identity.

No traditional username or password system should exist.

Every SOLvivor is identified by their wallet address.

---

# AI Integration

OpenAI powers Red Queen.

AI responsibilities include:

- player conversations;
- operational recommendations;
- mission briefings;
- daily briefings;
- dynamic narrative;
- future procedural content.

Gameplay systems should never depend entirely on AI availability.

Core mechanics must continue functioning even if AI services are temporarily unavailable.

---

# State Management

Global client state uses Zustand.

Server state uses TanStack Query.

Local component state should remain inside React components whenever possible.

Avoid unnecessary global state.

---

# Styling

Tailwind CSS is the primary styling framework.

shadcn/ui provides reusable interface components.

Custom CSS should only be used when Tailwind cannot achieve the required result.

---

# Animations

Framer Motion handles interface animations.

Animations should:

- remain lightweight;
- improve usability;
- never delay interaction;
- respect reduced motion preferences.

---

# Asset Storage

All assets are stored in Supabase Storage.

The application should never rely on local static assets for production content.

Images, illustrations, icons, and future media should be loaded dynamically.

---

# Environment Variables

Sensitive configuration must never be hardcoded.

Environment variables include:

- Supabase credentials
- OpenAI API Key
- Solana configuration
- Feature flags
- Marketplace configuration

Secrets must never be exposed to the client.

---

# Dependency Management

Every dependency must have a clear purpose.

Before adding a package, verify:

- it solves a real problem;
- it is actively maintained;
- it integrates well with the existing architecture;
- it does not duplicate existing functionality.

Avoid dependency bloat.

---

# Design Goals

The technology stack should remain modern, stable, predictable, and easy for both AI agents and human developers to understand.

Technology should accelerate development rather than increase complexity.

# PART III — PROJECT ARCHITECTURE

---

# Overview

The project follows a modular architecture.

Every system is developed as an independent module with clearly defined responsibilities.

Modules communicate through APIs, shared services, and the database rather than directly depending on each other.

This approach simplifies maintenance, testing, and future expansion.

---

# Core Architecture

The project consists of the following primary modules.

- Authentication
- Command Center
- SOLvivor
- Operations
- Combat Simulation
- Inventory
- Equipment
- Marketplace
- Red Queen AI
- Assets
- Administration

Each module should remain independent whenever possible.

---

# Frontend Structure

The frontend is responsible only for presentation and interaction.

Responsibilities include:

- rendering UI;
- collecting user input;
- displaying game state;
- animations;
- navigation.

Business logic should not be implemented inside UI components.

---

# Backend Structure

The backend manages:

- authentication;
- persistent data;
- progression;
- validation;
- combat calculations;
- rewards;
- AI communication;
- marketplace logic.

The backend is always considered the authoritative source.

---

# Service Layer

Every complex feature should be implemented as a dedicated service.

Examples include:

- Combat Service
- Operations Service
- Inventory Service
- Marketplace Service
- Profile Service
- AI Service
- Reward Service

Services should remain independent and reusable.

---

# Data Flow

Application flow should follow a consistent pattern.

User Action

↓

Frontend

↓

Service

↓

Supabase

↓

Response

↓

State Update

↓

UI Update

Business logic should never bypass this flow.

---

# Communication Rules

Modules communicate only through defined interfaces.

Direct dependencies between unrelated modules should be avoided.

Communication should remain predictable and easy to understand.

---

# Feature Isolation

Every feature should be removable without affecting unrelated systems.

Examples:

Removing Marketplace must not affect Operations.

Removing AI must not prevent gameplay.

Removing Arena must not break Inventory.

Loose coupling is mandatory.

---

# Error Handling

Every service should return predictable responses.

Errors should:

- be logged;
- provide meaningful messages;
- never crash the application;
- degrade gracefully.

Unexpected failures should always preserve player progression.

---

# Logging

Important events should be logged.

Examples include:

- authentication;
- Operations;
- Arena battles;
- equipment changes;
- purchases;
- AI requests;
- progression updates.

Logs should support debugging without exposing sensitive information.

---

# Scalability

Every module should support future expansion.

New gameplay systems should integrate through existing services rather than modifying core architecture.

Expansion should require addition rather than replacement.

---

# Design Goals

The architecture should remain modular, predictable, and easy to extend.

Every module should have a single responsibility.

The codebase should remain understandable for both AI agents and human developers regardless of future project size.

# PART IV — PROJECT STRUCTURE

---

# Overview

The project structure must remain clean, predictable, and scalable.

Every developer and AI coding agent should immediately understand where every file belongs.

Folders should represent responsibilities rather than technologies.

Avoid deeply nested directories whenever possible.

---

# Root Structure

```text
app/
components/
features/
services/
hooks/
stores/
lib/
types/
constants/
utils/
styles/
public/
supabase/
docs/
```

---

# App

The App directory contains:

- routing;
- layouts;
- pages;
- route groups;
- metadata.

No business logic should exist here.

---

# Components

Shared reusable UI components.

Examples:

- Button
- Card
- Modal
- Dialog
- Tabs
- Avatar
- Badge
- Tooltip
- Progress
- Loading

Components should remain presentation-only.

---

# Features

Every gameplay module has its own feature folder.

Example:

```text
features/

authentication/
command-center/
operations/
arena/
inventory/
equipment/
marketplace/
profile/
red-queen/
settings/
```

Each feature contains its own:

- components;
- hooks;
- services;
- types;
- utilities.

Features should remain independent.

---

# Services

Contains business logic.

Examples:

```text
CombatService

InventoryService

MarketplaceService

OperationService

RewardService

AIService

ProfileService
```

Services should never depend on UI.

---

# Stores

Contains Zustand stores.

Examples:

```text
authStore

profileStore

inventoryStore

arenaStore

uiStore

settingsStore
```

Only global state belongs here.

---

# Hooks

Reusable custom React hooks.

Examples:

```text
useProfile

useInventory

useArena

useOperations

useEquipment

useMarketplace
```

---

# Lib

Shared integrations.

Examples:

```text
supabase

openai

wallet

combat-engine

validators
```

---

# Types

Shared TypeScript types.

Examples:

```text
Player

Equipment

Inventory

Arena

Operation

Faction

Class

Role

Reward
```

---

# Constants

Application constants.

Examples:

- rarity values;
- battle modifiers;
- colors;
- animation durations;
- configuration values.

Avoid magic numbers throughout the codebase.

---

# Utils

Pure utility functions.

Examples:

- formatting;
- calculations;
- helpers;
- parsers;
- validators.

Utility functions should never contain business logic.

---

# Public

Static assets only.

Examples:

- favicon;
- manifest;
- fonts.

Game assets should not be stored here.

---

# Supabase

Contains:

- migrations;
- policies;
- edge functions;
- seeds;
- SQL scripts.

Database changes should always be version controlled.

---

# Documentation

The docs folder contains:

- Master Game Bible;
- Developer Handbook;
- Database Design;
- API Specification;
- UI Design System;
- Prompt Library.

Documentation evolves alongside the project.

---

# Naming Conventions

Use consistent naming.

Components:

```text
PlayerCard.tsx
```

Hooks:

```text
useInventory.ts
```

Services:

```text
InventoryService.ts
```

Stores:

```text
inventoryStore.ts
```

Types:

```text
Inventory.ts
```

Consistency is mandatory.

---

# Design Goals

The project structure should allow any developer or AI coding agent to locate, understand, and modify any system with minimal onboarding time.

Organization should reduce complexity rather than introduce it.

# PART V — CODING STANDARDS

---

# Overview

Consistency is more important than personal preference.

Every file in the project should follow the same engineering standards regardless of who wrote it.

Readable code is always preferred over clever code.

The codebase should remain understandable by both AI coding agents and human developers.

---

# General Principles

Follow these principles at all times.

- Write simple code.
- Prefer readability over brevity.
- Keep functions small.
- Keep components focused.
- Avoid unnecessary abstractions.
- Avoid duplicate logic.
- Favor composition over inheritance.

---

# File Size

Recommended limits:

- Component: under 300 lines
- Service: under 500 lines
- Hook: under 200 lines
- Utility: under 150 lines

If a file becomes difficult to understand, split it into smaller modules.

---

# Component Rules

React components should only:

- render UI;
- receive props;
- trigger actions;
- display state.

Business logic belongs in services.

Database logic belongs in services.

AI requests belong in services.

---

# Service Rules

Services contain business logic.

A service should:

- perform calculations;
- communicate with APIs;
- validate data;
- process gameplay;
- return predictable results.

Services should never render UI.

---

# Function Design

Functions should:

- perform one task;
- have descriptive names;
- avoid side effects whenever possible;
- return predictable values.

Large functions should be divided into smaller reusable functions.

---

# TypeScript

TypeScript is mandatory.

Avoid:

```ts
any
```

Prefer explicit interfaces and reusable types.

Every public function should have typed parameters and return values.

---

# Error Handling

Never ignore errors.

Every async operation should include proper error handling.

Errors should:

- be logged;
- return meaningful messages;
- preserve application stability.

---

# Naming Conventions

Use descriptive names.

Good:

```text
calculateBioScore()

loadInventory()

startOperation()

completeArenaBattle()
```

Avoid:

```text
calc()

test()

temp()

run()

doStuff()
```

---

# Comments

Code should be self-explanatory.

Use comments only when explaining:

- complex algorithms;
- architectural decisions;
- important business rules.

Do not comment obvious code.

---

# Constants

Never hardcode values.

Store configurable values inside:

- constants;
- configuration files;
- database;
- environment variables.

---

# Code Duplication

Duplicate logic should be extracted into:

- utilities;
- services;
- reusable components;
- hooks.

The same logic should never exist in multiple places.

---

# Imports

Organize imports consistently.

Recommended order:

1. React
2. External libraries
3. Internal libraries
4. Components
5. Services
6. Hooks
7. Types
8. Utilities
9. Styles

---

# Testing Readiness

Every module should be designed so it can be tested independently.

Avoid hidden dependencies.

Avoid tightly coupled code.

---

# AI Generated Code

All AI-generated code must be reviewed before merging.

AI should accelerate development.

It should never replace engineering judgment.

Generated code must follow the same coding standards as manually written code.

---

# Design Goals

The codebase should remain clean, modular, readable, and maintainable throughout the lifetime of the project.

Good engineering decisions reduce future complexity.

# PART VI — DATABASE DESIGN

---

# Overview

The database is the single source of truth for all persistent game data.

All progression, inventory, equipment, Operations, Arena history, and player profiles are stored in Supabase PostgreSQL.

Game logic should never rely on client-side persistence.

---

# Database Principles

The database should be:

- normalized;
- scalable;
- secure;
- easy to maintain;
- optimized for future expansion.

Avoid duplicate data whenever possible.

---

# Core Tables

Version 1 includes the following primary tables.

- profiles
- bio_scores
- factions
- classes
- roles
- player_roles
- equipment
- inventory
- operations
- operation_history
- arena_matches
- rewards
- achievements
- assets
- marketplace_items
- settings

---

# Profiles

Stores the player's core identity.

Fields include:

- wallet_address
- username
- avatar
- faction_id
- class_id
- active_role_id
- bio_score
- level
- created_at
- updated_at

One profile exists per wallet.

---

# BIO Scores

Stores progression data.

Examples:

- current_score
- highest_score
- lifetime_score
- last_updated

BIO SCORE should remain independent from player level.

---

# Factions

Contains all available factions.

Examples:

- id
- name
- description
- logo
- color

Faction data should remain mostly static.

---

# Classes

Contains every playable Class.

Examples:

- id
- name
- description
- icon
- active_ability

---

# Roles

Contains every operational Role.

Examples:

- id
- class_id
- name
- description
- passive_bonus

Roles belong to Classes.

---

# Player Roles

Stores unlocked Roles.

Examples:

- profile_id
- role_id
- unlocked
- active
- experience

Players may unlock multiple Roles.

Only one Role is active at a time.

---

# Equipment

Contains every equipment item.

Examples:

- id
- name
- rarity
- slot
- class_requirement
- power
- tradable
- asset_id

Equipment definitions should never be duplicated.

---

# Inventory

Stores player-owned equipment.

Examples:

- profile_id
- equipment_id
- quantity
- equipped
- acquired_at

Inventory contains ownership only.

Item definitions belong to the Equipment table.

---

# Operations

Stores all available Operations.

Examples:

- title
- difficulty
- rewards
- recommended_class
- recommended_roles
- status

Operations should be data-driven.

---

# Operation History

Stores completed Operations.

Examples:

- profile_id
- operation_id
- completion_time
- result
- rewards

Used for progression and statistics.

---

# Arena Matches

Stores combat history.

Examples:

- players
- winner
- turns
- damage
- rewards
- battle_log

Battle history should remain available for future analytics.

---

# Rewards

Stores all obtainable rewards.

Examples:

- resources
- equipment
- cosmetics
- achievements
- marketplace rewards

---

# Assets

Stores references to production assets.

Examples:

- image_url
- icon_url
- animation
- audio
- category

The application loads assets dynamically.

---

# Marketplace

Stores tradable assets.

Examples:

- seller
- buyer
- item
- price
- currency
- status

Marketplace history should never be deleted.

---

# Settings

Stores player preferences.

Examples:

- language
- theme
- notifications
- accessibility
- graphics

Settings should never affect gameplay progression.

---

# Relationships

Every table should use foreign keys whenever appropriate.

Relationships should remain explicit and predictable.

Referential integrity is mandatory.

---

# Security

Row Level Security must be enabled.

Players should only access their own data unless explicitly permitted.

Administrative functionality must remain isolated.

---

# Migrations

Every schema change must be implemented through version-controlled migrations.

Manual database modifications are prohibited.

---

# Design Goals

The database should remain flexible enough to support years of future development without requiring structural redesign.

New gameplay systems should integrate through new tables and relationships rather than replacing existing ones.

# PART VII — GAMEPLAY SYSTEMS

---

# Overview

Gameplay is divided into independent systems.

Each system is responsible for a single aspect of the player experience.

Systems communicate through shared services and the database rather than direct dependencies.

---

# Core Gameplay Systems

Version 1 includes:

- Authentication
- SOLvivor Profile
- Command Center
- Operations
- Combat Simulation
- Equipment
- Inventory
- Marketplace
- Red Queen AI
- Notifications

Each system should remain independently maintainable.

---

# Command Center

Responsibilities:

- player dashboard;
- Daily Briefings;
- navigation;
- global status;
- quick actions.

The Command Center is the primary hub of the game.

---

# SOLvivor System

Responsible for:

- player identity;
- BIO SCORE;
- Faction;
- Class;
- Active Role;
- progression.

Every player owns one persistent SOLvivor.

---

# Operations System

Responsible for:

- mission generation;
- mission progression;
- rewards;
- difficulty;
- completion tracking.

Operations should be entirely data-driven.

---

# Combat Simulation

Responsible for:

- PvE battles;
- PvP Arena;
- combat calculations;
- battle history;
- rankings;
- rewards.

Combat calculations should remain deterministic with controlled randomness.

---

# Equipment System

Responsible for:

- equipment definitions;
- rarity;
- upgrades;
- bonuses;
- equipment slots.

Equipment logic should remain separate from Inventory.

---

# Inventory System

Responsible for:

- ownership;
- equipping items;
- sorting;
- filtering;
- item management.

Inventory should never contain gameplay definitions.

---

# Marketplace System

Responsible for:

- listings;
- purchases;
- trading;
- transaction history;
- ownership transfers.

Marketplace should remain isolated from gameplay systems.

---

# Red Queen AI

Responsible for:

- conversations;
- Daily Briefings;
- mission briefings;
- operational recommendations;
- Role recommendations;
- dynamic narrative.

AI should enhance gameplay without becoming a requirement for core functionality.

---

# Notification System

Responsible for:

- achievements;
- rewards;
- mission updates;
- Arena results;
- marketplace activity;
- Red Queen messages.

Notifications should remain lightweight and non-intrusive.

---

# System Communication

Gameplay systems communicate through services.

Systems should never directly manipulate another system's internal state.

Communication should always occur through defined interfaces.

---

# Feature Flags

Experimental systems should be controlled through feature flags.

Examples:

- Marketplace
- AI Features
- Seasonal Events
- New Arena Modes

Disabled features should not require code removal.

---

# Versioning

Gameplay systems should support independent versioning.

Future upgrades should avoid breaking existing player progression.

Backward compatibility should be maintained whenever possible.

---

# Design Goals

Gameplay systems should remain modular, reusable, and independent.

Adding new features should require extending the architecture rather than modifying existing systems.

# PART VIII — API DESIGN

---

# Overview

The API provides the communication layer between the frontend, backend services, database, and AI.

The frontend should never communicate directly with the database except through approved Supabase functionality.

Business logic should always remain inside services or backend endpoints.

---

# API Principles

Every endpoint should be:

- predictable;
- secure;
- versioned;
- documented;
- reusable.

API design should prioritize consistency over convenience.

---

# Authentication

Every authenticated request requires a valid wallet session.

Authentication should be verified before executing any protected operation.

Unauthorized requests must return appropriate error responses.

---

# API Categories

Version 1 APIs include:

- Authentication
- Profile
- BIO SCORE
- Operations
- Arena
- Equipment
- Inventory
- Marketplace
- Assets
- Red Queen AI
- Notifications

Each category should remain logically separated.

---

# Profile API

Responsible for:

- retrieving profile data;
- updating player information;
- loading progression;
- loading statistics.

Profile endpoints should never expose sensitive information.

---

# Operations API

Responsible for:

- loading Operations;
- starting Operations;
- completing Operations;
- calculating rewards;
- updating progression.

Operation validation always occurs on the backend.

---

# Combat API

Responsible for:

- starting battles;
- validating actions;
- calculating combat;
- determining rewards;
- storing battle history.

The client should never determine battle outcomes.

---

# Inventory API

Responsible for:

- retrieving inventory;
- equipping items;
- unequipping items;
- sorting inventory;
- updating ownership.

Inventory validation occurs server-side.

---

# Equipment API

Responsible for:

- loading equipment;
- retrieving statistics;
- rarity information;
- equipment metadata.

Equipment definitions remain read-only.

---

# Marketplace API

Responsible for:

- listings;
- purchases;
- cancellations;
- ownership transfers;
- transaction history.

Marketplace transactions must always be validated.

---

# AI API

Responsible for:

- conversations;
- Daily Briefings;
- mission briefings;
- operational analysis;
- Role recommendations.

AI requests should remain asynchronous whenever possible.

---

# Asset API

Responsible for:

- loading images;
- icons;
- animations;
- audio;
- future downloadable content.

Assets should support caching.

---

# Notification API

Responsible for:

- unread notifications;
- notification history;
- system announcements;
- Red Queen messages.

Notifications should remain lightweight.

---

# Response Format

Every endpoint should return a consistent response structure.

Example:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error responses should follow the same structure.

---

# Validation

Every request should validate:

- authentication;
- permissions;
- request body;
- required fields;
- data types.

Invalid requests should never reach business logic.

---

# Versioning

All APIs should support versioning.

Example:

/api/v1/

Future updates should never break existing clients.

---

# Rate Limiting

Endpoints that interact with AI, Marketplace, or authentication should support rate limiting.

Abuse prevention should occur before expensive operations.

---

# Logging

Every important request should be logged.

Examples include:

- login;
- purchases;
- Arena battles;
- completed Operations;
- AI requests.

Sensitive information must never appear in logs.

---

# Design Goals

The API should remain predictable, secure, scalable, and easy to integrate.

Every endpoint should have a single responsibility and follow consistent design principles.

# PART IX — AI ARCHITECTURE

---

# Overview

Red Queen is a core system of the ecosystem rather than a standalone chatbot.

The AI is responsible for assisting, evaluating, guiding, and interacting with SOLvivors throughout the game.

AI enhances immersion while remaining independent from core gameplay mechanics.

Core gameplay must continue functioning even if AI services become temporarily unavailable.

---

# AI Responsibilities

Version 1 includes the following AI capabilities:

- Daily Briefings
- Player Conversations
- Operational Recommendations
- Role Recommendations
- Mission Briefings
- Mission Debriefings
- Contextual Notifications
- Dynamic Narrative

Future versions may expand these capabilities without changing the core architecture.

---

# AI Principles

Red Queen should:

- observe;
- evaluate;
- recommend;
- explain;
- educate;
- adapt.

Red Queen should never force player decisions.

Recommendations should always remain optional.

---

# AI Memory

Red Queen maintains contextual memory for every SOLvivor.

Examples include:

- player profile;
- BIO SCORE;
- Faction;
- Class;
- Active Role;
- completed Operations;
- Arena history;
- achievements;
- progression.

Memory should improve personalization without affecting gameplay fairness.

---

# Context System

Every AI request should include only the minimum required context.

Examples:

- current screen;
- active Operation;
- player progression;
- relevant equipment;
- recent events.

Avoid sending unnecessary data.

---

# Prompt Architecture

Prompts should be modular.

Every AI request consists of:

- System Prompt
- Context
- Player Input
- Response Rules

Business logic should never be embedded inside prompts.

---

# AI Services

Separate AI functionality into dedicated services.

Examples:

- Conversation Service
- Briefing Service
- Recommendation Service
- Narrative Service
- Evaluation Service

Each service should have a single responsibility.

---

# Operational Evaluation

Red Queen continuously evaluates every SOLvivor.

Evaluation considers:

- tactical decisions;
- mission performance;
- Arena performance;
- equipment usage;
- operational consistency;
- long-term progression.

Evaluation should improve recommendations over time.

---

# Role Recommendation

Role recommendations are generated from operational behavior rather than static player choices.

Recommendations should be updated as additional gameplay data becomes available.

Players may always accept or reject recommendations.

---

# Error Handling

If AI services become unavailable:

- gameplay continues;
- Operations remain playable;
- Arena remains functional;
- progression continues normally.

Fallback responses should be available for critical interactions.

---

# Performance

AI requests should:

- remain asynchronous;
- avoid blocking gameplay;
- minimize latency;
- reduce unnecessary token usage.

AI should enhance responsiveness rather than reduce it.

---

# Security

AI should never receive:

- API keys;
- private credentials;
- internal database structure;
- administrator data.

Only gameplay-relevant information should be shared.

---

# Cost Optimization

Reuse context whenever possible.

Avoid repeated prompts.

Cache reusable AI outputs.

Minimize unnecessary token consumption.

---

# Future Expansion

The AI architecture should support future systems including:

- dynamic Operations;
- adaptive tutorials;
- procedural events;
- faction interactions;
- world events;
- personalized progression.

These systems should integrate without redesigning existing AI services.

---

# Design Goals

Red Queen should feel like a persistent autonomous intelligence operating the ecosystem.

The AI should support the player through observation, analysis, and recommendations while preserving player freedom and maintaining high system reliability.

# PART X — USER INTERFACE STANDARDS

---

# Overview

The user interface should feel like an advanced operational system rather than a traditional game interface.

Every screen should reinforce the feeling that the player is interacting with Red Queen's global command network.

The interface should remain minimal, fast, and information-driven.

---

# Design Principles

Every interface should be:

- clean;
- responsive;
- modular;
- accessible;
- consistent;
- scalable.

Avoid unnecessary visual complexity.

Every element should have a clear purpose.

---

# Layout

The application uses a consistent layout system.

Primary layout consists of:

- Header
- Navigation
- Main Content
- Context Panel
- Notifications

Layouts should remain consistent across every screen.

---

# Navigation

Navigation should always remain predictable.

Primary navigation includes:

- Command Center
- Operations
- Arena
- Inventory
- Marketplace
- Profile
- Settings

Players should never feel lost.

---

# Components

All interface components should be reusable.

Examples:

- Buttons
- Cards
- Modals
- Drawers
- Tabs
- Tooltips
- Badges
- Progress Bars
- Dialogs
- Tables

Duplicate UI components are prohibited.

---

# Cards

Cards are the primary information container.

Examples:

- Operation Card
- Equipment Card
- Inventory Card
- Profile Card
- Marketplace Card

All cards should follow identical spacing and typography rules.

---

# Forms

Forms should remain simple.

Validation should occur:

- immediately;
- consistently;
- with clear error messages.

Required fields should always be obvious.

---

# Typography

Typography hierarchy should remain consistent.

Levels include:

- Page Title
- Section Title
- Card Title
- Body Text
- Caption

Avoid excessive font variations.

---

# Icons

Icons should communicate meaning instantly.

Use a single icon family throughout the project.

Icons should support the interface rather than decorate it.

---

# Colors

Colors communicate status.

Green

Success

Blue

Information

Yellow

Warning

Red

Critical

Gray

Neutral

Avoid using color purely for decoration.

---

# Animations

Animations should:

- provide feedback;
- improve navigation;
- communicate state changes;
- remain fast;
- never interrupt gameplay.

Animations should feel purposeful.

---

# Loading States

Every asynchronous action should include:

- loading indicator;
- skeleton loader;
- progress feedback;
- retry state if necessary.

Players should never wonder whether the application is frozen.

---

# Empty States

Every screen should define an empty state.

Examples:

- empty inventory;
- no marketplace listings;
- no completed Operations;
- no notifications.

Empty states should guide the player toward the next action.

---

# Error States

Errors should:

- explain what happened;
- suggest recovery;
- avoid technical jargon.

Players should always understand how to continue.

---

# Responsive Design

The interface should support:

- desktop;
- laptop;
- tablet;
- mobile.

Layouts should adapt without changing functionality.

---

# Accessibility

The interface should support:

- keyboard navigation;
- screen readers;
- reduced motion;
- scalable text;
- sufficient color contrast.

Accessibility should be considered from the beginning rather than added later.

---

# Red Queen Integration

Whenever Red Queen communicates with the player, the interface should clearly distinguish her messages from standard system notifications.

Her presence should feel authoritative, calm, and intentional.

---

# Design Goals

The interface should disappear behind the experience.

Players should focus on missions, decisions, and progression rather than learning the interface itself.

Every interaction should feel fast, intuitive, and professional.

# PART XI — DEVELOPMENT WORKFLOW

---

# Overview

Development should follow a structured and predictable workflow.

Every feature should progress through the same stages to ensure quality, maintainability, and consistency.

The goal is continuous improvement without disrupting existing systems.

---

# Development Cycle

Every feature follows the same lifecycle.

Research

↓

Design

↓

Implementation

↓

Testing

↓

Review

↓

Optimization

↓

Deployment

↓

Monitoring

No feature should skip any stage.

---

# Feature Development

Before implementation begins, every feature must define:

- purpose;
- user impact;
- dependencies;
- database requirements;
- API requirements;
- UI requirements;
- future scalability.

Features should never begin with code.

---

# Task Breakdown

Large features should always be divided into smaller tasks.

Every task should be:

- independent;
- testable;
- reviewable;
- deployable.

Small incremental progress is preferred over large unstable changes.

---

# Branch Strategy

Every feature should be developed in its own branch.

Examples:

feature/operations

feature/arena

feature/marketplace

bug/profile-loading

refactor/combat-engine

Direct development on the main branch is prohibited.

---

# Pull Requests

Every Pull Request should:

- solve one problem;
- remain focused;
- include clear descriptions;
- avoid unrelated changes.

Large Pull Requests should be divided into smaller reviews.

---

# Code Reviews

Every change should be reviewed before merging.

Reviews should evaluate:

- architecture;
- readability;
- performance;
- security;
- consistency;
- scalability.

---

# Testing

Every feature should be tested before release.

Testing includes:

- functionality;
- edge cases;
- regression testing;
- responsive layouts;
- performance.

Critical gameplay systems require additional validation.

---

# Refactoring

Refactoring is encouraged.

However, refactoring should never change gameplay behavior unless explicitly intended.

Behavioral changes require design approval.

---

# Documentation

Documentation should evolve together with the project.

Whenever a system changes, update:

- Developer Handbook;
- Database Design;
- API Documentation;
- UI Documentation.

Documentation should never become outdated.

---

# Version Control

Every significant milestone should be tagged.

Examples:

v0.1 Prototype

v0.5 Alpha

v0.9 Beta

v1.0 Release

Version history should remain easy to understand.

---

# Continuous Improvement

The project should continuously improve through:

- code cleanup;
- performance optimization;
- documentation updates;
- UI refinement;
- architecture improvements.

Technical debt should be addressed regularly.

---

# AI Assisted Development

AI is a development assistant.

AI should:

- generate code;
- explain code;
- review code;
- optimize code;
- create documentation.

Final engineering decisions remain the responsibility of the developer.

---

# Deployment Readiness

A feature is considered complete only when:

- implementation is finished;
- testing passes;
- documentation is updated;
- performance is acceptable;
- code review is complete.

Incomplete features should never reach production.

---

# Design Goals

Development should remain predictable, repeatable, and sustainable.

A disciplined workflow ensures long-term stability while allowing rapid iteration and continuous expansion of the Red Queen ecosystem.

# PART XII — DEPLOYMENT & RELEASE

---

# Overview

Deployment should be automated, predictable, and repeatable.

Every release must be stable, tested, and reversible.

The deployment process should minimize downtime and eliminate manual production changes whenever possible.

---

# Deployment Principles

Every deployment should be:

- automated;
- versioned;
- documented;
- monitored;
- reversible.

Manual production changes are prohibited.

---

# Environments

The project uses separate environments.

Development

Used for daily development.

---

Staging

Used for QA, testing, and feature validation.

---

Production

Used by real players.

Only stable code should reach Production.

---

# Release Pipeline

Every release follows the same process.

Development

↓

Internal Testing

↓

Staging

↓

QA Approval

↓

Production Deployment

↓

Monitoring

↓

Hotfixes (if required)

---

# Pre-Release Checklist

Before every deployment verify:

- all tests pass;
- no critical bugs remain;
- database migrations are ready;
- environment variables are correct;
- documentation is updated;
- assets are uploaded;
- feature flags are configured.

---

# Database Migrations

Database schema changes must be deployed through migrations.

Every migration should be:

- version controlled;
- reversible;
- tested on Staging first.

Never modify the production database manually.

---

# Feature Flags

New functionality should be released through feature flags whenever possible.

Examples include:

- Marketplace
- Arena Modes
- AI Features
- Seasonal Events
- Experimental UI

Feature flags allow safe incremental releases.

---

# Rollback Strategy

Every deployment must support rollback.

If a critical issue is detected:

- stop deployment;
- restore the previous version;
- investigate;
- deploy a fix separately.

Player data should never be lost.

---

# Monitoring

After deployment monitor:

- application errors;
- API performance;
- AI availability;
- database performance;
- authentication;
- Arena stability;
- Marketplace activity.

Critical failures require immediate investigation.

---

# Logging

Production logs should include:

- errors;
- warnings;
- deployments;
- authentication events;
- AI failures;
- payment events;
- marketplace transactions.

Sensitive information must never be logged.

---

# Backups

Automatic backups should be performed regularly.

Backups must include:

- database;
- storage metadata;
- configuration.

Backup restoration should be tested periodically.

---

# Hotfixes

Critical bugs may be deployed separately from scheduled releases.

Hotfixes should:

- solve one issue;
- minimize risk;
- avoid unrelated changes.

Documentation should be updated after every hotfix.

---

# Release Notes

Every release should include release notes.

Release notes describe:

- new features;
- improvements;
- bug fixes;
- known issues;
- migration requirements.

---

# Versioning

The project follows Semantic Versioning.

Example:

Major.Minor.Patch

Examples:

1.0.0

1.1.0

1.2.3

Breaking changes require a new major version.

---

# Long-Term Maintenance

After every release evaluate:

- performance;
- player feedback;
- error reports;
- analytics;
- technical debt.

Continuous improvement is part of the development process.

---

# Design Goals

Deployment should be reliable, repeatable, and safe.

Every release should improve the ecosystem without disrupting player progression or compromising platform stability.

# PART XIII — SECURITY

---

# Overview

Security is a core requirement of the project.

Player progression, digital assets, wallet authentication, and marketplace transactions must remain protected at every level of the architecture.

Security should be designed into the system rather than added after development.

---

# Security Principles

The platform should be:

- secure by default;
- least-privilege;
- server authoritative;
- privacy focused;
- resistant to abuse.

Never trust client-side data.

Every critical action must be validated on the server.

---

# Authentication

Authentication is performed exclusively through Solana Wallet Adapter.

The application should never store:

- private keys;
- seed phrases;
- wallet passwords.

Wallet ownership must always be verified before granting access.

---

# Authorization

Every API request must verify:

- authentication;
- ownership;
- permissions.

Players may only modify their own data.

Administrative functionality must remain isolated.

---

# Server Authority

The backend is always authoritative.

The client must never determine:

- rewards;
- combat results;
- marketplace transactions;
- BIO SCORE;
- progression;
- inventory ownership.

Client calculations exist only for presentation.

---

# Input Validation

Every request must validate:

- required fields;
- data types;
- value ranges;
- permissions;
- ownership.

Invalid requests must be rejected immediately.

---

# Database Security

Supabase Row Level Security is mandatory.

Every table should define explicit access policies.

Default behavior should deny access unless permission is explicitly granted.

---

# API Security

Every endpoint should:

- validate authentication;
- sanitize input;
- rate limit abuse;
- return safe error messages.

Internal implementation details should never be exposed.

---

# Marketplace Security

Marketplace transactions require:

- ownership verification;
- availability verification;
- transaction validation;
- atomic database updates.

Duplicate purchases must never occur.

---

# AI Security

Red Queen should never receive:

- secrets;
- API keys;
- database credentials;
- administrator information.

Only gameplay context should be shared with AI services.

---

# Secret Management

Secrets must only exist inside secure environment variables.

Never expose:

- API Keys;
- Database Credentials;
- Service Tokens;
- Private URLs.

Secrets must never be committed to source control.

---

# Logging

Logs should never contain:

- wallet signatures;
- API keys;
- personal information;
- authentication tokens.

Logs should remain useful while protecting player privacy.

---

# Dependency Security

Dependencies should be:

- actively maintained;
- regularly updated;
- security reviewed.

Unused packages should be removed.

---

# Monitoring

Security monitoring should detect:

- suspicious authentication;
- API abuse;
- repeated failures;
- unusual marketplace activity;
- unexpected server errors.

Critical incidents should trigger immediate investigation.

---

# Design Goals

Security should protect players without reducing usability.

Every system should assume hostile input while maintaining a smooth player experience.

# PART XIV — PERFORMANCE & OPTIMIZATION

---

# Overview

Performance is a core product requirement.

The application should remain fast, responsive, and efficient regardless of future content expansion.

Optimization should be considered throughout development rather than postponed until later.

---

# Performance Principles

The application should:

- load quickly;
- respond immediately;
- minimize unnecessary rendering;
- reduce network requests;
- optimize database queries;
- scale efficiently.

Performance should never be sacrificed for unnecessary visual effects.

---

# Frontend Performance

The frontend should:

- lazy load heavy components;
- lazy load routes;
- optimize images;
- minimize JavaScript bundles;
- reduce re-renders;
- use memoization only when beneficial.

Avoid unnecessary component updates.

---

# Backend Performance

Backend services should:

- optimize database queries;
- minimize API calls;
- cache frequently requested data;
- avoid duplicate processing.

Expensive operations should execute asynchronously whenever possible.

---

# Database Performance

Queries should:

- use indexes;
- avoid unnecessary joins;
- paginate large datasets;
- request only required fields.

Database performance should be monitored continuously.

---

# API Performance

Every API endpoint should:

- return only necessary data;
- avoid unnecessary processing;
- minimize payload size;
- support caching where appropriate.

Large responses should be paginated.

---

# AI Performance

AI requests should:

- reuse context;
- minimize prompt size;
- avoid duplicate requests;
- cache reusable outputs.

AI should never block gameplay.

---

# Asset Optimization

Assets should be:

- compressed;
- optimized;
- appropriately sized;
- cached.

Large assets should load only when required.

---

# Image Optimization

Images should:

- support modern formats;
- load progressively;
- use responsive sizes;
- avoid unnecessary resolution.

Players should never download assets larger than required.

---

# Animation Performance

Animations should:

- remain GPU accelerated;
- avoid layout thrashing;
- use hardware acceleration when appropriate;
- maintain high frame rates.

Smooth interaction always has priority.

---

# Caching

Use caching for:

- assets;
- API responses;
- player profile data;
- static configuration;
- AI responses where appropriate.

Cache invalidation should remain predictable.

---

# Network Optimization

Reduce:

- request count;
- payload size;
- duplicate downloads;
- unnecessary polling.

Prefer efficient synchronization over constant updates.

---

# Monitoring

Monitor continuously:

- loading times;
- API latency;
- AI latency;
- database performance;
- rendering performance;
- memory usage.

Performance regressions should be addressed immediately.

---

# Scalability

The application should support future growth without requiring architectural redesign.

Performance should remain stable as:

- players increase;
- Operations expand;
- assets grow;
- Marketplace activity increases;
- AI usage grows.

---

# Design Goals

Performance should remain invisible to the player.

The application should always feel immediate, responsive, and reliable regardless of future ecosystem expansion.

# PART XV — TESTING & QUALITY ASSURANCE

---

# Overview

Quality Assurance is an essential part of development.

Every feature must be verified before reaching production.

Testing is not a final phase.

Testing is integrated into the entire development process.

---

# Testing Principles

Every system should be:

- testable;
- reproducible;
- measurable;
- maintainable.

Testing should identify problems before players encounter them.

---

# Testing Types

Version 1 includes:

- Unit Testing
- Integration Testing
- End-to-End Testing
- UI Testing
- Performance Testing
- Security Testing
- Regression Testing

Each type serves a different purpose.

---

# Unit Testing

Unit tests verify individual functions and services.

Examples:

- combat calculations;
- reward generation;
- BIO SCORE updates;
- inventory management.

Unit tests should remain fast and independent.

---

# Integration Testing

Integration tests verify communication between systems.

Examples:

- frontend ↔ backend;
- backend ↔ database;
- backend ↔ AI;
- marketplace ↔ inventory.

---

# End-to-End Testing

E2E tests simulate complete player journeys.

Examples:

- wallet login;
- create SOLvivor;
- complete Operation;
- equip item;
- Arena battle;
- marketplace purchase.

These tests validate the complete application.

---

# UI Testing

Verify:

- layouts;
- navigation;
- responsiveness;
- animations;
- accessibility;
- loading states;
- error states.

The interface should remain consistent across devices.

---

# Performance Testing

Measure:

- page load time;
- API latency;
- database queries;
- rendering speed;
- memory usage;
- AI response time.

Performance should remain stable under expected load.

---

# Security Testing

Verify:

- authentication;
- authorization;
- Row Level Security;
- API validation;
- marketplace transactions;
- input validation.

Security testing should be part of every release.

---

# Regression Testing

Every update should verify that existing functionality continues working correctly.

New features must never break:

- Operations;
- Arena;
- Inventory;
- Marketplace;
- Progression;
- Authentication.

---

# Bug Reporting

Every bug should include:

- description;
- reproduction steps;
- expected behavior;
- actual behavior;
- screenshots or logs when available.

Bug reports should remain reproducible.

---

# Quality Gates

A feature is ready for release only if:

- implementation is complete;
- testing passes;
- documentation is updated;
- performance is acceptable;
- security review is complete.

---

# AI Testing

AI responses should be verified for:

- accuracy;
- consistency;
- personality;
- gameplay correctness;
- prompt compliance.

AI should never generate information that contradicts the Master Game Bible.

---

# Continuous Quality

Testing should occur continuously throughout development.

Quality should improve with every release rather than relying on large testing phases before launch.

---

# Design Goals

Quality Assurance should ensure that every release is stable, reliable, and consistent with the project's engineering standards.

Player trust depends on product quality.

# PART XVI — AI DEVELOPMENT RULES

---

# Overview

This section defines the mandatory rules that every AI coding agent must follow when contributing to Red Queen: Operations.

These rules take precedence over default AI behavior whenever project-specific decisions are required.

The objective is to maintain a consistent, scalable, and production-ready codebase.

---

# General Principles

Every AI coding agent must:

- follow the Master Game Bible;
- follow the Developer Handbook;
- preserve existing architecture;
- avoid unnecessary complexity;
- produce production-quality code.

AI should assist development rather than redesign the project.

---

# Before Writing Code

Before implementing a feature, AI should:

- understand the request;
- identify affected modules;
- check existing architecture;
- avoid duplicate functionality;
- reuse existing components whenever possible.

Never generate code blindly.

---

# Architecture Compliance

AI must never introduce new architectural patterns without explicit approval.

New code should integrate into the existing project structure.

Respect existing:

- services;
- stores;
- components;
- hooks;
- utilities;
- database schema.

---

# Code Quality

Generated code should be:

- readable;
- typed;
- documented where necessary;
- modular;
- reusable.

Avoid unnecessary abstractions.

Avoid overly clever solutions.

---

# UI Development

AI should:

- reuse existing UI components;
- follow the Design System;
- maintain visual consistency;
- support responsive layouts;
- preserve accessibility.

Never duplicate existing components.

---

# Database Rules

AI must never:

- duplicate database structures;
- bypass Row Level Security;
- modify production data directly.

Schema changes should always be implemented through migrations.

---

# API Rules

New endpoints should:

- follow existing conventions;
- validate input;
- return consistent responses;
- handle errors correctly.

Business logic belongs inside services.

---

# AI Features

AI-generated gameplay should remain:

- deterministic where required;
- explainable;
- consistent with Red Queen's personality;
- aligned with the Master Game Bible.

AI should never invent new gameplay mechanics without approval.

---

# Refactoring Rules

AI may improve:

- readability;
- maintainability;
- performance;
- documentation.

AI must never silently change gameplay behavior.

Behavioral changes require explicit approval.

---

# Documentation

Whenever AI introduces:

- a new module;
- a new service;
- a new API;
- a database change;

documentation should also be updated.

Code and documentation should evolve together.

---

# Forbidden Actions

AI must never:

- delete unrelated code;
- rename large parts of the project without approval;
- introduce unnecessary dependencies;
- replace established architecture;
- hardcode configuration values;
- expose secrets.

---

# Preferred Workflow

AI should work in small iterations.

Each task should:

- solve one problem;
- compile successfully;
- remain reviewable;
- preserve project stability.

Large rewrites should be avoided.

---

# Definition of Done

A task is complete only when:

- implementation is finished;
- code compiles;
- types are correct;
- linting passes;
- documentation is updated;
- no existing functionality is broken.

---

# Design Goals

AI should behave like a senior software engineer working within an established production codebase.

Every contribution should improve the project while preserving consistency, quality, and long-term maintainability.

# PART XVII — FUTURE EXPANSION

---

# Overview

Red Queen: Operations is designed as a long-term ecosystem.

Version 1 establishes the foundation.

Future updates should expand the existing architecture rather than replace it.

Every new system should integrate naturally into the current platform.

---

# Expansion Principles

Future development should prioritize:

- modularity;
- backward compatibility;
- player progression preservation;
- reusable systems;
- scalable architecture.

Existing functionality should remain stable as the ecosystem grows.

---

# Planned Gameplay Expansion

Future gameplay may include:

- new Operations;
- new Classes;
- new Roles;
- new Factions;
- cooperative missions;
- seasonal events;
- world events;
- faction campaigns;
- advanced Arena modes;
- survival scenarios.

All gameplay additions should reuse existing systems whenever possible.

---

# AI Expansion

Future AI capabilities may include:

- adaptive mission generation;
- dynamic world events;
- procedural Operations;
- personalized tutorials;
- strategic planning assistance;
- advanced operational analysis;
- persistent memory improvements.

AI should evolve without replacing player decision-making.

---

# Marketplace Expansion

Future Marketplace features may include:

- auctions;
- collections;
- seasonal cosmetics;
- limited-time assets;
- creator content;
- ecosystem rewards.

Marketplace growth should never compromise gameplay balance.

---

# Social Features

Future versions may include:

- player profiles;
- friends;
- squads;
- guilds;
- cooperative progression;
- shared achievements;
- community events.

Social systems should integrate with existing player progression.

---

# Competitive Features

Future competitive systems may include:

- ranked Arena;
- seasonal ladders;
- tournaments;
- faction rankings;
- global leaderboards.

Competitive systems should reward skill rather than spending.

---

# Content Expansion

Future content should remain data-driven.

Examples include:

- Operations;
- equipment;
- enemies;
- environments;
- rewards;
- achievements;
- cosmetics.

New content should require minimal engineering changes.

---

# Platform Expansion

The architecture should support:

- Web
- Mobile
- Desktop
- API integrations
- Future companion applications

Core systems should remain platform independent.

---

# Version Compatibility

Future updates should preserve:

- player progression;
- inventory;
- achievements;
- statistics;
- purchase history;
- marketplace ownership.

Existing players should never lose progress due to updates.

---

# Deprecation Policy

Obsolete systems should be deprecated gradually.

Avoid removing functionality immediately.

Provide migration paths whenever possible.

---

# Design Goals

Every future feature should feel like a natural evolution of the Red Queen ecosystem.

Growth should occur through expansion rather than replacement, ensuring long-term stability and a consistent player experience.

# PART XVIII — ENGINEERING PRINCIPLES

---

# Overview

These principles define how Red Queen: Operations should evolve throughout its lifetime.

Every engineering decision should strengthen the platform rather than introduce unnecessary complexity.

When multiple solutions exist, choose the one that best supports long-term maintainability.

---

# Single Source of Truth

Every piece of information should have one authoritative location.

Examples:

- gameplay → Master Game Bible
- engineering → Developer Handbook
- database → Database Schema
- APIs → API Specification
- UI → Design System

Duplicate definitions should never exist.

---

# Simplicity First

Prefer the simplest solution that correctly solves the problem.

Avoid:

- unnecessary abstractions;
- excessive inheritance;
- deeply nested logic;
- premature optimization.

Simple systems are easier to maintain, debug, and extend.

---

# Modularity

Every system should be independently replaceable.

Modules should communicate through well-defined interfaces rather than internal implementation details.

Changing one module should not require rewriting another.

---

# Data Driven Development

Game behavior should be driven by data whenever practical.

Avoid hardcoded:

- Operations;
- rewards;
- balancing values;
- progression;
- equipment;
- missions.

Configuration should live in the database whenever possible.

---

# Server Authority

The backend is the source of truth.

The client is responsible only for:

- presentation;
- interaction;
- user experience.

Critical gameplay calculations must always occur server-side.

---

# Progressive Enhancement

Version 1 establishes the foundation.

Future versions should extend existing systems instead of replacing them.

Evolution is preferred over redesign.

---

# Consistency

Every new feature should feel like it has always belonged to the project.

Consistency applies to:

- architecture;
- naming;
- UI;
- APIs;
- documentation;
- engineering standards.

---

# Performance Awareness

Performance should be considered during implementation rather than after release.

Every new feature should minimize:

- rendering;
- API requests;
- database queries;
- asset downloads;
- AI requests.

---

# Documentation First

Complex systems should be documented before implementation.

Documentation should explain:

- purpose;
- architecture;
- responsibilities;
- integration points.

Implementation should follow documentation rather than redefine it.

---

# AI Collaboration

AI is an engineering assistant.

Human developers remain responsible for:

- architecture;
- final review;
- quality assurance;
- deployment;
- strategic decisions.

AI should increase productivity while preserving engineering quality.

---

# Long-Term Vision

Every engineering decision should support the long-term evolution of the Red Queen ecosystem.

Short-term convenience should never compromise long-term maintainability.

---

# Final Principle

Every feature should answer three questions before implementation:

- Does it improve the player experience?
- Does it fit the existing architecture?
- Can it scale without redesign?

If the answer to any question is "No", the feature should be reconsidered before development begins.

---

# Design Goals

The engineering principles should ensure that Red Queen: Operations remains scalable, maintainable, consistent, and production-ready for years of future development.

# PART XIX — FINAL DEVELOPMENT DIRECTIVE

---

# Purpose

This handbook defines the engineering standards for Red Queen: Operations.

Every developer and AI coding agent contributing to the project is expected to follow these guidelines throughout the entire development lifecycle.

The objective is to build a stable, scalable, maintainable, and production-ready ecosystem.

---

# Source of Truth

Every production decision should follow the following priority.

1. Master Game Bible
2. Developer Handbook
3. Database Schema
4. API Specification
5. UI Design System
6. Asset Production Guide

When documentation conflicts, update the documentation rather than inventing new behavior.

---

# Engineering Mindset

Every implementation should prioritize:

- clarity;
- consistency;
- maintainability;
- scalability;
- performance;
- security.

Avoid unnecessary complexity.

Build systems that remain understandable years after they are written.

---

# AI Collaboration

AI coding agents are development assistants.

They should:

- accelerate implementation;
- generate production-ready code;
- improve documentation;
- review architecture;
- identify potential issues.

AI should never redefine established project architecture without explicit approval.

---

# Long-Term Vision

Red Queen: Operations is not designed as a single release.

It is an evolving ecosystem intended to grow over many years.

Every engineering decision should support this long-term vision.

Future systems should extend the platform rather than replace existing functionality.

---

# Definition of Success

The project is considered successful when:

- the architecture remains modular;
- gameplay systems remain independent;
- documentation remains accurate;
- AI integration feels seamless;
- new features require minimal architectural changes;
- the codebase remains understandable for both AI and human developers.

---

# Final Principle

Build for the next ten years, not the next release.

Every line of code should make the project easier to expand rather than harder to maintain.

Engineering excellence is measured not by complexity, but by clarity, reliability, and longevity.

