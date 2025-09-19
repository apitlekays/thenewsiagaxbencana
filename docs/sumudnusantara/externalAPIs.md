# Timeline Events
https://flotillatracker.siagax.com/webhook/timelineevents
- will resolved to a Google Sheet csv file: https://docs.google.com/spreadsheets/d/e/2PACX-1vTbFZIfnaSBO-35ApiFBiFZdjw8Ak6ifBLs9bRqDgLGC294-CksS6mpOXtPH3Ec-QY0eoQP7qN7b8TC/pub?output=csv
- has timestamp_utc, event_type, title, description, location, severity, source_url, icon, category headers


# Vessel Status
https://flotillatracker.siagax.com/webhook/vesselstatus
- will resolved to a Google Sheet csv file: https://docs.google.com/spreadsheets/d/e/2PACX-1vRODXd6UHeb_ayDrGm_G61cmHMsAZcjOPbM8yfwXQdymVxCBOomvhdTFsl3gEVnH5l6T4WUQGIamgEO/pub?output=csv
- has mmsi, status, datetime headers
- status values = 'repairing', 'attacked', 'emergency', 'disabled'