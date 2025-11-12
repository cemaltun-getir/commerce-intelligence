# User Stories - Commerce Intelligence Platform

## Page 1: Indexes Page (`/pricing/indexes`)

**Component:** `IndexesPage.tsx`  
**Purpose:** Manage index values that control how Getir prices are calculated relative to competitor prices across different segments, competitors, and KVI types.

**User Persona:** Pricing Manager

---

### Story 1.1: Indexes Page - Complete Functionality

**As a** pricing manager  
**I want to** manage index values for all segment-competitor-KVI type combinations  
**So that** I can control pricing strategy across different market segments and competitors

**Acceptance Criteria:**

#### Layout & Navigation
- Page displays "Indexes" title with descriptive subtitle explaining index value purpose
- Sales channel tabs (Getir, GetirBüyük) at the top level
- Competitor tabs below sales channel tabs, populated from external API
- First competitor is auto-selected when data loads
- Active tabs are visually highlighted
- Switching tabs updates the index matrix immediately
- Tab state persists when navigating between sales channels and competitors

#### Index Matrix Display
- Matrix displays segments as rows with segment names in first column
- Matrix displays KVI types as columns: SKVI, KVI, Background (BG), Foreground (FG)
- Each cell shows the index value for that segment-KVI type combination
- Empty cells show placeholder "100" for segments without index values
- All index values are numeric inputs with 2 decimal places
- Matrix is loaded from MongoDB via `/api/segments` and `/api/index-values`
- Loading spinner shown during data fetch
- Matrix updates when switching between competitors or sales channels

#### Search & Filter
- Search input above matrix filters segments by name in real-time
- Search is case-insensitive
- Results count displays as "X of Y segments"
- Empty search results show message: "No segments found matching [search term]"
- Clearing search restores all segments

#### Edit Mode & Batch Operations
- "Edit" button (purple primary) displays when not in edit mode
- Clicking "Edit" activates edit mode with visual indicators:
  - Green "Edit Mode" tag appears next to title
  - Instructions change to edit mode guidance
  - All input fields become editable (enabled)
  - Edit button is replaced by "Cancel" and "Save" buttons
- In edit mode, changes are tracked but not saved immediately
- Clicking "Save" persists all pending changes via batch API call
- Clicking "Cancel" discards all pending changes and exits edit mode
- After successful save, exits edit mode automatically
- Edit mode persists when switching between competitors/channels
- Original values are preserved for rollback on cancel

#### Data Entry & Validation
- Input fields accept numeric values with decimals
- Minimum value is 0 (negative values prevented)
- Step increment is 1
- Input width is 100px, centered
- New segment values can be entered in edit mode
- Values represent percentage relative to competitor:
  - 100 = same as competitor price
  - 105 = 5% higher than competitor
  - 95 = 5% lower than competitor

#### Pagination
- Table pagination at bottom
- Default page size: 10 segments
- Page size options: 5, 10, 20, 50
- Shows range: "1-10 of 50 segments"
- Quick jump navigation available
- Size changer available
- Pagination resets when filters change

#### Error Handling & Empty States
- Loading state displays spinner
- Empty segment list shows appropriate message
- No segments found in search shows helpful message
- API errors display user-friendly messages
- Graceful handling when no index values exist for new segments

**Technical Implementation:**
- **Component:** `src/components/pages/IndexesPage.tsx`
- **Routes:** `src/app/pricing/indexes/page.tsx`
- **APIs Used:**
  - GET `/api/segments` - Fetch segments
  - GET `/api/index-values` - Fetch index values
  - PUT `/api/index-values` - Update index values
  - GET `/api/external-competitors` - Fetch competitor list
- **State Management:** Zustand store (`useAppStore`)
- **Database:** MongoDB collections: `segments`, `indexvalues`
- **Key State:**
  - `activeChannel`: Current sales channel (getir/getirbuyuk)
  - `activeTab`: Current competitor ID
  - `isEditMode`: Edit mode flag
  - `pendingChanges`: Tracked changes before save
  - `originalValues`: For rollback on cancel

