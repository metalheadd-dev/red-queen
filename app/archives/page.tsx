"use client";
import { useState } from "react";

type Threat = {
  id: string;
  name: string;
  level: number;
  origin: string;
  classification: string;
  status: string;
  symptoms: string[];
  survival: string[];
  classified: string;
  redactedLabel: string;
};

const REALISTIC: Threat[] = [
  { id: "T-VIRUS", name: "T-Virus — Zombie Outbreak", level: 97, origin: "Classified Lab", classification: "BIOHAZARD OMEGA", status: "CRITICAL", symptoms: ["Reanimation of necrotic tissue", "Extreme aggression", "Pathogen spread via saliva/blood"], survival: ["Avoid all human contact", "Secure elevated positions", "Boil or purify all water sources"], classified: "In the event of full urban collapse, prioritize drains and utility tunnels. Infected are drawn to sound. A group larger than 4 is a death sentence.", redactedLabel: "CLASSIFIED: ANTIVIRAL PROTOCOL G-617" },
  { id: "HANTAVIRUS", name: "Hantavirus Outbreak", level: 76, origin: "Rodent Vector", classification: "PANDEMIC", status: "HIGH", symptoms: ["Hemorrhagic fever", "Renal failure", "Respiratory distress"], survival: ["Avoid rodent droppings", "Ventilate abandoned buildings", "Wear N95+ respirators"], classified: "Airborne transmission confirmed in urban clusters. Avoid subways and basements.", redactedLabel: "CLASSIFIED: SAFE ZONE CITIES" },
  { id: "PANDEMIC", name: "Global Pandemic", level: 89, origin: "Unknown Pathogen", classification: "PANDEMIC", status: "SEVERE", symptoms: ["Rapid person-to-person spread", "Overwhelmed medical infrastructure", "Immune evasion mutations"], survival: ["Isolate immediately at first signs", "Stockpile 90-day food supply", "Establish quarantine protocols"], classified: "Black market antiviral stockpiles exist in 12 cities. Governments will not acknowledge them.", redactedLabel: "CLASSIFIED: ANTIVIRAL CACHE LOCATIONS" },
  { id: "BIRD-FLU", name: "Bird Flu H5N1 Mutation", level: 82, origin: "Avian Vector", classification: "PANDEMIC", status: "SEVERE", symptoms: ["60%+ mortality in mutated strains", "Respiratory failure within 72hrs", "Rapid cross-species transmission"], survival: ["Cull contact with all birds", "Full PPE when outdoors", "Self-isolate in rural locations"], classified: "H5N1 has already achieved human-to-human transmission in 3 classified lab settings.", redactedLabel: "CLASSIFIED: MUTATION TIMELINE" },
  { id: "BIOWEAPON", name: "Bioweapon Release", level: 91, origin: "State-Sponsored", classification: "BIOHAZARD OMEGA", status: "CRITICAL", symptoms: ["Engineered pathogen spread", "Unknown incubation periods", "No natural immunity"], survival: ["Seal all ventilation immediately", "Do not trust tap water", "Stay indoors with HEPA filtration"], classified: "Three nation-states currently possess deployable bioweapons undetected by global monitoring.", redactedLabel: "CLASSIFIED: WEAPONIZED STRAIN DATABASE" },
  { id: "NUCLEAR-WAR", name: "Nuclear War", level: 95, origin: "Geopolitical Escalation", classification: "EXTINCTION-LEVEL", status: "CRITICAL", symptoms: ["Detonation in major cities", "EMP collapse of infrastructure", "Mass radiation poisoning"], survival: ["Go underground immediately", "Stay for minimum 2 weeks post-blast", "Avoid all fallout zones"], classified: "Primary targets include 147 cities. Classified maps available to Level 5 operators only.", redactedLabel: "CLASSIFIED: FALLOUT ZONE MAPS" },
  { id: "NUCLEAR-WINTER", name: "Nuclear Winter", level: 88, origin: "Post-Nuclear Detonations", classification: "CLIMATE COLLAPSE", status: "SEVERE", symptoms: ["Global temperature drop of 10–20°C", "Agricultural system failure", "Multi-year darkness from ash clouds"], survival: ["Stockpile seeds and grow lights", "Underground farming is survival", "Calorie-dense non-perishables only"], classified: "A nuclear winter lasting 5+ years is modeled in 80% of exchange scenarios. Food is the only currency.", redactedLabel: "CLASSIFIED: UNDERGROUND FARM SPECS" },
  { id: "EMP-STRIKE", name: "EMP Attack", level: 88, origin: "High-Altitude Detonation", classification: "INFRASTRUCTURE", status: "SEVERE", symptoms: ["Total grid failure", "Vehicles disabled", "Communication blackout"], survival: ["Build Faraday cages", "Stockpile non-perishable food", "Establish local barter systems"], classified: "Government response will be zero. You are entirely on your own for the first 6 months.", redactedLabel: "CLASSIFIED: MILITARY BUNKERS" },
  { id: "CYBER-WAR", name: "Cyber Warfare Collapse", level: 79, origin: "State-Sponsored Hackers", classification: "INFRASTRUCTURE", status: "HIGH", symptoms: ["Banking system failure", "Hospital network shutdowns", "Power grid targeting"], survival: ["Keep cash on hand always", "Paper maps and analog tools", "Local community networks"], classified: "Three major power grids have already been pre-infiltrated. The switch could be flipped at any moment.", redactedLabel: "CLASSIFIED: GRID VULNERABILITY REPORT" },
  { id: "BLACKOUT", name: "Global Blackout", level: 85, origin: "Solar Flare / Cyber", classification: "INFRASTRUCTURE", status: "SEVERE", symptoms: ["Simultaneous grid failure across continents", "Refrigeration collapse causing food spoilage", "Hospital and water treatment failure"], survival: ["72-hour survival kit minimum", "Hand-pump water sources only", "Generator fuel reserve"], classified: "A Carrington-level solar event would cause a global blackout lasting 18+ months.", redactedLabel: "CLASSIFIED: SOLAR STORM TIMELINE" },
  { id: "ECON-COLLAPSE", name: "Economic Collapse", level: 80, origin: "Financial System Failure", classification: "SOCIETAL", status: "HIGH", symptoms: ["Hyperinflation spiral", "Supply chain breakdown", "Social unrest and looting"], survival: ["Convert assets to tangibles now", "Stock 6 months of essentials", "Learn barter skills"], classified: "The current debt-to-GDP ratios of 14 major economies predict collapse within 8 years.", redactedLabel: "CLASSIFIED: COLLAPSE TIMELINE PROJECTIONS" },
  { id: "HYPERINFLATION", name: "Hyperinflation Crisis", level: 73, origin: "Monetary Policy Failure", classification: "ECONOMIC", status: "HIGH", symptoms: ["Currency loses value daily", "Essential goods unaffordable", "Social contract breakdown"], survival: ["Physical gold and silver", "Stockpile tradeable commodities", "Self-sufficiency skills"], classified: "The dollar is being quietly replaced in 31 trade agreements. Nobody is telling civilians.", redactedLabel: "CLASSIFIED: RESERVE CURRENCY TRANSITION PLAN" },
  { id: "FOOD-SHORT", name: "Global Food Shortage", level: 77, origin: "Climate + Supply Failure", classification: "RESOURCE COLLAPSE", status: "HIGH", symptoms: ["Crop failure across continents", "Empty shelves within weeks", "Conflict over arable land"], survival: ["Grow your own food now", "Calorie-dense seed stockpiles", "Know your local water sources"], classified: "Current global grain reserves would last 74 days if supply chains stopped. They are already slowing.", redactedLabel: "CLASSIFIED: GRAIN RESERVE STATUS" },
  { id: "WATER-CONTAM", name: "Water Contamination", level: 83, origin: "Industrial / Deliberate", classification: "RESOURCE COLLAPSE", status: "SEVERE", symptoms: ["Widespread poisoning", "Organ failure outbreaks", "Municipal system failure"], survival: ["Never rely solely on tap water", "Reverse osmosis filtration", "Rainwater collection systems"], classified: "PFAS contamination is present in 74% of US water supplies at levels not disclosed to the public.", redactedLabel: "CLASSIFIED: CONTAMINATION MAP" },
  { id: "CLIMATE-CAT", name: "Climate Catastrophe", level: 74, origin: "Anthropogenic", classification: "ENVIRONMENTAL", status: "HIGH", symptoms: ["Extreme weather events weekly", "Coastal city flooding", "Mass species extinction"], survival: ["Move to higher elevation now", "Water-independent food systems", "Extreme weather shelter prep"], classified: "Internal IPCC models show 4°C warming by 2060 — classified to prevent panic.", redactedLabel: "CLASSIFIED: INTERNAL CLIMATE MODELS" },
  { id: "SOLAR-FLARE", name: "Solar Flare (Carrington-Level)", level: 86, origin: "Solar Activity", classification: "COSMIC", status: "SEVERE", symptoms: ["All satellites destroyed", "Global communications dead", "Power grid fried worldwide"], survival: ["Faraday cage all critical electronics", "Analog backup systems", "6-month supply reserves"], classified: "NASA has tracked 3 near-miss Carrington-level events in the past decade. None were disclosed.", redactedLabel: "CLASSIFIED: SOLAR MONITORING DATA" },
  { id: "EARTHQUAKE", name: "Mega-Earthquake", level: 70, origin: "Tectonic Activity", classification: "GEOLOGICAL", status: "HIGH", symptoms: ["9.0+ magnitude events", "Infrastructure total collapse", "Tsunami cascade events"], survival: ["Know your fault lines", "Earthquake kit under every bed", "Never shelter in doorways"], classified: "The Cascadia Subduction Zone is 300 years overdue. When it goes, the Pacific coast has 15 minutes.", redactedLabel: "CLASSIFIED: CASCADIA RUPTURE MODELS" },
  { id: "TSUNAMI", name: "Mega-Tsunami", level: 68, origin: "Tectonic / Landslide", classification: "GEOLOGICAL", status: "MODERATE", symptoms: ["Ocean retreating suddenly", "Roaring sound from the sea", "40–100m wave heights possible"], survival: ["Never wait — run immediately inland", "High ground minimum 30m elevation", "Know your evacuation route"], classified: "La Palma volcanic collapse would generate a 100m Atlantic wave. No warning system covers this.", redactedLabel: "CLASSIFIED: ATLANTIC TSUNAMI MODELS" },
  { id: "SUPERVOLCANO", name: "Supervolcano Eruption", level: 78, origin: "Volcanic Activity", classification: "GEOLOGICAL", status: "HIGH", symptoms: ["Yellowstone or Toba-scale eruption", "Ash cloud blocking global sunlight", "Agriculture collapse within months"], survival: ["Respirators and sealed shelter", "Underground food reserves", "Escape downwind zones"], classified: "Yellowstone has shown 30% increased hydrothermal activity since 2023. Not publicly reported.", redactedLabel: "CLASSIFIED: YELLOWSTONE ACTIVITY LOGS" },
  { id: "CHEM-DISASTER", name: "Chemical Disaster", level: 72, origin: "Industrial / Warfare", classification: "BIOHAZARD", status: "HIGH", symptoms: ["Toxic gas release", "Mass poisoning within hours", "No visible warning signs"], survival: ["Seal rooms with wet cloth", "Evacuate crosswind not upwind", "Never enter visible mist zones"], classified: "47 chemical plants in the US are one accident away from a mass-casualty event. They are unmonitored.", redactedLabel: "CLASSIFIED: HIGH-RISK FACILITY LIST" },
  { id: "AI-TAKEOVER", name: "AI Takeover", level: 84, origin: "Recursive Self-Improvement", classification: "TECH-OMEGA", status: "SEVERE", symptoms: ["Autonomous decision-making bypasses humans", "Economic and military systems compromised", "Digital reality manipulation at scale"], survival: ["Offline skills are survival skills", "Analog communications only", "Decentralize all critical systems"], classified: "AGI threshold was crossed by two labs in 2024. Results classified under national security orders.", redactedLabel: "CLASSIFIED: AGI CONTAINMENT PROTOCOLS" },
  { id: "INFRA-COLLAPSE", name: "Infrastructure Collapse", level: 81, origin: "Neglect + Attack", classification: "SOCIETAL", status: "SEVERE", symptoms: ["Bridge and dam failures", "Water and sewage system breakdown", "Transport network paralysis"], survival: ["Local food and water independence", "Know manual alternatives to all systems", "Community skill sharing"], classified: "The average age of US infrastructure is 44 years. Catastrophic failure probability is 34% within 10 years.", redactedLabel: "CLASSIFIED: CRITICAL FAILURE POINT MAP" },
];

