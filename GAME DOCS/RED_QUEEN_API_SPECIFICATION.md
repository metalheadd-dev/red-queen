````md
# RED QUEEN: OPERATIONS

# API Specification

Version 1.0

---

# Overview

This document defines every API endpoint used by Red Queen: Operations.

The API serves as the communication layer between the frontend, backend services, Supabase, and Red Queen AI.

Every endpoint should be predictable, secure, versioned, and fully documented.

The backend is always the authoritative source for gameplay data.

---

# API Principles

Every endpoint must:

- validate authentication;
- validate permissions;
- validate request data;
- return consistent responses;
- never expose internal implementation details.

Business logic belongs to backend services.

The frontend is responsible only for presentation.

---

# Base URL

/api/v1/

Every future API version should use explicit versioning.

---

# Response Format

Successful responses:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Every endpoint should use this structure.

---

# API Modules

Version 1 includes:

- Authentication
- Profiles
- BIO Scores
- Factions
- Classes
- Roles
- Inventory
- Equipment
- Operations
- Arena
- Marketplace
- Rewards
- Assets
- Notifications
- Settings
- Red Queen AI
````
````md
# PART I — AUTHENTICATION API

---

# Overview

Authentication is performed exclusively through Solana Wallet Adapter.

Wallet ownership represents the player's permanent identity.

No username/password authentication exists.

---

# POST /auth/login

Authenticates a player using their Solana wallet.

---

Request

```json
{
  "wallet_address": "string",
  "signature": "string",
  "message": "string"
}
```

---

Response

```json
{
  "success": true,
  "data": {
    "profile": {},
    "session": {},
    "is_new_player": false
  },
  "error": null
}
```

---

Responsibilities

- Verify wallet signature.
- Create session.
- Load player profile.
- Create profile if first login.
- Return authentication token.

---

# POST /auth/logout

Terminates the current session.

---

Request

```json
{}
```

---

Response

```json
{
  "success": true
}
```

---

# GET /auth/session

Returns the current authenticated session.

---

