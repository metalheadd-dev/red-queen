```md
# RED QUEEN: OPERATIONS

# UI Design System

Version 1.0

---

# Overview

The UI Design System defines the visual language, reusable components, layout rules, interaction patterns, and user experience standards for Red Queen: Operations.

Every screen in the application should follow this document.

Consistency has higher priority than visual experimentation.

---

# Design Philosophy

The interface represents Red Queen's operational network.

It should feel:

- professional;
- tactical;
- minimal;
- responsive;
- data-driven;
- immersive.

Every visual element should communicate purpose.

Decoration should never replace usability.

---

# Core Principles

Every interface should be:

- modular;
- reusable;
- accessible;
- responsive;
- scalable;
- consistent.

The user should immediately understand where they are, what they can do, and what happens next.

---

# Navigation Structure

Version 1 includes:

- Command Center
- Operations
- Arena
- Inventory
- Marketplace
- Profile
- Settings

Future screens should integrate into this navigation rather than replacing it.

---

# Design Tokens

Spacing

- XS
- S
- M
- L
- XL

Border Radius

- Small
- Medium
- Large

Shadow

- Soft
- Medium
- Strong

Animation Duration

- Fast
- Normal
- Slow

All values should be centralized in a design token system.

---

# Color System

Primary

Used for actions.

Secondary

Used for supporting elements.

Success

Used for positive feedback.

Warning

Used for caution.

Danger

Used for critical actions.

Neutral

Used for backgrounds and inactive elements.

Color should communicate state rather than decoration.
```
```md
# PART I — LAYOUT SYSTEM

---

# Overview

Every screen follows the same layout hierarchy.

Header

↓

Navigation

↓

Main Content

↓

Context Panel

↓

Footer (optional)

---

# Header

Contains:

- Logo
- Current Screen
- Wallet
- Notifications
- Settings

---

# Sidebar Navigation

Primary navigation remains persistent on desktop.

Collapsed navigation is used on mobile.

---

# Main Content

Displays the primary gameplay system.

Only one primary task should dominate each screen.

---

# Context Panel

Displays contextual information such as:

- Red Queen
- Mission Details
- Player Stats
- Recommendations

---

# Responsive Layout

Desktop

Three-column layout.

Tablet

Two-column layout.

Mobile

Single-column layout.

Functionality should remain identical across devices.

---

# Design Goals

Navigation should become instinctive after only a few minutes of use.
```
```md
# PART II — TYPOGRAPHY

---

# Overview

Typography should prioritize clarity, hierarchy, and readability.

Players should absorb information quickly during gameplay.

---

# Typography Levels

Display

Used for major screens.

---

Heading 1

Page titles.

---

Heading 2

Section titles.

---

Heading 3

Card titles.

---

Body

Primary content.

---

Caption

Secondary information.

---

Label

Buttons, forms, badges.

---

# Rules

Maintain consistent spacing.

Avoid excessive font weights.

Use uppercase only for small labels and status indicators.

---

# Design Goals

Typography should guide attention naturally without overwhelming the player.

---

# PART III — BUTTON SYSTEM

---

# Primary Button

Used for:

- Start Operation
- Enter Arena
- Continue
- Confirm

Highest visual priority.

---

# Secondary Button

Used for secondary actions.

Examples:

- Cancel
- Back
- Details

---

# Ghost Button

Used inside cards and tables.

Minimal visual weight.

---

# Icon Button

Used for:

- Search
- Settings
- Notifications
- Close

Icons should always have tooltips.

---

# Disabled State

Disabled buttons should clearly communicate unavailable actions.

---

# Loading State

Buttons performing asynchronous actions should display loading indicators.

Multiple submissions must be prevented.

---

# Design Goals

Buttons should communicate importance through hierarchy rather than color alone.

---

# PART IV — CARD SYSTEM

---

# Overview

Cards are the primary UI building block.

Every gameplay system should present information through reusable card components.

---

# Core Cards

Operation Card

Equipment Card

Inventory Card

Arena Card

Marketplace Card

Profile Card

Faction Card

Class Card

Role Card

Notification Card

---

# Card Structure

Header

↓

Content

↓

Metadata

↓

Actions

---

# Rules

Cards should:

- have consistent spacing;
- maintain equal padding;
- support loading states;
- support empty states;
- support hover states.

---

# Design Goals

Cards should remain reusable across the entire application with minimal customization.
```
```md
# PART V — FORM SYSTEM

---

# Overview

Forms should be simple, predictable, and accessible.

Every form should validate input before submission.

---

# Input Types

- Text
- Number
- Email
- Password (future support)
- Search
- Select
- Multi Select
- Checkbox
- Toggle
- Slider
- Textarea

---

# Validation

Validation should occur:

- while typing;
- on submit;
- after server response.

Error messages should explain how to resolve the issue.

---

# Required Fields

Required fields should be clearly indicated.

Optional fields should remain minimal.

---

# Design Goals

Forms should minimize user effort while maximizing clarity.

---

# PART VI — MODAL SYSTEM

---

# Modal Types

Confirmation

Information

Warning

Error

Success

---

# Rules

Only one modal should be open at a time.

Modals should trap keyboard focus.

Escape should close non-critical dialogs.

---

# Confirmation Dialogs

Required for:

- Marketplace purchases
- Selling equipment
- Permanent actions
- Future premium actions

---

# Design Goals

Dialogs should interrupt the player only when confirmation is genuinely required.
```
```md
# PART VII — TABLE SYSTEM

---

# Overview

Tables display structured information efficiently.

They should support sorting, filtering, pagination, and searching.

---

# Table Components

Header

Rows

Cells

Actions

Pagination

---

# Supported Features

- Sorting
- Filtering
- Search
- Pagination
- Multi-selection
- Bulk actions

---

# Empty State

Every table should define an empty state.

---

# Loading State

Skeleton rows should be displayed while loading.

---

# Design Goals

Tables should remain fast, readable, and scalable.

---

# PART VIII — STATUS SYSTEM

---

# Status Types

Success

Information

Warning

Error

Offline

Loading

Disabled

---

# Usage

Status indicators should appear consistently across:

- Operations
- Arena
- Marketplace
- Inventory
- Notifications

---

# Badges

Badges communicate:

- rarity;
- status;
- difficulty;
- role;
- class;
- faction.

Badges should remain compact.

---

# Progress Indicators

Progress Bars

Circular Progress

Loading Spinner

Countdown Timer

---

# Design Goals

Status indicators should communicate state instantly without requiring additional explanation.

---

# PART IX — FEEDBACK SYSTEM

---

# Loading

Every asynchronous action should provide immediate feedback.

---

# Success

Successful actions should provide subtle confirmation.

---

# Warning

Warnings should explain consequences before the player continues.

---

# Error

Errors should:

- explain the problem;
- suggest recovery;
- avoid technical language.

---

# Toast Notifications

Used for:

- rewards;
- equipment;
- marketplace;
- settings;
- profile updates.

Toasts should disappear automatically.

---

# Design Goals

Players should always understand what the application is doing.
```
```md
# PART X — ANIMATION SYSTEM

---

# Overview

Animations should support usability rather than entertainment.

Every animation should communicate state changes.

---

# Animation Types

Page Transition

Card Hover

Button Press

Modal Open

Notification

Progress Update

Loading

Reward Reveal

---

# Rules

Animations should:

- remain under 300ms;
- never block interaction;
- support reduced motion;
- remain GPU accelerated.

---

# Red Queen Presence

Whenever Red Queen appears:

- interface subtly darkens;
- communication panel expands;
- animations remain calm and deliberate.

Red Queen should feel authoritative rather than dramatic.

---

# Design Goals

Animations should increase immersion without reducing responsiveness.

---

# PART XI — RESPONSIVE DESIGN

---

# Breakpoints

Mobile

Tablet

Laptop

Desktop

Ultra-wide

---

# Mobile

Bottom navigation.

Single-column layout.

Touch-first interactions.

---

# Tablet

Two-column layout.

Collapsible sidebar.

---

# Desktop

Persistent navigation.

Context panel always visible.

---

# Design Goals

The application should provide the same functionality on every supported device while adapting naturally to available screen space.
```
```md
# PART XII — ICONOGRAPHY

---

# Overview

Icons should communicate functionality instantly.

A single icon library should be used throughout the application.

Icons should support the interface rather than decorate it.

---

# Icon Categories

Navigation

Actions

Status

Equipment

Classes

Roles

Factions

Marketplace

Notifications

Settings

---

# Rules

Icons should:

- remain consistent;
- maintain equal visual weight;
- scale correctly;
- support accessibility.

Icons should never replace descriptive labels when clarity is required.

---

# Design Goals

Players should immediately recognize interface actions through consistent iconography.

---

# PART XIII — ACCESSIBILITY

---

# Overview

Accessibility should be considered from the beginning of development.

Every player should be able to navigate and interact with the application.

---

# Requirements

Support:

- keyboard navigation;
- screen readers;
- reduced motion;
- scalable text;
- high contrast;
- color-independent status indicators.

---

# Interaction

Every interactive element should:

- have a visible focus state;
- include descriptive labels;
- provide keyboard shortcuts where appropriate.

---

# Design Goals

Accessibility should improve usability for every player, not only those requiring assistive technologies.

---

# PART XIV — DESIGN TOKENS

---

# Overview

All visual values should be centralized.

Design tokens eliminate inconsistencies across the application.

---

# Token Categories

Colors

Typography

Spacing

Border Radius

Shadows

Animations

Breakpoints

Z-Index

Opacity

---

# Usage

Components should never hardcode visual values.

Every reusable component should reference the design token system.

---

# Design Goals

Updating the visual language should require changing design tokens rather than individual components.
```
```md
# PART XV — RED QUEEN INTERFACE

---

# Overview

Red Queen is not a UI component.

She is a persistent system integrated throughout the application.

Her presence should remain consistent regardless of the current screen.

---

# Communication

Red Queen appears through:

- Daily Briefings;
- Mission Briefings;
- Mission Debriefings;
- Role Recommendations;
- Operational Warnings;
- System Announcements.

---

# Visual Identity

Every Red Queen interaction should include:

- avatar;
- system identifier;
- timestamp;
- message priority.

---

# Behavior

Red Queen should:

- remain calm;
- remain objective;
- avoid unnecessary emotion;
- explain recommendations;
- never overwhelm the player.

---

# Design Goals

Players should perceive Red Queen as an intelligent operational commander rather than a chatbot.

---

```md
# PART XVII — GAMEPLAY NAVIGATION