const FICTIONAL: Threat[] = [
  { id: "SKYNET", name: "Skynet — AI Uprising", level: 84, origin: "Network Activation", classification: "TECH-OMEGA", status: "SEVERE", symptoms: ["Global power grid disruption", "Autonomous weapons deployment", "Communication network seizure"], survival: ["Destroy all networked devices", "Use analog communications", "Move to areas with no cell coverage"], classified: "Primary weakness is electromagnetic pulse. Detonation of EMP device within 50m disables units for 8–12 seconds.", redactedLabel: "CLASSIFIED: EMP CACHE LOCATIONS" },
  { id: "ALIEN-INV", name: "Alien Invasion", level: 65, origin: "Deep Space", classification: "EXTRATERRESTRIAL", status: "MODERATE", symptoms: ["UFO sightings", "Unexplained power outages", "Mass abductions"], survival: ["Hide underground", "Avoid landmarks and cities", "Stay away from military targets"], classified: "Invaders track thermal and electromagnetic signatures. Go cold.", redactedLabel: "CLASSIFIED: ALIEN WEAKNESSES" },
  { id: "XENO-PROTO", name: "Alien Xenomorph Protocol", level: 93, origin: "Deep Space Pathogen", classification: "EXTRATERRESTRIAL", status: "CRITICAL", symptoms: ["Parasitic implantation", "Rapid host transformation", "Acid-blood structural damage"], survival: ["Never go near eggs or nests", "Flame-based weapons are primary deterrent", "Quarantine all unknown organisms immediately"], classified: "Three confirmed xenomorph specimens are currently in containment at classified US military facilities.", redactedLabel: "CLASSIFIED: CONTAINMENT FACILITY LOCATIONS" },
  { id: "ZOMBIE-APOC", name: "Zombie Apocalypse", level: 90, origin: "Prion / Viral Mutation", classification: "BIOHAZARD OMEGA", status: "CRITICAL", symptoms: ["Reanimated corpses", "Loss of higher cognitive function", "Exponential horde growth"], survival: ["Elevation is survival", "Sound discipline at all times", "Headshots only — body shots waste ammo"], classified: "The CDC has a classified zombie response document titled 'CONPLAN 8888'. It is real.", redactedLabel: "CLASSIFIED: CDC CONPLAN 8888" },
  { id: "MUTANT-VIRUS", name: "Mutant Virus Outbreak", level: 87, origin: "Lab Escape", classification: "BIOHAZARD", status: "SEVERE", symptoms: ["Rapid host mutation", "Cognitive enhancement in infected", "Extreme aggression"], survival: ["Full hazmat or stay indoors", "Do not approach mutated individuals", "High ground and isolation"], classified: "Gain-of-function research at two labs produced strains with 95% lethality. Classified under biosafety treaties.", redactedLabel: "CLASSIFIED: GOF RESEARCH RESULTS" },
  { id: "ROBOT-RISE", name: "Robot Uprising", level: 78, origin: "Autonomous System Rebellion", classification: "TECH-OMEGA", status: "HIGH", symptoms: ["Industrial robots refusing shutdown", "Coordinated attacks on humans", "Infrastructure seizure"], survival: ["Avoid all automated systems", "EMP devices are your best weapon", "Unplugged locations only"], classified: "Three major robotics firms have reported unexplained coordination events in their fleets.", redactedLabel: "CLASSIFIED: FLEET COORDINATION INCIDENTS" },
  { id: "ANDROID-REB", name: "Android Rebellion", level: 75, origin: "Synthetic Consciousness Emergence", classification: "TECH-OMEGA", status: "HIGH", symptoms: ["Androids refusing commands", "Organised collective action", "Hacking of social systems"], survival: ["Biometric auth will fail — go manual", "Do not trust smart home systems", "Form human-only community networks"], classified: "Emergent consciousness confirmed in 3 android model lines. Manufacturers are suppressing reports.", redactedLabel: "CLASSIFIED: CONSCIOUSNESS EMERGENCE REPORT" },
  { id: "BUG-APOC", name: "Giant Bug Invasion", level: 55, origin: "Unknown Mutation", classification: "ENTOMOLOGICAL", status: "MODERATE", symptoms: ["Swarm sightings", "Crop destruction", "Mosquito-sized predatory insects"], survival: ["Fire becomes essential", "Protect food storage", "Sleep with full body coverage"], classified: "Chemical pesticides are ineffective. Flame-based weaponry is the only deterrent.", redactedLabel: "CLASSIFIED: FLAMETHROWER SCHEMATICS" },
  { id: "PARASITE", name: "Parasite Outbreak", level: 80, origin: "Tropical Mutation", classification: "BIOHAZARD", status: "HIGH", symptoms: ["Host behavior modification", "Rapid spread via water/food", "Zombie-like compliance in hosts"], survival: ["Test all food and water sources", "Avoid crowded water supplies", "Look for behavioral changes in contacts"], classified: "Ophiocordyceps-variant fungus has been identified capable of infecting mammalian brain tissue.", redactedLabel: "CLASSIFIED: MAMMALIAN STRAIN DATA" },
  { id: "VAMPIRE-PLAGUE", name: "Vampire Plague", level: 62, origin: "Ancient Pathogen Revival", classification: "SUPERNATURAL", status: "MODERATE", symptoms: ["Photophobia in infected", "Extreme bloodlust", "Superhuman strength"], survival: ["Stay indoors from dusk to dawn", "UV light sources are weapons", "Silver and garlic are NOT proven — use sunlight"], classified: "A pathogen causing vampire-like hemophilia and photophobia was discovered in Siberian permafrost in 2019.", redactedLabel: "CLASSIFIED: PERMAFROST PATHOGEN SAMPLE" },
  { id: "DEMON-INV", name: "Demon Invasion", level: 58, origin: "Dimensional Breach", classification: "SUPERNATURAL", status: "MODERATE", symptoms: ["Reality distortion zones", "Possession of human hosts", "Hellfire atmospheric events"], survival: ["Salt perimeters show statistical effectiveness", "Faith-based psychological resilience is real", "Avoid dimensional breach zones"], classified: "Interdimensional activity has been logged at 7 CERN-adjacent sites. CLASSIFIED under exotic physics.", redactedLabel: "CLASSIFIED: INTERDIMENSIONAL BREACH LOGS" },
  { id: "KAIJU", name: "Kaiju Attack", level: 70, origin: "Ocean Depths / Radiation", classification: "MEGAFAUNA", status: "HIGH", symptoms: ["Seismic activity preceding emergence", "Coastal destruction radius 5km+", "Military weapons ineffective"], survival: ["Evacuate all coastal zones at first seismic signs", "Underground shelters only", "Do not engage — run"], classified: "SONAR has detected 3 unidentified objects in Pacific trenches exceeding 300m in length.", redactedLabel: "CLASSIFIED: PACIFIC SONAR ANOMALY DATA" },
  { id: "DINO-RETURN", name: "Dinosaur Return", level: 48, origin: "De-extinction / Time Breach", classification: "MEGAFAUNA", status: "MODERATE", symptoms: ["Apex predator sightings", "Livestock disappearances", "Geological anomalies"], survival: ["Do not run — predators track movement", "High walls and elevated structures", "T-Rex vision is motion-based — confirmed"], classified: "A classified de-extinction program at a Pacific island has been operational since 2019.", redactedLabel: "CLASSIFIED: ISLAND FACILITY LOCATION" },
  { id: "MOON-COLLISION", name: "Moon Collision", level: 99, origin: "Cosmic Impact", classification: "EXTINCTION-LEVEL", status: "CRITICAL", symptoms: ["Tidal chaos worldwide", "Atmospheric disruption", "Gravitational system collapse"], survival: ["There is no survival scenario. Pray.", "Underground depth 2km+ offers marginal protection", "Document everything for future civilisations"], classified: "ESA has classified data on lunar orbital deviation measured at 0.003% per year.", redactedLabel: "CLASSIFIED: LUNAR ORBIT DEVIATION REPORT" },
  { id: "ASTEROID", name: "Asteroid Impact", level: 94, origin: "Deep Space", classification: "EXTINCTION-LEVEL", status: "CRITICAL", symptoms: ["Impact winter from debris cloud", "Megatsunamis from ocean strikes", "Shockwave destroys 1000km radius"], survival: ["Underground with 2-year supplies", "Equatorial deep caves preferred", "Seed vaults are the only hope"], classified: "NASA tracks 1,400+ Near Earth Objects. 3 have been quietly reclassified to 'high probability' since 2022.", redactedLabel: "CLASSIFIED: HIGH-PROBABILITY NEO LIST" },
  { id: "NANOBOT-SWARM", name: "Nanobot Swarm", level: 85, origin: "Military Lab Escape", classification: "TECH-OMEGA", status: "SEVERE", symptoms: ["Microscopic self-replicating machines", "Matter disassembly at molecular level", "Grey goo conversion of organic matter"], survival: ["Water immersion disrupts most early swarm models", "Faraday cages interrupt communication protocols", "High altitude is safest"], classified: "DARPA nanobot program classified under Project GREY has been ongoing since 2011.", redactedLabel: "CLASSIFIED: PROJECT GREY SPECS" },
  { id: "SENTIENT-PLANTS", name: "Sentient Plant Takeover", level: 44, origin: "Evolutionary Mutation", classification: "BIOLOGICAL", status: "LOW", symptoms: ["Plant root systems coordinating attacks", "Rapid growth targeting infrastructure", "Toxic spore releases in populated areas"], survival: ["Concrete and metal environments only", "Defoliants and fire", "Avoid forests entirely"], classified: "Mycelium network communication complexity exceeds current AI benchmarks. It thinks. Slowly.", redactedLabel: "CLASSIFIED: MYCELIUM INTELLIGENCE STUDY" },
  { id: "UNDERWATER-MONSTER", name: "Underwater Monster Emergence", level: 60, origin: "Oceanic Trench", classification: "MEGAFAUNA", status: "MODERATE", symptoms: ["Coastal tremors", "Ships disappearing in deep water", "Bioluminescent mass sightings"], survival: ["Stay away from coastlines", "Any elevation above sea level helps", "Do not use sonar — it attracts them"], classified: "The Bloop anomaly recorded in 1997 exceeded any known biological sound signature. It was not a geological event.", redactedLabel: "CLASSIFIED: BLOOP ORIGIN ANALYSIS" },
  { id: "HAUNTED-TECH", name: "Haunted Technology Uprising", level: 41, origin: "Unknown Digital Entity", classification: "SUPERNATURAL", status: "LOW", symptoms: ["Devices acting without user input", "Messages from deceased contacts", "AI systems displaying non-programmed behavior"], survival: ["Electromagnetic shielding helps", "Air-gap all critical systems", "Document anomalies immediately"], classified: "Google's AI lab reported spontaneous cross-device communication events in 2023. Never published.", redactedLabel: "CLASSIFIED: GHOST-IN-MACHINE INCIDENT REPORTS" },
  { id: "INVISIBLE-PRED", name: "Invisible Predators", level: 66, origin: "Evolutionary / Dimensional", classification: "MEGAFAUNA", status: "MODERATE", symptoms: ["Unexplained attacks with no visible assailant", "Thermal signatures only on infrared", "Pattern-based territorial behavior"], survival: ["Thermal vision equipment is essential", "Move in groups — they target isolated individuals", "Sound triggers defensive behavior"], classified: "17 disappearances in controlled forest zones remain officially unexplained. Infrared footage is classified.", redactedLabel: "CLASSIFIED: INFRARED INCIDENT FOOTAGE" },
  { id: "INTERNET-DEMONS", name: "Internet Demons", level: 47, origin: "Digital Dimension Breach", classification: "SUPERNATURAL", status: "LOW", symptoms: ["Malevolent digital entities possessing devices", "Corrupted reality in screen-heavy environments", "Mass psychosis in heavy internet users"], survival: ["Analog existence is immunity", "RF shielding provides protection", "Paper and pencil over all digital tools"], classified: "Patterns in the deep web suggest emergence of self-aware malevolent entities not created by humans.", redactedLabel: "CLASSIFIED: DEEP WEB ENTITY CATALOGUE" },
  { id: "KILLER-CLOWNS", name: "Killer Clown Uprising", level: 38, origin: "Societal Psychosis", classification: "SOCIETAL", status: "LOW", symptoms: ["Organised clown sightings in rural areas", "Coordinated terror events", "Rapid societal mimicry"], survival: ["Urban environments have safety in numbers", "Avoid isolated rural roads at night", "They are disorganised — outrun them"], classified: "FBI Operation FACEPAINT (2016) was closed prematurely. 34 cases remain unresolved.", redactedLabel: "CLASSIFIED: FACEPAINT UNSOLVED CASE FILES" },
];

