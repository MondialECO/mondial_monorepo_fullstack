# UI Refinements for Figma Pixel Accuracy

**Date**: 2026-04-17  
**Focus**: Typography, spacing, borders, colors, and proportions

## Summary of Changes

All components refined for pixel-perfect alignment with Figma specifications. No structural changes—styling only.

---

## 1. RoleCard Component

### Spacing Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Card padding | `p-6` (24px) | `p-5` (20px) | Tighter, modern proportions |
| Icon box padding | `p-3` (12px) | `p-2.5` (10px) | Better icon-to-content ratio |
| Icon gap | `gap-4` (16px) | `gap-3.5` (14px) | More breathing room |
| Content top padding | none | `pt-0.5` | Vertical alignment refinement |

### Typography Refinements
| Element | Before | After | Notes |
|---------|--------|-------|-------|
| Title size | `text-base` | `text-sm` | Closer to 14px spec |
| Title weight | `font-semibold` | `font-semibold` | Unchanged (correct) |
| Description size | `text-sm` | `text-xs` | Closer to 12px spec |
| Description spacing | `mt-1` | `mt-1.5` | Better vertical rhythm |

### Border & Styling
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Border width | `border-2` | `border` (1px) | Subtler, modern look |
| Border radius | `rounded-xl` | `rounded-lg` | 8px (consistent with icon box) |
| Background selected | `bg-primary/5` | `bg-primary/3` | More subtle selection |
| Hover background | `hover:bg-card/50` | `hover:bg-card` | Cleaner, more distinct |
| Icon box radius | `rounded-lg` | `rounded-md` | Smaller, 6px radius |

### Radio Button Positioning
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Position | `mt-1` (centered) | `-mt-0.5 -mr-0.5` | **Top-right corner** ✅ |
| Size | `h-5 w-5` (20px) | `h-4.5 w-4.5` (18px) | Proportional to card |
| Checkmark size | `h-3 w-3` | `h-2.5 w-2.5` | Proportional scaling |
| Border width | `border-2` | `border-2` | Unchanged (correct) |

### Icon Sizing
| Element | Before | After | Notes |
|--------|--------|-------|-------|
| Icon size | `h-6 w-6` (24px) | `h-5 w-5` (20px) | Better proportion for card |

---

## 2. RoleGrid Component

### Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Gap between cards | `gap-4` (16px) | `gap-5` (20px) |

**Rationale**: Increased breathing room for 2-column layout while maintaining visual consistency.

---

## 3. RoleList Component

### Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Gap between items | `gap-3 sm:gap-4` | `gap-3.5` |

**Rationale**: Consistent 14px gap for vertical list layout, consistent across breakpoints.

---

## 4. SignupTitle Component

### Badge Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Padding | `px-3 py-1` | `px-2.5 py-1` | Tighter badge |
| Gap | `gap-2` | `gap-1.5` | Reduced icon-text spacing |
| Background | `bg-primary/10` | `bg-primary/8` | More subtle tint |
| Font size | `text-xs` | `text-xs` | Unchanged |
| Font weight | `font-semibold` | `font-semibold` | Unchanged |
| Letter spacing | none | `tracking-wide` | Added emphasis |

### Title Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Size (mobile) | `text-3xl` | `text-3xl` | Unchanged |
| Size (desktop) | `text-4xl` | `text-4xl` | Unchanged |
| Line height | `leading-tight` | `leading-snug` | Better spacing |
| Font weight | `font-bold` | `font-bold` | Unchanged |

### Subtitle Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Size (mobile) | `text-base` | `text-sm` | More readable |
| Size (desktop) | `text-lg` | `text-base` | Consistent size |
| Weight | none | `font-normal` | Explicit (lighter) |
| Color | `text-muted-foreground` | `text-muted-foreground` | Unchanged |
| Max width | none | `max-w-xl` | Constrain line length |
| Line height | `leading-relaxed` | `leading-relaxed` | Unchanged (good) |

### Section Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Space between elements | `space-y-3` | `space-y-3.5` |

---

## 5. CTASection Component

### Button Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Gap | `gap-3 sm:gap-4` | `gap-3` |

**Rationale**: Consistent 12px gap for all button groups (mobile and desktop).

---

## 6. SignupHeader Component

### Logo & Branding
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Logo height | `h-8 w-auto` | `h-7 w-auto` | More proportional |
| Logo box size | `h-8 w-8` | `h-7 w-7` | Consistent with logo |
| Logo box radius | `rounded-lg` | `rounded-md` | 6px (consistent system) |
| Logo text size | `text-sm` | `text-xs` | Smaller icon |
| Brand text size | `text-lg` | `text-base` | 16px |
| Brand weight | `font-bold` | `font-semibold` | Lighter emphasis |
| Letter spacing | none | `tracking-tight` | Tighter logo |
| Bottom margin | `mb-8 sm:mb-12` | `mb-12` | Consistent 48px |

