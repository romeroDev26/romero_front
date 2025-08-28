# Design Document

## Overview

This design document outlines the UI improvements for the DebitNoteFormPage component. The design focuses on creating a modern, clean, and user-friendly interface that leverages the existing design system while improving visual hierarchy, spacing, and user experience. The improvements will maintain all existing functionality while significantly enhancing the visual presentation and usability.

## Architecture

### Design System Integration
- Utilize existing Tailwind CSS configuration with custom color palette
- Leverage existing UI components (Button, Input, Modal) consistently
- Maintain responsive design principles with mobile-first approach
- Follow established spacing and typography patterns

### Layout Structure
The form will be reorganized into a more intuitive layout:
1. **Header Section**: Title, breadcrumb navigation, and back button
2. **Main Content Area**: Two-column layout on desktop, single column on mobile
3. **Left Column**: Form sections and item management
4. **Right Column**: Summary panel and actions (sticky on desktop)
5. **Modal Overlays**: Confirmation dialogs and error states

## Components and Interfaces

### Enhanced Form Sections

#### 1. Page Header Component
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  breadcrumbs?: BreadcrumbItem[];
}
```

**Design Features:**
- Clean typography hierarchy with large title (text-2xl font-bold)
- Subtle subtitle in gray-600
- Prominent back button with icon
- Optional breadcrumb navigation
- Bottom border for visual separation

#### 2. Affected Invoice Card
```typescript
interface AffectedInvoiceCardProps {
  invoice: AffectedInvoice;
  className?: string;
}
```

**Design Features:**
- Card-based layout with subtle shadow and rounded corners
- Header with invoice number and status badge
- Grid layout for invoice details (2-3 columns on desktop)
- Highlighted total amount with currency formatting
- Visual indicators for document type and date
- Subtle background color (bg-blue-50) to distinguish from other sections

#### 3. Form Section Container
```typescript
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  collapsible?: boolean;
}
```

**Design Features:**
- White background with subtle shadow (shadow-sm)
- Rounded corners (rounded-lg)
- Section headers with optional icons
- Consistent padding (p-6)
- Optional collapsible functionality for complex forms

#### 4. Enhanced Item Management
```typescript
interface ItemCardProps {
  item: DebitNoteItem;
  index: number;
  onUpdate: (index: number, item: DebitNoteItem) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}
```

**Design Features:**
- Individual cards for each item with border and rounded corners
- Header with item number and remove button
- Grid layout for form fields (responsive: 1-2-3 columns)
- Smooth animations for add/remove operations
- Visual feedback for form validation
- Drag handle for future reordering capability

#### 5. Summary Panel
```typescript
interface SummaryPanelProps {
  originalAmount: number;
  additionalAmount: number;
  igvAmount: number;
  totalAmount: number;
  igvEnabled: boolean;
  onIgvToggle: (enabled: boolean) => void;
}
```

**Design Features:**
- Sticky positioning on desktop (sticky top-4)
- Card layout with prominent styling
- Clear visual hierarchy for different amounts
- Modern toggle switch for IGV setting
- Emphasized final total with larger typography
- Action buttons with proper spacing and variants

### Enhanced Form Controls

#### 1. Custom Toggle Switch
```typescript
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}
```

**Design Features:**
- Modern switch design with smooth transitions
- Clear on/off states with color coding
- Accessible keyboard navigation
- Descriptive labels and help text

#### 2. Service Selector Enhancement
- Improved react-select styling to match design system
- Custom option templates with service details
- Loading states and empty states
- Search functionality with highlighting

#### 3. Currency Input Component
```typescript
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  error?: string;
  disabled?: boolean;
}
```

**Design Features:**
- Currency symbol prefix (S/)
- Proper number formatting
- Validation feedback
- Consistent styling with other inputs

## Data Models

### UI State Management
```typescript
interface DebitNoteFormUIState {
  isLoading: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  activeSection?: string;
  showConfirmModal: boolean;
  igvEnabled: boolean;
}
```

### Form Validation Enhancement
```typescript
interface ValidationState {
  fieldErrors: Record<string, string>;
  sectionErrors: Record<string, string[]>;
  isValid: boolean;
  touchedFields: Set<string>;
}
```

## Error Handling

### Enhanced Error Display
1. **Inline Field Errors**: Red border, error icon, descriptive message
2. **Section-Level Errors**: Alert banners with clear messaging
3. **Form-Level Errors**: Modal dialogs for critical errors
4. **Network Errors**: Toast notifications with retry options

### Error States Design
- Consistent error styling across all form elements
- Clear error messages with actionable guidance
- Visual hierarchy for different error severities
- Accessibility compliance with ARIA labels

## Testing Strategy

### Visual Testing
1. **Component Testing**: Individual component styling and behavior
2. **Layout Testing**: Responsive behavior across screen sizes
3. **Interaction Testing**: Form validation and user flows
4. **Accessibility Testing**: Keyboard navigation and screen readers

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design testing on various screen sizes

## Implementation Approach

### Phase 1: Core Layout Improvements
- Implement new layout structure
- Update form sections with card-based design
- Enhance typography and spacing

### Phase 2: Component Enhancements
- Implement custom toggle switch
- Enhance item management interface
- Improve summary panel design

### Phase 3: Polish and Refinement
- Add animations and transitions
- Implement loading states
- Fine-tune responsive behavior

## Design Specifications

### Color Palette (from tailwind.config.js)
- Primary: #1F4690
- Secondary: #3A5BA0
- Success: #36D399
- Warning: #FBBD23
- Error: #F87272
- Neutral backgrounds: #F5F5F5, #FFFFFF

### Typography Scale
- Headings: font-bold with appropriate text sizes (text-2xl, text-lg)
- Body text: text-gray-900 for primary, text-gray-600 for secondary
- Labels: text-sm font-medium text-gray-700
- Captions: text-xs text-gray-500

### Spacing System
- Section padding: p-6
- Card spacing: space-y-6
- Form field spacing: space-y-4
- Button groups: space-x-3
- Grid gaps: gap-4, gap-6

### Border Radius
- Cards: rounded-lg (8px)
- Buttons: rounded-md (6px)
- Inputs: rounded-md (6px)
- Small elements: rounded (4px)

### Shadows
- Cards: shadow-sm
- Modals: shadow-xl
- Hover states: shadow-md
- Focus states: ring-2 ring-primary/20