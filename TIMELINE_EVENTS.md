# Dynamic Timeline Events System

## Overview

The SiagaX Sumud Nusantara timeline now supports dynamic event markers that are fetched from a Google Sheet via the SiagaX API. This replaces the previous hardcoded event markers with a flexible, data-driven system.

## API Integration

### Webhook Endpoint
- **URL**: `https://flotillatracker.siagax.com/webhook/timelineevents`
- **Returns**: Google Sheet CSV URL
- **Update Frequency**: 5-minute cache (configurable)

### Data Source
- **Format**: Google Sheets CSV export
- **URL Pattern**: `https://docs.google.com/spreadsheets/d/e/[SHEET_ID]/pub?output=csv`

## Google Sheet Structure

### Required Columns (in order):

| Column | Field | Type | Description | Example |
|--------|-------|------|-------------|---------|
| A | `timestamp_utc` | ISO 8601 | Event timestamp in UTC | `2025-09-03T02:00:00.000Z` |
| B | `event_type` | String | Unique event identifier | `drone_surveillance` |
| C | `title` | String | Event title | `Drone Surveillance Incident` |
| D | `description` | String | Detailed description | `Unidentified drones were detected...` |
| E | `location` | String | Geographic location | `Barcelona, Spain` |
| F | `severity` | Enum | Event severity level | `warning` |
| G | `source_url` | URL | Link to full report (optional) | `https://example.com/report` |
| H | `icon` | String | Icon identifier | `plane` |
| I | `category` | String | Event category | `security` |

### Severity Levels
- `info` - Blue color, informational events
- `warning` - Orange color, cautionary events  
- `critical` - Red color, urgent events
- `success` - Green color, positive events

### Supported Icons
- `plane` - Aircraft/aviation related
- `ship` - Maritime/vessel related
- `warning` - General warnings
- `info` - Information
- `check` - Completed/success
- `exclamation` - Alerts
- `clock` - Time-related
- `map` - Location-related
- `users` - People/crew related
- `shield` - Security related

## Implementation Details

### Icon Handling Solution

The system uses a pre-imported icon mapping to avoid dynamic import issues:

```typescript
// All icons are pre-imported for performance
export const EVENT_ICONS: Record<EventIcon, React.ComponentType<{ className?: string }>> = {
  plane: FaPlane,
  ship: FaShip,
  warning: FaExclamationTriangle,
  // ... etc
};
```

This approach:
- ✅ Prevents runtime import errors
- ✅ Maintains optimal performance
- ✅ Provides fallback for unknown icons
- ✅ Type-safe icon handling

### Caching Strategy

- **Cache Duration**: 5 minutes
- **Cache Key**: `timeline_events`
- **Fallback**: Empty array on error
- **Refresh**: Manual refresh available

### Error Handling

- Network errors are gracefully handled
- Invalid data is filtered out
- Loading states are displayed
- Fallback icons for unknown icon types

## Usage Example

### Google Sheet Data:
```csv
timestamp_utc,event_type,title,description,location,severity,source_url,icon,category
2025-09-03T02:00:00.000Z,drone_surveillance,"Drone Surveillance Incident","Unidentified drones were detected above the Global Sumud Flotilla while navigating waters off Barcelona, Spain, raising security concerns for the humanitarian mission.","Barcelona, Spain",warning,https://www.bernama.com/en/news.php?id=2463580,plane,security
2025-09-04T08:00:00.000Z,departure,"Flotilla Departure","Global Sumud Flotilla officially departs from Barcelona port to begin humanitarian mission to Gaza.","Barcelona, Spain",info,https://example.com/departure,ship,mission
```

### Result:
- Timeline markers appear at correct time positions
- Color-coded by severity
- Interactive popups with event details
- Source links when available
- Appropriate icons for each event type

## Performance Considerations

1. **Icon Pre-loading**: All icons are imported at build time
2. **Caching**: 5-minute cache prevents excessive API calls
3. **Lazy Rendering**: Only visible events are rendered
4. **Error Boundaries**: Graceful degradation on failures
5. **Type Safety**: Full TypeScript support

## Future Enhancements

- Event filtering by category
- Custom icon upload support
- Event priority ordering
- Real-time event updates via WebSocket
- Event analytics and tracking
