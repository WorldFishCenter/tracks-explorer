# MongoDB Catch Events Collection Schema

This document defines the structure of documents stored in the `catch-events` MongoDB collection.

## Collection: `catch-events`

### Document Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tripId` | String | Yes | Unique identifier for the fishing trip |
| `date` | Date | Yes | Date and time when the catch event occurred (ISO 8601 format) |
| `catch_outcome` | Number | Yes | Indicates if catch was successful: `1` = has catch, `0` = no catch |
| `imei` | String | Yes | IMEI identifier of the device/vessel that reported the catch |
| `boatName` | String | No | Name of the fishing vessel (retrieved from users collection) |
| `community` | String | No | Community/location associated with the vessel (retrieved from users collection) |
| `reportedAt` | Date | Yes | Timestamp when the catch event was reported to the system |
| `createdAt` | Date | Yes | Timestamp when the document was created in the database |
| `updatedAt` | Date | Yes | Timestamp when the document was last updated |
| `fishGroup` | String | Conditional* | Type of fish caught (required when `catch_outcome = 1`) |
| `quantity` | Number | Conditional* | Number/amount of fish caught (required when `catch_outcome = 1`) |
| `photos` | Array | No | Array of base64-encoded photo strings |
| `gps_photo` | Array | No | Array of GPS coordinate objects corresponding to each photo |

*Conditional fields are only present when `catch_outcome = 1` (successful catch)

### Fish Group Values

Valid values for the `fishGroup` field:
- `"reef fish"`
- `"sharks/rays"`
- `"small pelagics"`
- `"large pelagics"`
- `"tuna/tuna-like"`

### GPS Photo Object Structure

Each object in the `gps_photo` array contains:

| Field | Type | Description |
|-------|------|-------------|
| `latitude` | Number | Latitude coordinate in decimal degrees |
| `longitude` | Number | Longitude coordinate in decimal degrees |
| `accuracy` | Number | GPS accuracy in meters (optional) |
| `timestamp` | String | ISO 8601 timestamp when the GPS coordinate was captured |

### Example Documents

#### Successful Catch Event (catch_outcome = 1)

```json
{
  "tripId": "13860379",
  "date": "2025-08-25T10:05:55.000Z",
  "catch_outcome": 1,
  "imei": "864352XXXX",
  "boatName": "ABCD",
  "community": "Maxixe-Chikuque",
  "reportedAt": "2025-08-25T07:48:32.047Z",
  "createdAt": "2025-08-25T07:48:32.047Z",
  "updatedAt": "2025-08-25T07:48:32.047Z",
  "fishGroup": "reef fish",
  "quantity": 21,
  "photos": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABXXXX"
  ],
  "gps_photo": [
    {
      "latitude": 40.9216207533936,
      "longitude": 14.214795730287344,
      "accuracy": 35,
      "timestamp": "2025-08-25T07:48:19.319Z"
    }
  ]
}
```

#### No Catch Event (catch_outcome = 0)

```json
{
  "tripId": "13860380",
  "date": "2025-08-25T10:15:30.000Z",
  "catch_outcome": 0,
  "imei": "86435204XXXX",
  "boatName": "ABCD",
  "community": "Maxixe-Chikuque",
  "reportedAt": "2025-08-25T08:15:45.123Z",
  "createdAt": "2025-08-25T08:15:45.123Z",
  "updatedAt": "2025-08-25T08:15:45.123Z"
}
```

### Data Relationships

- **Photos and GPS Coordinates**: The `photos` and `gps_photo` arrays are indexed-aligned. Photo at index `0` corresponds to GPS coordinates at index `0` in the `gps_photo` array.
- **User Data**: `boatName` and `community` are populated from the `users` collection based on the `imei` field.
- **Trip Association**: Documents are linked to trip data via the `tripId` field.

### Validation Rules

1. **catch_outcome**: Must be exactly `0` or `1`
2. **fishGroup**: Required when `catch_outcome = 1`, must be one of the valid fish group values
3. **quantity**: Required when `catch_outcome = 1`, must be a positive number
4. **photos**: Maximum of 3 photos per catch event (enforced at application level)
5. **gps_photo**: Each GPS coordinate object must contain valid latitude/longitude values

### Indexes

Recommended indexes for optimal query performance:
- `{ "tripId": 1 }`
- `{ "imei": 1, "reportedAt": -1 }`
- `{ "date": 1 }`
- `{ "catch_outcome": 1 }`