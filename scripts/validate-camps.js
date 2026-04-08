#!/usr/bin/env node

/**
 * Validates that all camps in data/camps.geojson have required properties.
 * Run: node scripts/validate-camps.js
 * Exit code 1 if any camp is missing required data.
 */

const fs = require("fs");
const path = require("path");

const GEOJSON_PATH = path.join(__dirname, "..", "data", "camps.geojson");

const REQUIRED_PROPS = ["name", "type", "city", "country", "website", "description"];
const VALID_TYPES = ["council_camp", "high_adventure", "council_high_adventure"];
const COUNCIL_TYPES = ["council_camp", "council_high_adventure"];

const data = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

let errors = 0;
let warnings = 0;

data.features.forEach((feature, i) => {
  const props = feature.properties || {};
  const label = props.name || `Feature #${i + 1}`;

  // Check geometry
  if (
    !feature.geometry ||
    feature.geometry.type !== "Point" ||
    !Array.isArray(feature.geometry.coordinates) ||
    feature.geometry.coordinates.length < 2
  ) {
    console.error(`ERROR: ${label} — missing or invalid geometry`);
    errors++;
  }

  // Check required properties
  REQUIRED_PROPS.forEach((key) => {
    const val = props[key];
    if (val === undefined || val === null || val === "") {
      console.error(`ERROR: ${label} (${props.state || "??"}) — missing "${key}"`);
      errors++;
    }
  });

  // Council and council high adventure camps must have a council
  if (COUNCIL_TYPES.includes(props.type)) {
    const council = props.council;
    if (council === undefined || council === null || council === "") {
      console.error(`ERROR: ${label} (${props.state || "??"}) — missing "council"`);
      errors++;
    }
  }

  // Domestic camps must have a state and address
  const isInternational = props.country && props.country !== "USA";
  if (!isInternational) {
    if (!props.state) {
      console.error(`ERROR: ${label} — missing "state" (domestic camp)`);
      errors++;
    }
    if (!props.address) {
      console.error(`ERROR: ${label} (${props.state || "??"}) — missing "address" (domestic camp)`);
      errors++;
    }
  }

  // Check type value
  if (props.type && !VALID_TYPES.includes(props.type)) {
    console.error(`ERROR: ${label} — invalid type "${props.type}"`);
    errors++;
  }

  // Check coordinates are reasonable (continental US + territories rough bounds)
  // Skip for international camps
  if (!isInternational && feature.geometry && feature.geometry.coordinates) {
    const [lng, lat] = feature.geometry.coordinates;
    if (lat < 17 || lat > 72 || lng < -180 || lng > -64) {
      console.warn(`WARN:  ${label} — coordinates (${lng}, ${lat}) seem outside expected range`);
      warnings++;
    }
  }
});

console.log("");
console.log(`Validated ${data.features.length} camps.`);
if (errors > 0) {
  console.error(`${errors} error(s) found.`);
}
if (warnings > 0) {
  console.warn(`${warnings} warning(s) found.`);
}
if (errors === 0) {
  console.log("All camps pass validation.");
}

process.exit(errors > 0 ? 1 : 0);