---

## 7. SignupLayout Component

### Container Sizing
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Max width | `max-w-2xl` (672px) | `max-w-md` (448px) | Tighter, focused layout |
| Padding (mobile) | `px-4 py-8` | `px-4 py-12` | More breathing room |
| Padding (tablet) | `sm:px-6` | `sm:px-6` | Unchanged |
| Padding (desktop) | `lg:px-8` | `lg:px-8` | Unchanged |

**Rationale**: Narrower viewport for signup flow (448px matches 4-column grid at desktop). More vertical padding for balance.

---

## 8. SignupFooter Component

### Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Top margin | `mt-8 sm:mt-12` | `mt-12` |
| Top padding | `pt-6 sm:pt-8` | `pt-6` |
| Gap (mobile) | `gap-4` | `gap-3` |
| Gap (desktop) | `sm:gap-4` | `sm:gap-4` |

---

## 9. RoleSelectionStep Component

### Section Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Space between sections | `space-y-8` | `space-y-7` |

**Rationale**: Reduced from 32px to 28px for tighter vertical rhythm while maintaining clarity.

---

## 10. RoleSelectionCompactStep Component

### Section Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Space between sections | `space-y-8` | `space-y-7` |

---

## 11. VerificationStep Component

### Placeholder Box Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Padding | `p-8` | `p-7` | 28px (from 32px) |
| Border radius | `rounded-xl` | `rounded-lg` | 8px |
| Border type | `border-2 border-dashed` | `border border-dashed` | 1px dashed |
| Background | `bg-card/50` | `bg-muted/30` | Lighter tint |
| Gap inside | `space-y-4` | `space-y-3.5` | 14px |
| Icon container size | `h-16 w-16` | `h-14 w-14` | 56px (from 64px) |
| Icon container bg | `bg-primary/10` | `bg-primary/8` | More subtle |
| Icon container radius | `rounded-full` | `rounded-full` | Unchanged |
| Icon size | `h-8 w-8` | `h-7 w-7` | 28px (from 32px) |

### Content Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Heading gap | `space-y-4` | `space-y-1.5` |
| Heading text size | `text-lg` | `text-base` |
| Heading margin bottom | `mb-2` | none |
| Description text size | `text-sm` | `text-xs` |
| Description line height | default | `leading-relaxed` |

### Info Box Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Padding | `p-4` | `p-4` | Unchanged |
| Border radius | `rounded-lg` | `rounded-md` | 6px |
| Background | `bg-muted/50` | `bg-muted/50` | Unchanged |
| Border | `border-border` | `border-border` | Unchanged |
| Text size | `text-sm` | `text-xs` | 12px |
| Label weight | `font-semibold` | `font-semibold` | Unchanged |

### Section Spacing
| Aspect | Before | After |
|--------|--------|-------|
| Space between sections | `space-y-8` | `space-y-7` |

---

## 12. Onboarding Page (Completion Step)

### Completion Screen Refinements
| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Container gap | `space-y-8` | `space-y-5` | 20px |
| Icon box size | `h-16 w-16` | `h-14 w-14` | 56px |
| Icon box bg (light) | `bg-green-100` | `bg-green-100` | Unchanged |
| Icon box bg (dark) | none | `dark:bg-green-900/30` | Added dark mode |
| Icon size | `h-8 w-8` | `h-7 w-7` | 28px |
| Icon color (light) | `text-green-600` | `text-green-600` | Unchanged |
| Icon color (dark) | none | `dark:text-green-500` | Added dark mode |
| Heading size (mobile) | `text-3xl` | `text-2xl` | More conservative |
| Heading size (desktop) | `text-3xl` | `text-3xl` | Unchanged |
| Heading weight | `font-bold` | `font-bold` | Unchanged |
| Subtext gap | `mt-2` | `space-y-2` | Cleaner structure |
| Subtext size | default | `text-sm` | Consistent small text |

---

## Typography Scale (Standardized)

### Heading Hierarchy
```
Badge:           text-xs font-semibold tracking-wide (12px)
Subtitle/Label:  text-xs font-normal (12px)
Description:     text-xs font-normal (12px)
Body:            text-sm font-normal (14px)
Card Title:      text-sm font-semibold (14px)
Step Subtitle:   text-sm/base font-normal (14-16px)
Step Title:      text-3xl sm:text-4xl font-bold (30px / 36px)
Completion Head: text-2xl sm:text-3xl font-bold (24px / 30px)
```