**Business Rules:**
- Index values are mandatory for price calculations
- Each combination of segment × KVI type × competitor × channel has unique index value
- Index values default to empty (null) for new segments
- Changes are atomic - all or nothing on save
- Index values directly affect product pricing calculations

---

## Page 2: Products Page (`/pricing/products`)

**Component:** `ProductsPage.tsx`  
**Purpose:** View calculated product prices across segments and competitors, apply discounts, customize view, and export pricing data for analysis.

**User Persona:** Pricing Analyst

---

### Story 2.1: Products Page - Complete Functionality

**As a** pricing analyst  
**I want to** view and analyze calculated product prices with extensive filtering, customization, and export capabilities  
**So that** I can make informed pricing decisions and share data with stakeholders

**Acceptance Criteria:**

#### Layout & Navigation
- Page displays "Products" title with subtitle explaining automatic price calculation
- Sales channel tabs (Getir, GetirBüyük) at top level
- Active channel highlighted and persisted in application state
- Switching channels updates all product data and calculated prices
- Product list card with title and description below tabs

#### Product Data Display
- Products displayed in comprehensive data table with columns:
  - **Getir Product Name** (fixed left, always visible)
  - **Segment** - Shows which segment the product belongs to
  - **Competitor** - Competitor name for this price
  - **KVI Label** - Product classification (SKVI, KVI, Foreground, Background)
  - **IX** - Index value used for calculation
  - **Buying Price** - Cost with VAT
  - **Buying Price (w/o VAT)** - Cost without VAT
  - **Selling Price** - Current selling price with VAT
  - **Selling Price (w/o VAT)** - Selling price without VAT
  - **IX Price** - Calculated Getir price using formula: Competitor Price × (IX / 100)
  - **Profit** - Calculated as: IX Price - Buying Price, with margin percentage
  - **Competitor Price** - From external API, location-specific
  - **Disc.** - Yes/No tag for discounted status
  - **Struck Price (Original)** - Pre-discount price from competitor
  - **Discount Rate (%)** - Manual input for simulation
  - **Struck Price (Calculated)** - Simulated discount price

#### Price Calculation Logic
- IX Price calculated as: Competitor Price × (IX / 100)
- Special Getir rounding applied to calculated prices:
  - Whole numbers remain unchanged (e.g., 10.00)
  - Decimals < 0.5 round to X.50 (e.g., 10.25 → 10.50)
  - Decimals ≥ 0.5 round to X.99 (e.g., 10.75 → 10.99)
- Profit calculation: IX Price - Buying Price
- Profit margin %: (Profit / Buying Price) × 100
- All prices display with ₺ symbol and 2 decimal places

#### Search & Filter System
- **Text Search:** Large search input for product name filtering
  - Real-time filtering as user types
  - Case-insensitive matching
  - Clear button to reset
  - Preserved during pagination

- **Category Hierarchy:** 4-level cascading dropdowns
  - Level 1: Top-level categories (always enabled)
  - Level 2: Enabled only when L1 selected
  - Level 3: Enabled only when L2 selected
  - Level 4: Enabled only when L3 selected
  - Selecting parent resets child selections
  - All dropdowns have "All" option
  - Searchable within dropdowns
  - Sorted alphabetically
  - Server-side filtering via API

- **Brand Filter:** Dropdown with all unique brands
  - Dynamically populated from product data
  - Sorted alphabetically
  - Searchable
  - "All" option available

- **Competitor Filter:** Dropdown with all competitors
  - Populated from competitor data
  - Searchable
  - "All" option available

- **Discount Filter:** Three options
  - All Products
  - Discounted Only
  - Not Discounted

- **Filter Behavior:**
  - All filters can be combined
  - Instant client-side filtering (except categories)
  - Selection cleared when filters change
  - Filter state preserved during pagination

