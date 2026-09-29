# Floating AI coach

The persistent **Guide me** launcher opens an illustrated coach with on-device guidance. It uses the existing recommendation reason for Today, Practice and the Coach's recommended-practice action. My Style tips adapt their priority to whether the wardrobe is empty. Other tips are authored explanations of app features; this is not a conversational language model or a separately trained avatar model.

`CoachSpot` registers a real, measurable control with its label and explanation. The overlay measures active controls while guidance is open, follows scrolling/resizing, highlights the current target without intercepting touches, and animates the character below it. **Show me** scrolls a target into view. **Next tip** changes the target. If a target cannot fit above the help panel, the highlight is withheld instead of pointing at a stale position.

Core targets: Today practice, Practice recommendation, Coach section tabs and recommended practice, My Style tabs and manual add, and Profile edit. Embedded recording/garment form controls are not individually targeted in this version; the guide points to their parent section. Guidance does not auto-click controls, accept consent, choose a file or submit data.

The guide collapses on Close, can switch screen sides, honours the system reduce-motion preference and offers a session reduce-motion control. It hides during app dialogs and native keyboard presentation. Scroll padding keeps page endings reachable. It performs no network requests and adds no model download. No tips open automatically on navigation; guidance remains available from the launcher.

Validation: desktop/mobile tests verify target rectangle alignment, movement between tips, click-through navigation, reduced-motion semantics, hiding during dialogs and WCAG critical/serious checks. Native bundle export is verified; physical Android positioning, keyboard and performance testing remains required.