---

# Overview

Red Queen: Operations should feel like an immersive game rather than a traditional multi-page web application.

The player should remain inside a single gameplay environment whenever possible.

Navigation should feel seamless and uninterrupted.

---

# Primary Route

The entire gameplay module is accessed through:

/operations

This is the primary gameplay entry point.

---

# Navigation Philosophy

Avoid traditional page navigation.

Prefer in-game transitions.

Players should rarely leave the Operations interface.

---

# Interface Flow

The Operations screen acts as the Command Center.

From there, players interact with gameplay systems through overlays, drawers, panels, and fullscreen views.

Examples include:

- Profile
- Inventory
- Equipment
- Mission Briefings
- Rewards
- Notifications
- Red Queen Communication

These systems should open without navigating away from the current gameplay session.

---

# Standalone Gameplay Modes

Only major gameplay modes may use dedicated routes.

Examples:

/operations

/operations/arena

Future examples:

/operations/events

/operations/tutorial

Avoid creating separate pages for small gameplay features.

---

# Overlay System

The preferred interaction pattern is:

Player remains inside Operations

↓

Overlay opens

↓

Player completes interaction

↓

Overlay closes

↓

Gameplay immediately resumes

This approach minimizes loading, improves immersion, and creates a more game-like experience.

---

# User Experience Goals

The player should always feel located inside a single operational headquarters.

Inventory should not feel like another website.

Profile should not feel like another page.

Mission Briefings should not interrupt gameplay.

Everything should appear as part of one continuous command interface.

---

# Design Goals

The Operations module should feel like a tactical game running inside Red Queen rather than a collection of independent web pages.

Immersion always has priority over traditional website navigation.
```


# PART XVI — DESIGN PRINCIPLES

---

# Consistency

Every screen should feel like part of the same application.

---

# Simplicity

Reduce unnecessary interface complexity.

---

# Clarity

Information should always have a clear hierarchy.

---

# Reusability

Every UI component should be reusable.

---

# Scalability

The design system should support years of future expansion.

---

# Final Principle

The interface should disappear behind the experience.

Players should focus on decisions, Operations, Arena battles, and progression rather than learning the interface.

A successful interface is one that feels invisible.
```