#### Column Customization
- **Column Visibility:**
  - "Columns (X/Y)" button shows current visible count
  - Dropdown menu with checkboxes for all columns
  - "Getir Product Name" always visible (cannot hide)
  - "Select All" - checks all columns
  - "Deselect All" - unchecks all except required columns
  - "Reset to Default" - restores default column set
  - Visibility preferences saved to localStorage
  - Key: `product-list-visible-columns`
  - Preferences persist across sessions
  - Changes apply immediately
  - Warning shown when no columns selected

- **Column Reorder:**
  - Drag handle (menu icon) on column headers
  - Drag and drop to reorder columns
  - Visual feedback during drag (opacity change)
  - "Getir Product Name" fixed left (cannot move)
  - "Reset Column Order" button restores default
  - Order saved to localStorage
  - Key: `product-list-column-order`
  - Order persists across sessions
  - Uses @dnd-kit library for DnD

#### Discount Simulation
- Discount Rate (%) column with input for each product
- Accepts decimal values (e.g., 15.5%)
- Per-row controls:
  - **Apply to All (✓ icon):** Applies current row's discount to all visible products
  - **Clear All (× icon):** Removes discount from all visible products
- Struck Price (Calculated) shows: IX Price × (1 - Discount Rate / 100)
- Calculated struck price uses same Getir rounding logic
- Discount % displayed below struck price
- Values preserved during filtering/pagination
- Discount data maintained in component state (not saved to DB)
- Exported with product data

#### Selection & Export
- **Selection:**
  - Checkbox column for row selection
  - "Select All" checkbox in header
  - Selection count shown: "X items selected"
  - "Clear Selection" button when items selected
  - Selection preserved during pagination
  - Selection cleared when filters change

- **Export:**
  - "Export" dropdown button (purple primary)
  - Options: Export as CSV, Export as Excel
  - Button label changes to "Export X selected" when items selected
  - Export logic:
    - With selection: Exports only selected rows
    - Without selection: Prompts for all vs filtered
    - If filters active: Ask to export all or filtered
    - If no filters: Export all
  - Exported data includes:
    - All visible columns
    - Discount rates
    - Calculated struck prices
    - Timestamp in filename
  - Success message after export
  - Uses `exportUtils.ts` utility

#### Product Actions
- **Copy Product ID:**
  - Copy icon button next to product name
  - Copies product ID to clipboard
  - Success toast: "Copied ID for [Product Name]"
  - Error toast if copy fails
  - Tooltip on hover: "Copy Product ID: [ID]"

#### Pagination
- Controls at bottom of table
- Default page size: 10 products
- Page size options: 10, 20, 50, 100
- Shows range: "1-10 of 500 items"
- Quick jump navigation
- Size changer
- Resets when filters change

#### Data Visualization & States
- **Profit Values:**
  - Green color for positive profit
  - Red color for negative profit
  - Shows profit margin % below amount
  - "Margin" label in small text

- **KVI Labels:**
  - SKVI: Red tag
  - KVI: Orange tag
  - Foreground: Blue tag
  - Background: Default gray tag

- **Segment/Competitor:**
  - Segment: Purple tag
  - Competitor: Blue/Orange tags (competitor-specific)

- **Discount Status:**
  - Yes: Green tag
  - No: Default gray tag

- **Competitor Price:**
  - Struck-through if product has struck price
  - Red color when struck price exists
  - Normal when no discount

- **Empty States:**
  - "No data" - When price data unavailable
  - "No API location set" - Segment missing price location
  - "No index value set" - Missing IX value for calculation
  - "No Getir price" - Cannot calculate IX price
  - "No buying price" - Cost data unavailable
  - "No struck price" - Product not discounted
  - All in italic gray text

- **Error Handling:**
  - Loading spinner during data fetch
  - Empty table message when no products
  - No results message with search term
  - "Reset to Default Columns" when no columns visible
  - Informative messages explain what's missing
  - Actionable guidance provided

#### Data Loading & Updates
- Products fetched on mount
- Refetch when category filters change
- Server-side category filtering via API parameters
- Client-side filtering for other attributes
- Loading state shows spinner
- Data sources:
  - Products from external API
  - Competitor prices from external API
  - Index values from MongoDB
  - Segments from MongoDB
  - Categories from external API