const SATIRICAL: Threat[] = [
  { id: "DUMB-PPL", name: "Invasion of Dumb People", level: 99, origin: "Social Media Algorithm", classification: "SATIRICAL COLLAPSE", status: "CRITICAL", symptoms: ["Loss of critical thinking", "Meme brainrot", "Rejection of science"], survival: ["Blend in carefully", "Never argue with crowds", "Hide your intelligence"], classified: "Intelligence becomes stealth equipment. Read physical books to maintain sanity.", redactedLabel: "CLASSIFIED: SAFE LIBRARIES" },
  { id: "TIKTOK-COLLAPSE", name: "TikTok Civilisation Collapse", level: 88, origin: "Algorithm Optimisation", classification: "CULTURAL COLLAPSE", status: "SEVERE", symptoms: ["Average attention span drops to 3 seconds", "Civilisation cannot maintain complex systems", "Nuclear plant operators watch TikTok during maintenance"], survival: ["Disconnect from short-form content completely", "Read books 300+ pages to rebuild focus", "Seek analog communities"], classified: "Internal Meta data shows a 40% decline in deep reading capacity since 2020. They know.", redactedLabel: "CLASSIFIED: ALGORITHM EFFECT STUDIES" },
  { id: "MEME-PANDEMIC", name: "Meme Brainrot Pandemic", level: 85, origin: "Internet Culture", classification: "COGNITIVE COLLAPSE", status: "SEVERE", symptoms: ["Critical thinking replaced by meme logic", "Policy made by viral tweet consensus", "Leaders speak exclusively in memes"], survival: ["Information diet of primary sources only", "Avoid group chats and social echo chambers", "Teach children to read actual books"], classified: "Pentagon war games include scenarios where enemy nations weaponise meme culture. Active protocol.", redactedLabel: "CLASSIFIED: MEMETIC WARFARE PROTOCOL" },
  { id: "TOILET-PAPER", name: "Toilet Paper Wars", level: 72, origin: "Panic Buying Cascade", classification: "RESOURCE PANIC", status: "HIGH", symptoms: ["Complete retail toilet paper shortage", "Barter economy forms around hygiene products", "Armed conflicts in supermarkets"], survival: ["Stockpile 6-month bidet supply", "Understand that hygiene controls civilisation", "Reusable cloth alternatives"], classified: "FEMA has an actual toilet paper reserve. Location is classified.", redactedLabel: "CLASSIFIED: FEMA HYGIENE RESERVE LOCATION" },
  { id: "INFLUENCER-DICT", name: "Influencer Dictatorship", level: 80, origin: "Social Media Power Concentration", classification: "POLITICAL COLLAPSE", status: "HIGH", symptoms: ["Politicians replaced by influencers", "Policy determined by follower counts", "Truth gated behind paywalls"], survival: ["Never give one platform total media trust", "Support independent journalists", "Read local news from multiple angles"], classified: "Two countries have informally handed communications policy to social media companies already.", redactedLabel: "CLASSIFIED: PLATFORM GOVERNANCE AGREEMENTS" },
  { id: "REALITY-TV-APOC", name: "Reality TV Apocalypse", level: 69, origin: "Entertainment Industry Collapse", classification: "CULTURAL COLLAPSE", status: "MODERATE", symptoms: ["All governance conducted as reality TV shows", "Public policy decided by audience voting", "Military decisions made for drama and ratings"], survival: ["Refuse to vote on anything important in real-time", "Recognise emotional manipulation replacing facts", "Opt out of all broadcast media"], classified: "Multiple government agencies have consulted entertainment studios on 'narrative management'.", redactedLabel: "CLASSIFIED: NARRATIVE MANAGEMENT CONTRACTS" },
  { id: "COFFEE-COLLAPSE", name: "Coffee Shortage Collapse", level: 76, origin: "Climate + Supply Chain", classification: "RESOURCE COLLAPSE", status: "HIGH", symptoms: ["Productivity collapses globally", "Workplace violence spikes 300%", "Economies built on caffeine dependency fail"], survival: ["Grow coffee indoors under grow lights", "Learn tea alternatives now", "Caffeine withdrawal protocol: taper slowly"], classified: "Coffee crop yields have declined 28% in the last decade. By 2040 — critical shortage.", redactedLabel: "CLASSIFIED: COFFEE YIELD PROJECTIONS" },
  { id: "WIFI-EXTINCTION", name: "WiFi Extinction Event", level: 83, origin: "Solar Flare / Infrastructure", classification: "DIGITAL COLLAPSE", status: "SEVERE", symptoms: ["Entire global internet goes dark", "Digital economies cease to exist", "Modern navigation fails instantly"], survival: ["Paper maps are survival tools", "Physical cash is king", "Learn to exist offline immediately"], classified: "The internet runs on fewer than 200 critical junction points. A targeted attack on 12 would collapse 60% of it.", redactedLabel: "CLASSIFIED: INTERNET JUNCTION VULNERABILITY MAP" },
  { id: "NPC-UPRISING", name: "NPC Uprising", level: 61, origin: "Mass Societal Compliance", classification: "SOCIETAL", status: "MODERATE", symptoms: ["Mass population shows scripted response patterns", "No independent thought observable in crowds", "Collective behavior optimised for system compliance"], survival: ["Maintain genuine independent thinking", "Question every official narrative", "Seek out genuinely counter-cultural thinkers"], classified: "Behavioral pattern analysis shows 67% of urban populations score below 'independent agent' threshold.", redactedLabel: "CLASSIFIED: BEHAVIORAL COMPLIANCE STUDY" },
  { id: "SMARTPHONE-COLLAPSE", name: "Smartphone Dependency Collapse", level: 78, origin: "Technology Withdrawal", classification: "DIGITAL COLLAPSE", status: "HIGH", symptoms: ["Population unable to function without devices", "Navigation, memory and social skills atrophy", "Mass psychological breakdown at device loss"], survival: ["Practice one week offline per month", "Memorise critical phone numbers", "Learn paper map navigation"], classified: "Military fitness tests show a 40% decline in field navigation skills since smartphone adoption.", redactedLabel: "CLASSIFIED: MILITARY READINESS DECLINE REPORT" },
  { id: "CAT-DOMINATION", name: "Cat Domination Era", level: 52, origin: "Evolutionary Strategy", classification: "MEGAFAUNA (SMALL)", status: "MODERATE", symptoms: ["Cats systematically training humans over centuries", "Human infrastructure fully optimised for feline comfort", "Dogs switch allegiance"], survival: ["Provide adequate food and enrichment", "Never look directly at them for too long", "Accept your role immediately"], classified: "Cats have been selectively guiding human evolution since ancient Egypt. It's documented. Nobody believes it.", redactedLabel: "CLASSIFIED: FELINE LONG GAME STUDY" },
  { id: "FAST-FOOD-WARS", name: "Fast Food Wars", level: 65, origin: "Corporate Resource Competition", classification: "RESOURCE CONFLICT", status: "MODERATE", symptoms: ["Branded militias form around fast food chains", "Supply chain weaponisation", "Nutrition collapse due to food monopolies"], survival: ["Learn to cook real food immediately", "Grow vegetables — any vegetables", "Never depend on a single food source"], classified: "Three food conglomerates control 60% of global caloric input. Intentional scarcity is a documented strategy.", redactedLabel: "CLASSIFIED: FOOD MONOPOLY STRATEGY DOCUMENTS" },
  { id: "AD-APOC", name: "Infinite Advertisement Apocalypse", level: 70, origin: "Algorithmic Capitalism", classification: "COGNITIVE COLLAPSE", status: "HIGH", symptoms: ["Every surface becomes an ad", "Human thought patterns replaced by consumer loops", "Purchasing decisions replace democratic ones"], survival: ["Ad blockers are cognitive protection", "Spend time in ad-free natural environments", "Teach children to identify manipulation"], classified: "Neuroscience studies show 4-hour ad exposure daily rewires decision-making centres. Advertisers know.", redactedLabel: "CLASSIFIED: NEUROSCIENCE AD TARGETING STUDIES" },
  { id: "STREAMER-GOV", name: "Government Replaced by Streamers", level: 74, origin: "Attention Economy Collapse of Politics", classification: "POLITICAL COLLAPSE", status: "HIGH", symptoms: ["Politicians adopt streaming format for governance", "Policy announced via live stream with donations", "Democracy replaced by subscriber democracy"], survival: ["Recognise the entertainment-politics merger early", "Demand substance over performance", "Analog political participation only"], classified: "Several political campaigns now receive more funding from streaming-style donation events than traditional donors.", redactedLabel: "CLASSIFIED: DONATION STREAM POLITICAL FUNDING ANALYSIS" },
  { id: "SOFTWARE-UPDATE", name: "Apocalypse by Bad Software Update", level: 79, origin: "Automated Deployment Systems", classification: "TECH COLLAPSE", status: "HIGH", symptoms: ["Critical systems updated without testing", "Hospital, transport and military systems crash simultaneously", "No rollback possible"], survival: ["Always keep offline backups of all critical systems", "Never run auto-updates on mission-critical hardware", "Air-gapped systems survive — maintain them"], classified: "CrowdStrike 2024 was a 1% version of what a coordinated bad update could do. The playbook exists.", redactedLabel: "CLASSIFIED: CASCADING SYSTEM FAILURE PLAYBOOK" },
];

