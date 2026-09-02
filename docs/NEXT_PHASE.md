# RED QUEEN — Next Phase

## First Contact Protocol

Create an interactive first-visit encounter in which RED QUEEN welcomes the user in a stylish modal and gradually builds their initial survival profile.

### Experience

1. RED QUEEN appears on the first meaningful platform visit with a short animated transmission.
2. She asks, one step at a time:
   - age range;
   - country and broad city;
   - which real threats interest or concern the user;
   - which fictional threats they enjoy exploring;
   - their favorite apocalypse film or game.
3. Answers immediately influence Queen's copy, suggested threat categories, simulations and starter preparedness topics.
4. The final screen offers two clear paths:
   - **Talk to RED QUEEN** — enter chat with the collected context attached;
   - **Create your SOLvivor profile** — sign in and explicitly save the preferences.
5. A third, quieter **Continue as guest** path must always remain available.

### Tone and visual direction

- Modern, playful and slightly sinister even in the light theme.
- One question per screen, responsive transitions, Queen reactions and subtle red scan effects.
- Treat the interaction as a conversation, not a registration form.
- Use the Queen's established lore and voice without presenting fictional scenarios as real warnings.

### Privacy and safety boundaries

- Ask for an age range by default rather than an exact birth date.
- City means broad location only; never request or infer a home address.
- Every question is optional and the sequence can be skipped.
- Guest answers remain local to the device. Persist them to Supabase only after sign-in and explicit profile-save approval.
- Preferences never trigger a purchase, payment, alert subscription, BIO-SCORE change or readiness claim.
- Real and fictional threats must remain visibly separated in storage and UI.

### Suggested profile fields

```text
age_range
country_code
broad_city
real_threat_interests[]
fictional_threat_interests[]
favorite_apocalypse_title
favorite_apocalypse_type: film | game | series | book | other
onboarding_completed_at
```

### Release sequence

1. Build the modal and local guest state.
2. Connect the result to the RED QUEEN chat context.
3. Add explicit profile persistence for signed-in users.
4. Personalize Pulse, Prepare and survival-cart suggestions.
5. Add replay/edit controls under the user profile.

### Definition of done

- A new visitor can finish or skip the flow in under two minutes.
- Chat recognizes the chosen location and interests without exposing exact personal data.
- Returning guests are not interrupted again unless they choose **Meet RED QUEEN again**.
- Signed-in users can inspect, edit and delete every saved onboarding field.