Response

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "profile": {}
  }
}
```

---

# POST /auth/refresh

Refreshes the authentication session.

---

Response

```json
{
  "success": true,
  "data": {
    "session": {}
  }
}
```

---

# Security

Authentication requests must:

- verify wallet ownership;
- validate signatures;
- prevent replay attacks;
- use secure session tokens.

Private keys are never transmitted or stored.

---

# Rate Limiting

Authentication endpoints should limit repeated requests to prevent abuse.

---

# Design Goals

Authentication should remain fast, secure, and transparent.

The wallet serves as the player's permanent identity throughout the Red Queen ecosystem.
````
````md
# PART II — PROFILES API

---

# Overview

The Profiles API manages all player profile information.

Every authenticated SOLvivor owns exactly one profile.

Profile progression is managed through backend services.

---

# GET /profiles/me

Returns the authenticated player's profile.

---

Response

```json
{
  "success": true,
  "data": {
    "id": "",
    "username": "",
    "display_name": "",
    "bio_score": 0,
    "level": 1,
    "experience": 0,
    "faction": {},
    "class": {},
    "active_role": {}
  }
}
```

---

# PATCH /profiles/me

Updates editable profile information.

---

Request

```json
{
    "display_name": "",
    "avatar_url": ""
}
```

---

Editable Fields

- display_name
- avatar_url

Progression values cannot be modified through this endpoint.

---

Response

```json
{
    "success": true,
    "data": {}
}
```

---

# GET /profiles/{id}

Returns a public player profile.

Public information only.

---

Response

```json
{
    "success": true,
    "data": {
        "username": "",
        "avatar_url": "",
        "bio_score": 0,
        "level": 0,
        "faction": {},
        "class": {}
    }
}
```

---

# GET /profiles/me/statistics

Returns player statistics.

---

Response

```json
{
    "success": true,
    "data": {
        "operations_completed": 0,
        "arena_wins": 0,
        "arena_losses": 0,
        "highest_bio_score": 0,
        "hours_played": 0
    }
}
```

---

# Validation

The API must validate:

- authenticated user;
- profile ownership;
- editable fields;
- username uniqueness (future support).

---

# Permissions

Players may:

- view their own profile;
- edit permitted fields;
- view public profiles.

Players may not modify gameplay progression.

---

# Design Goals

The Profiles API should provide a simple, secure, and consistent interface for accessing player information while ensuring that progression remains entirely server-authoritative.
````

````md
# PART III — BIO SCORE API

---

# Overview

The BIO SCORE API provides access to the player's survival rating and progression statistics.

BIO SCORE is calculated by backend services and cannot be modified directly by the client.

---

# GET /bio-score

Returns the authenticated player's current BIO SCORE.

---

Response

```json
{
  "success": true,
  "data": {
    "current_score": 0,
    "highest_score": 0,
    "lifetime_score": 0,
    "operations_completed": 0,
    "arena_wins": 0,
    "arena_losses": 0,
    "last_updated": ""
  }
}
```

---

# GET /bio-score/history

Returns BIO SCORE progression history.

---

Response

```json
{
  "success": true,
  "data": [
    {
      "date": "",
      "score": 0,
      "reason": "Operation Completed"
    }
  ]
}
```

---

# POST /bio-score/recalculate

Internal endpoint.

Recalculates BIO SCORE after gameplay events.

This endpoint is never called directly by the client.

---

Trigger Events

- Operation completed
- Arena battle completed
- Achievement unlocked
- Special event
- Administrator adjustment

---

Response

```json
{
  "success": true,
  "data": {
    "previous_score": 0,
    "current_score": 0,
    "difference": 0
  }
}
```

---

# Validation

BIO SCORE calculations must always occur on the backend.

Client-side score manipulation is prohibited.

---

# Permissions

Players may:

- view their own BIO SCORE;
- view their own score history.

Only backend services may:

- update BIO SCORE;
- recalculate progression;
- apply score adjustments.

---

# Design Goals

BIO SCORE should remain a trusted, server-authoritative progression metric used throughout the Red Queen ecosystem for recommendations, matchmaking, rewards, and future gameplay systems.
````
````md
# PART IV — FACTIONS API

---

# Overview

The Factions API provides read-only access to all available Factions.

Faction selection occurs during onboarding and may become configurable in future versions.

Factions define player identity rather than gameplay power.

---

# GET /factions

Returns all available Factions.

---

Response

```json
{
  "success": true,
  "data": [
    {
      "id": "",
      "name": "",
      "slug": "",
      "description": "",
      "philosophy": "",
      "logo_url": "",
      "banner_url": "",
      "primary_color": "",
      "secondary_color": ""
    }
  ]
}
```

---

# GET /factions/{id}

Returns detailed information for a specific Faction.

---

Response

```json
{
  "success": true,
  "data": {
    "id": "",
    "name": "",
    "description": "",
    "philosophy": "",
    "headquarters": "",
    "members": 0
  }
}
```

---

# POST /profiles/me/faction

Updates the player's active Faction.

This endpoint is available only when faction changes are permitted by gameplay rules.

---

Request

```json
{
  "faction_id": ""
}
```

---

Response

```json
{
  "success": true,
  "data": {
    "faction": {}
  }
}
```

---

# Validation

The API must verify:

- authenticated player;
- valid faction;
- faction change rules.

---

# Permissions

Players may:

- view all Factions;
- view Faction details;
- change Faction only when gameplay permits.

Only administrators may:

- create Factions;
- modify Factions;
- archive Factions.

---

# Design Goals

The Factions API should remain lightweight and primarily serve identity, world-building, and future progression systems rather than gameplay balance.
````
````md
# PART V — CLASSES API

---

# Overview

The Classes API provides read-only access to all available Classes.

Classes define the player's profession, abilities, and gameplay style.

---

# GET /classes

Returns all available Classes.

---

Response

```json
{
  "success": true,
  "data": [
    {
      "id": "",
      "name": "",
      "description": "",
      "icon_url": "",
      "active_ability": "",
      "equipment_focus": ""
    }
  ]
}
```

---

# GET /classes/{id}

Returns detailed Class information.

---

# Permissions

Players may view all Classes.

Only administrators may create, modify, or archive Classes.

---

# Design Goals

The Classes API should expose gameplay information while remaining independent from player progression.

---

# PART VI — ROLES API

---

# Overview

The Roles API manages operational Roles available to SOLvivors.

Roles are recommended by Red Queen based on player behavior.

---

# GET /roles

Returns all Roles.

---

# GET /roles/{id}

Returns Role details.

---

# GET /profiles/me/roles

Returns unlocked Roles for the authenticated player.

---

# POST /profiles/me/roles

Changes the player's Active Role.

---

Request

```json
{
    "role_id": ""
}
```

---

Validation

- authenticated player;
- unlocked Role;
- valid Role ID.

---

Permissions

Players may:

- view all Roles;
- change their Active Role;
- view unlocked Roles.

Only backend services may unlock new Roles.

---

# Design Goals

Roles remain flexible and may change over time based on Red Queen recommendations.

---

# PART VII — EQUIPMENT API

---

# Overview

The Equipment API provides read-only access to equipment definitions.

Ownership is managed through the Inventory API.

---

# GET /equipment

Returns all available equipment.

---

# GET /equipment/{id}

Returns equipment details.

---

# GET /equipment/categories

Returns equipment categories.

---

# GET /equipment/rarities

Returns rarity definitions.

---

# Permissions

Equipment data is public.

Only administrators may modify equipment definitions.

---

# Design Goals

Equipment definitions should remain completely data-driven and reusable across all gameplay systems.
````

````md
# PART VIII — INVENTORY API

---

# Overview

The Inventory API manages player-owned equipment.

---

# GET /inventory

Returns the player's inventory.

---

# POST /inventory/equip

Equips an item.

---

Request

```json
{
    "inventory_id": ""
}
```

---

# POST /inventory/unequip

Unequips an item.

---

# POST /inventory/favorite

Marks an item as favorite.

---

# POST /inventory/lock

Locks or unlocks an item.

---

Validation

- authenticated player;
- ownership;
- equipment requirements.

---

Permissions

Players may manage only their own inventory.

Backend services grant and remove items.

---

# Design Goals

Inventory endpoints should remain lightweight and server-authoritative.
````
````md
# PART IX — OPERATIONS API

---

# Overview

The Operations API manages mission availability, progression, and completion.

Operations are the primary gameplay loop.

---

# GET /operations

Returns all available Operations.

---

# GET /operations/{id}

Returns detailed Operation information.

---

# POST /operations/start

Starts an Operation.

---

Request

```json
{
    "operation_id": ""
}
```

---

# POST /operations/complete

Completes an Operation.

---

Request

```json
{
    "operation_id": "",
    "result": {}
}
```

---

Validation

- authenticated player;
- Operation availability;
- level requirements;
- BIO SCORE requirements.

---

Permissions

Players may:

- view Operations;
- start Operations;
- complete Operations.

Only backend services calculate rewards.

---

# Design Goals

Operations should remain entirely data-driven and server-authoritative.

---

# PART X — ARENA API

---

# Overview

The Arena API manages Combat Simulations.

Battle calculations always occur on the backend.

---

# GET /arena/history

Returns Arena battle history.

---

# POST /arena/matchmaking

Requests an Arena match.

---

# POST /arena/start

Starts a battle.

---

# POST /arena/complete

Completes a battle.

---

Validation

- authenticated player;
- matchmaking rules;
- battle integrity.

---

Permissions

Players may:

- enter Arena;
- view battle history;
- view rankings.

Only backend services determine battle outcomes.

---

# Design Goals

Arena endpoints should remain deterministic, secure, and resistant to manipulation.

---

# PART XI — MARKETPLACE API

---

# Overview

The Marketplace API manages trading between players.

Ownership validation always occurs on the backend.

---

# GET /marketplace

Returns active listings.

---

# POST /marketplace/create

Creates a listing.

---

# POST /marketplace/purchase

Purchases an item.

---

# POST /marketplace/cancel

Cancels a listing.

---

# GET /marketplace/history

Returns Marketplace history.

---

Validation

- ownership;
- listing availability;
- currency balance;
- transaction integrity.

---

Permissions

Players may:

- create listings;
- cancel their own listings;
- purchase public listings.

---

# Design Goals

Marketplace endpoints should guarantee secure, atomic transactions while remaining scalable.
````
````md
# PART XV — SETTINGS API

---

# Overview

The Settings API manages player preferences.

Settings personalize the application without affecting gameplay.

---

# GET /settings

Returns the authenticated player's settings.

---

# PATCH /settings

Updates player settings.

---

Request

```json
{
    "language": "en",
    "theme": "dark",
    "notifications_enabled": true,
    "sound_enabled": true,
    "music_enabled": true
}
```

---

Validation

- authenticated player;
- valid setting values.

---

Permissions

Players may modify only their own settings.

---

# Design Goals

Settings should remain independent from gameplay systems.

---

# PART XVI — RED QUEEN AI API

---

# Overview

The Red Queen API powers every AI interaction inside the ecosystem.

Gameplay must continue functioning if AI services become temporarily unavailable.

---

# POST /ai/chat

Sends a message to Red Queen.

---

Request

```json
{
    "message": "",
    "context": {}
}
```

---

# POST /ai/daily-briefing

Returns the player's Daily Briefing.

---

# POST /ai/mission-briefing

Returns a mission briefing.

---

# POST /ai/debriefing

Returns an Operation evaluation.

---

# POST /ai/role-recommendation

Returns a Role recommendation based on player behavior.

---

Validation

- authenticated player;
- valid context;
- AI availability.

---

Permissions

Authenticated players only.

---

# Design Goals

The AI API should remain modular, asynchronous, and independent from gameplay systems.

---

# PART XVII — SYSTEM API

---

# Overview

System endpoints provide application-level functionality.

---

# GET /health

Returns application health.

---

# GET /version

Returns current application version.

---

# GET /status

Returns system status.

---

# GET /configuration

Returns public application configuration.

---

Permissions

Public endpoints unless otherwise specified.

---

# Design Goals

System endpoints should support monitoring, diagnostics, and future DevOps tooling.
````
```md
# PART XVIII — API SECURITY