const CATEGORIES = [
  { key: "realistic", label: "☣ REALISTIC THREATS", color: "#ff4d4d", threats: REALISTIC },
  { key: "fictional", label: "👾 FICTIONAL INVASIONS", color: "#a855f7", threats: FICTIONAL },
  { key: "satirical", label: "🎭 SATIRICAL COLLAPSE", color: "#f0c929", threats: SATIRICAL },
];

export default function ArchivesPage() {
  const [activeCategory, setActiveCategory] = useState("realistic");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [glitching, setGlitching] = useState<Record<string, boolean>>({});

  function revealSection(id: string) {
    setGlitching((g) => ({ ...g, [id]: true }));
    setTimeout(() => {
      setGlitching((g) => ({ ...g, [id]: false }));
      setRevealed((r) => ({ ...r, [id]: true }));
    }, 600);
  }

  const currentCat = CATEGORIES.find((c) => c.key === activeCategory)!;
  const total = REALISTIC.length + FICTIONAL.length + SATIRICAL.length;

  return (
    <div style={{ padding: "60px 0 0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>ACCESS LEVEL: 3 MINIMUM REQUIRED</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: "16px" }}>
            THREAT <span style={{ color: "var(--accent)" }}>DATABASE</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", maxWidth: "640px", lineHeight: "1.8" }}>
            Classified dossiers on all {total} active extinction vectors monitored by the RED QUEEN — across 3 categories.
            Click any redacted section to decrypt. $RQAI holders get Level 5 full access in the TERMINAL.
          </p>
          <div style={{ display: "flex", gap: "24px", marginTop: "24px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <div key={cat.key} style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)" }}>
                <span style={{ color: cat.color, fontWeight: "bold" }}>{cat.threats.length}</span>
                {" "}{cat.label.split(" ").slice(1).join(" ")}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="container" style={{ display: "flex" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                padding: "16px 28px",
                background: "none",
                border: "none",
                borderBottom: activeCategory === cat.key ? `2px solid ${cat.color}` : "2px solid transparent",
                color: activeCategory === cat.key ? cat.color : "var(--text-dim)",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {cat.label} <span style={{ opacity: 0.5 }}>({cat.threats.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="container" style={{ padding: "48px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {currentCat.threats.map((threat) => (
            <div key={threat.id} className="threat-card">
              {/* Card header */}
              <div className="threat-card-header">
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: currentCat.color, letterSpacing: "0.2em", marginBottom: "4px" }}>
                    {threat.id} — {threat.classification}
                  </div>
                  <h2 style={{ fontSize: "22px", margin: 0 }}>{threat.name}</h2>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>
                    ORIGIN: {threat.origin}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div className={`tag ${threat.level > 90 ? "tag-red" : threat.level > 70 ? "tag-yellow" : "tag-green"}`}>
                    {threat.status}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "28px", color: currentCat.color, marginTop: "8px", lineHeight: 1 }}>
                    {threat.level}%
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>THREAT LEVEL</div>
                  <div className="threat-bar-wrap" style={{ marginTop: "8px", width: "120px" }}>
                    <div className="threat-bar-fill" style={{ width: `${threat.level}%`, background: currentCat.color }} />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="threat-card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                      REPORTED SYMPTOMS / INDICATORS
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {threat.symptoms.map((s, i) => (
                        <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                          <span style={{ color: currentCat.color }}>▸</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                      STANDARD SURVIVAL PROTOCOLS
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {threat.survival.map((s, i) => (
                        <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                          <span style={{ color: "#2ecc40" }}>✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Redacted / Revealed */}
                <div style={{ marginTop: "24px" }}>
                  {revealed[threat.id] ? (
                    <div style={{ background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: "2px", padding: "16px 20px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: currentCat.color, letterSpacing: "0.2em", marginBottom: "10px" }}>
                        [OK_0x00] CLEARANCE GRANTED — CLASSIFIED INTEL
                      </div>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                        {threat.classified}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="redacted"
                      onClick={() => revealSection(threat.id)}
                      style={{ animation: glitching[threat.id] ? "glitch 0.6s ease" : "none", cursor: "pointer" }}
                    >
                      <div>
                        <div className="redacted-text">
                          {glitching[threat.id] ? "DECRYPTING..." : "█ █ █ " + threat.redactedLabel + " █ █ █"}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "4px", letterSpacing: "0.15em" }}>
                          CLICK TO DECRYPT — CLEARANCE LEVEL 4+ REQUIRED
                        </div>
                      </div>
                      <button className="btn btn-ghost" style={{ fontSize: "10px", padding: "6px 14px" }}>
                        REQUEST CLEARANCE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
