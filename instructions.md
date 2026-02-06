# Project Design Guidelines

## Core Philosophy
This project follows a **minimal, light, and user-friendly** design approach. All UI/UX decisions should align with these principles.

### 1. Minimalist Aesthetic
- **Clutter-Free**: Avoid unnecessary elements. Every element on the screen should have a distinct purpose.
- **Whitespace**: Use generous whitespace (padding and margins) to create breathing room and separate content groups logically.
- **Simplicity**: Keep forms and interactions simple. Avoid complex multi-step processes where a single step suffices.

### 2. Light Theme
- **Backgrounds**: Use predominantly white (`#ffffff`) or very clean off-white (e.g., `#f8f9fa`) backgrounds.
- **Contrast**: Maintain high readability with dark gray text (`#1f2937` or similiar) on light backgrounds. Avoid pure black on pure white if possible directly, soften it slightly.
- **Accents**: Use soft, approachable accent colors (e.g., soft blues, teals, or lavender) rather than harsh neons.

### 3. User-Friendly Experience
- **Intuitive Navigation**: Navigation should be obvious and consistent.
- **Feedback**: Provide clear visual feedback for all interactions (hover states, focus states, loading indicators, success/error messages).
- **Accessibility**: Ensure high contrast ratios and keyboard navigability.
- **Typography**: Use clean, highly readable sans-serif fonts (e.g., Inter, system-ui). Use font weight and size to establish hierarchy, not just color.

## Implementation Details (Tailwind CSS)
- **Rounded Corners**: Use `rounded-lg` or `rounded-xl` for cards and buttons to feel friendly.
- **Shadows**: Use `shadow-sm` or `shadow-md` for depth; avoid heavy drop shadows.
- **Borders**: Use subtle borders (`border-gray-100` or `border-gray-200`) to define areas without heaviness.