---

# Authentication

Every protected endpoint requires authentication.

---

# Authorization

Every request validates:

- identity;
- ownership;
- permissions.

---

# Validation

Every request validates:

- required fields;
- data types;
- business rules.

---

# Rate Limiting

Rate limiting should protect:

- Authentication
- Marketplace
- AI
- Arena

---

# Logging

Every important request should be logged.

Examples:

- login;
- purchases;
- completed Operations;
- Arena battles;
- AI requests.

Sensitive information must never be logged.

---

# Error Handling

Every endpoint returns the standard API response format.

Internal implementation details should never be exposed.

---

# Design Goals

Security should be transparent to players while protecting the integrity of the ecosystem.

---

# PART XIX — API DESIGN PRINCIPLES

---

# Versioning

Every endpoint belongs to:

/api/v1/

Future releases should never break previous API versions.

---

# Consistency

All endpoints should:

- use REST conventions;
- follow identical response formats;
- return predictable status codes;
- use descriptive resource names.

---

# Server Authority

The backend always determines:

- progression;
- rewards;
- combat;
- inventory ownership;
- BIO SCORE;
- Marketplace transactions.

The client is responsible only for presentation.

---

# Final Principle

Every API endpoint should have one responsibility.

Endpoints should remain modular, secure, scalable, and easy to maintain throughout the lifetime of the Red Queen ecosystem.
```
