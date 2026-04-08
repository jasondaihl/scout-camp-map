(function () {
  var stateNames = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
    CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa", ID: "Idaho",
    IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky",
    LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", ME: "Maine",
    MI: "Michigan", MN: "Minnesota", MO: "Missouri", MS: "Mississippi",
    MT: "Montana", NC: "North Carolina", ND: "North Dakota", NE: "Nebraska",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada",
    NY: "New York", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
    PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island",
    SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
    UT: "Utah", VA: "Virginia", VT: "Vermont", WA: "Washington",
    WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
  };

  var typeLabels = {
    high_adventure: "National High Adventure",
    council_high_adventure: "Council High Adventure",
    council_camp: "Council Camp",
  };

  function typeClass(type) {
    if (type === "high_adventure") return "high-adventure";
    if (type === "council_high_adventure") return "council-high-adventure";
    return "council-camp";
  }

  function buildCampCard(props) {
    var html = '<div class="camp-card">';
    html += '<div class="camp-card-header">';
    html += "<h3>" + props.name + "</h3>";
    if (props.logo) {
      html +=
        '<img class="camp-logo" src="' +
        props.logo +
        '" alt="' +
        props.name +
        ' logo">';
    }
    html += "</div>";
    html +=
      '<span class="type-badge ' +
      typeClass(props.type) +
      '">' +
      typeLabels[props.type] +
      "</span>";

    if (props.council) {
      html +=
        '<div class="detail"><strong>' + props.council + "</strong></div>";
    }

    if (props.address) {
      html += '<div class="detail">' + props.address + "</div>";
    } else if (props.city || props.country) {
      var location = props.city || "";
      if (props.city && props.country) location += ", ";
      if (props.country) location += props.country;
      html += '<div class="detail">' + location + "</div>";
    }

    if (props.website) {
      html +=
        '<div class="detail"><a href="' +
        props.website +
        '" target="_blank" rel="noopener">Visit Website</a></div>';
    }

    if (props.description) {
      html += '<p class="description">' + props.description + "</p>";
    }

    html += "</div>";
    return html;
  }

  var territories = { PR: true };

  function classifyFeature(props) {
    var country = props.country || "USA";
    if (country !== "USA") return "international";
    if (territories[props.state]) return "territory";
    return "state";
  }

  function groupLabel(key, kind) {
    if (kind === "international") return key;
    return stateNames[key] || key;
  }

  function buildSection(key, camps, kind) {
    var label = groupLabel(key, kind);
    var id = "state-" + key.replace(/\s+/g, "-");
    var html = '<section class="state-section" id="' + id + '">';
    html +=
      "<h2>" +
      label +
      ' <span class="state-count">' +
      camps.length +
      "</span></h2>";
    html += '<div class="camp-grid">';
    camps
      .sort(function (a, b) {
        return a.name.localeCompare(b.name);
      })
      .forEach(function (props) {
        html += buildCampCard(props);
      });
    html += "</div></section>";
    return html;
  }

  function buildNavLink(key, camps, kind) {
    var label = groupLabel(key, kind);
    var id = "state-" + key.replace(/\s+/g, "-");
    return (
      '<a href="#' + id + '">' + label + " (" + camps.length + ")</a>"
    );
  }

  fetch("data/camps.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      var byState = {};
      var byTerritory = {};
      var byCountry = {};

      data.features.forEach(function (f) {
        var props = f.properties;
        var kind = classifyFeature(props);
        if (kind === "international") {
          var country = props.country;
          if (!byCountry[country]) byCountry[country] = [];
          byCountry[country].push(props);
        } else if (kind === "territory") {
          var terr = props.state;
          if (!byTerritory[terr]) byTerritory[terr] = [];
          byTerritory[terr].push(props);
        } else {
          var state = props.state;
          if (!byState[state]) byState[state] = [];
          byState[state].push(props);
        }
      });

      var sortedStates = Object.keys(byState).sort(function (a, b) {
        return (stateNames[a] || a).localeCompare(stateNames[b] || b);
      });
      var sortedTerritories = Object.keys(byTerritory).sort(function (a, b) {
        return (stateNames[a] || a).localeCompare(stateNames[b] || b);
      });
      var sortedCountries = Object.keys(byCountry).sort();

      var stateCount = sortedStates.length;
      var territoryCount = sortedTerritories.length;
      var countryCount = sortedCountries.length;

      // Build summary line
      var parts = [];
      parts.push(stateCount + " state" + (stateCount !== 1 ? "s" : ""));
      if (territoryCount > 0) {
        parts.push(
          territoryCount + " territor" + (territoryCount !== 1 ? "ies" : "y")
        );
      }
      if (countryCount > 0) {
        parts.push(
          countryCount + " international location" + (countryCount !== 1 ? "s" : "")
        );
      }

      var container = document.getElementById("camp-list");
      var html = '<div class="list-header">';
      html += "<h2>Camp Directory</h2>";
      html +=
        '<p class="camp-count">' +
        data.features.length +
        " camps across " +
        parts.join(", ") +
        "</p>";
      html += "</div>";

      // Navigation
      html += '<nav class="state-nav">';
      sortedStates.forEach(function (s) {
        html += buildNavLink(s, byState[s], "state");
      });
      sortedTerritories.forEach(function (t) {
        html += buildNavLink(t, byTerritory[t], "territory");
      });
      sortedCountries.forEach(function (c) {
        html += buildNavLink(c, byCountry[c], "international");
      });
      html += "</nav>";

      // Sections
      sortedStates.forEach(function (s) {
        html += buildSection(s, byState[s], "state");
      });
      if (sortedTerritories.length > 0) {
        html += '<div class="region-divider"><h2>U.S. Territories</h2></div>';
        sortedTerritories.forEach(function (t) {
          html += buildSection(t, byTerritory[t], "territory");
        });
      }
      if (sortedCountries.length > 0) {
        html += '<div class="region-divider"><h2>International</h2></div>';
        sortedCountries.forEach(function (c) {
          html += buildSection(c, byCountry[c], "international");
        });
      }

      container.innerHTML = html;
    });
})();