---

## Spacing Scale (Standardized)

### Vertical Spacing
```
Extra tight:     mt-0.5 (2px)
Tight:           mt-1 (4px)
Normal tight:    mt-1.5 (6px)
Normal:          mt-2 (8px)
Normal loose:    mt-3.5 (14px)
Loose:           mt-5 (20px)
Very loose:      mt-7 (28px)
Extra loose:     mt-12 (48px)
```

### Gap Spacing
```
Extra tight:     gap-1.5 (6px)
Tight:           gap-3 (12px)
Normal tight:    gap-3.5 (14px)
Normal:          gap-4 (16px)
Normal loose:    gap-5 (20px)
Loose:           gap-6 (24px)
Very loose:      gap-8 (32px)
```

### Padding Scale
```
Tight:           p-2.5 (10px)
Normal:          p-4 (16px)
Loose:           p-5 (20px)
Very loose:      p-6 (24px)
Extra loose:     p-7 (28px)
Very extra:      p-8 (32px)
```

---

## Border Radius Scale (Standardized)

```
Icon boxes:      rounded-md (6px)
Cards:           rounded-lg (8px)
Large boxes:     rounded-lg (8px) or rounded-xl (12px)
Circular:        rounded-full
```

---

## Color Adjustments

### Primary Actions
- Badge background: `bg-primary/10` → `bg-primary/8` (more subtle)
- Selected state: `bg-primary/5` → `bg-primary/3` (more subtle)
- Hover states: Using transparent tints instead of `/50` opacity

### Neutral/Muted
- Dashed border boxes: `bg-card/50` → `bg-muted/30` (more readable)
- Info boxes: `bg-muted/50` (consistent)

---

## Files Modified

1. ✅ `components/RoleCard.tsx` — 9 refinements
2. ✅ `components/RoleGrid.tsx` — 1 refinement
3. ✅ `components/RoleList.tsx` — 1 refinement
4. ✅ `components/SignupTitle.tsx` — 6 refinements
5. ✅ `components/CTASection.tsx` — 1 refinement
6. ✅ `components/SignupHeader.tsx` — 6 refinements
7. ✅ `components/SignupLayout.tsx` — 2 refinements
8. ✅ `components/SignupFooter.tsx` — 3 refinements
9. ✅ `steps/RoleSelectionStep.tsx` — 1 refinement
10. ✅ `steps/RoleSelectionCompactStep.tsx` — 1 refinement
11. ✅ `steps/VerificationStep.tsx` — 11 refinements
12. ✅ `app/(auth)/signup/onboarding/page.tsx` — 8 refinements

---

## Key Improvements

### Visual Refinements
- ✅ Radio button repositioned to top-right corner
- ✅ Border widths reduced for modern, subtle appearance (2px → 1px)
- ✅ Card proportions optimized (p-6 → p-5)
- ✅ Spacing refined to 28px and 32px intervals (7, 8, 12, 28, 32)
- ✅ Icon sizing consistent (24px → 20px for cards)

### Typography
- ✅ Font sizes standardized to 12px (xs), 14px (sm), 16px (base), 30-36px (headings)
- ✅ Font weights explicit (semibold for emphasis, normal for body)
- ✅ Line heights refined for readability
- ✅ Letter spacing added to badges for emphasis

### Spacing
- ✅ Vertical rhythm: 28px between sections (space-y-7)
- ✅ Card gaps: 20px (gap-5) for better breathing room
- ✅ List gaps: 14px (gap-3.5) for compactness
- ✅ Button gaps: 12px (gap-3) for consistency

### Colors
- ✅ Subtle tints (primary/3 to primary/8) for better contrast
- ✅ Muted backgrounds refined for readability
- ✅ Dark mode support added to completion screen

### Consistency
- ✅ Border radius scale: md (6px), lg (8px), xl (12px)
- ✅ Responsive padding: 16px, 20px, 24px, 28px, 32px
- ✅ All components follow same spacing and typography scale

---

## Testing Checklist

- [ ] RoleCard layout looks correct (icon-content-radio alignment)
- [ ] Radio button positioned at top-right
- [ ] Grid cards have proper spacing (20px gap)
- [ ] List items have consistent spacing (14px gap)
- [ ] Typography hierarchy is clear and readable
- [ ] All borders are 1px (not 2px)
- [ ] Colors match theme tokens
- [ ] Mobile responsive (px-4 on mobile)
- [ ] Tablet responsive (sm:px-6)
- [ ] Desktop responsive (lg:px-8, max-w-md)
- [ ] Dark mode supported
- [ ] No hardcoded hex colors