**Technical Implementation:**
- **Component:** `src/components/pages/ProductsPage.tsx`
- **Routes:** `src/app/pricing/products/page.tsx`
- **APIs Used:**
  - GET `/api/external-products` - Product catalog with buying/selling prices
  - GET `/api/external-price-mappings` - Location-specific competitor prices
  - GET `/api/index-values` - Index values for calculations
  - GET `/api/segments` - Segment data
  - GET `/api/external-competitors` - Competitor list
  - GET `/api/external-categories` - Category hierarchy
- **State Management:** Zustand store (`useAppStore`)
- **localStorage Keys:**
  - `product-list-visible-columns` - Column visibility preferences
  - `product-list-column-order` - Column order preferences
- **Key Libraries:**
  - @dnd-kit - Drag and drop functionality
  - Ant Design Table - Data table component
  - exportUtils.ts - CSV/Excel export
- **Key State:**
  - `activeChannel` - Current sales channel
  - `searchText` - Product search term
  - `selectedLevel1/2/3/4` - Category filters
  - `selectedBrandFilter` - Brand filter
  - `selectedCompetitorFilter` - Competitor filter
  - `selectedDiscountedFilter` - Discount status filter
  - `visibleColumns` - Set of visible column keys
  - `columnOrder` - Array of column keys in order
  - `discountRates` - Map of product key to discount %
  - `selectedRowKeys` - Array of selected row keys
  - `preferencesLoaded` - Flag for localStorage load completion

**Business Rules:**
- Products only shown if they have index values
- Each product appears once per segment-competitor combination
- Prices are location-specific based on segment's price location
- Calculated prices use mandatory Getir rounding logic
- Discount simulations don't affect database
- Column preferences are user-specific (browser-based)
- Export includes all calculated values at time of export

---

## Supporting Documentation

### Data Model Context

#### Segments
- Segments group warehouses together for pricing purposes
- Each segment has a `priceLocation` that determines which competitor prices to use
- Segments can have multiple warehouses with different characteristics

#### Index Values
- Index values define pricing relative to competitors
- Structure: Segment × KVI Type × Competitor × Sales Channel
- Value of 100 = same as competitor
- Value > 100 = higher than competitor
- Value < 100 = lower than competitor

#### Products
- Products have KVI labels (SKVI, KVI, Foreground, Background)
- KVI label determines which index value to use
- Products can have different prices per competitor and location

#### Price Calculation Flow
1. Fetch competitor price for product at segment's location
2. Determine product's KVI type from KVI label
3. Look up index value for: segment + KVI type + competitor + channel
4. Calculate: Getir Price = Competitor Price × (Index Value / 100)
5. Apply Getir rounding logic to final price

---

### External API Dependencies
- `/api/external-competitors` - Competitor master data
- `/api/external-products` - Product catalog with buying/selling prices
- `/api/external-price-mappings` - Location-specific competitor prices
- `/api/external-categories` - Category hierarchy (4 levels)

### Internal API Dependencies
- `/api/segments` - Segment CRUD operations
- `/api/index-values` - Index value CRUD operations
- `/api/warehouses` - Warehouse data

### Key Technologies
- **Framework:** Next.js 14+ with App Router
- **UI Library:** Ant Design 5.x
- **Database:** MongoDB with Mongoose
- **State Management:** Zustand (useAppStore)
- **Drag & Drop:** @dnd-kit
- **Export:** Custom utility (exportUtils.ts) supporting CSV and Excel

---

### Non-Functional Requirements

#### Performance
- Product list should load within 2 seconds
- Filtering and search should be instant (< 100ms)
- Pagination should handle 10,000+ products smoothly
- Index matrix should handle 50+ segments efficiently

#### Usability
- Responsive design for tablets and desktops
- Keyboard navigation support for inputs
- Clear visual feedback for all actions
- Intuitive column customization

#### Data Integrity
- Index values validated (≥ 0)
- Batch save operations are atomic
- Price calculations always use latest data
- Error handling for failed API calls

#### Browser Support
- Chrome (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)
- Edge (latest 2 versions)

