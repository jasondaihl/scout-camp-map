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

  var territories = { PR: true };

  function typeClass(type) {
    if (type === "high_adventure") return "high-adventure";
    if (type === "council_high_adventure") return "council-high-adventure";
    return "council-camp";
  }

  function buildCampCard(props, showCouncil) {
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

    if (showCouncil && props.council) {
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

  function toId(str) {
    return "group-" + str.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  }

  function buildSection(key, camps, showCouncil) {
    var id = toId(key);
    var html = '<section class="state-section" id="' + id + '">';
    html +=
      "<h2>" +
      key +
      ' <span class="state-count">' +
      camps.length +
      "</span></h2>";
    html += '<div class="camp-grid">';
    camps
      .sort(function (a, b) {
        return a.name.localeCompare(b.name);
      })
      .forEach(function (props) {
        html += buildCampCard(props, showCouncil);
      });
    html += "</div></section>";
    return html;
  }

  function groupByState(allProps) {
    var byState = {};
    var byTerritory = {};
    var byCountry = {};

    allProps.forEach(function (props) {
      var country = props.country || "USA";
      if (country !== "USA") {
        if (!byCountry[country]) byCountry[country] = [];
        byCountry[country].push(props);
      } else if (territories[props.state]) {
        var label = stateNames[props.state] || props.state;
        if (!byTerritory[label]) byTerritory[label] = [];
        byTerritory[label].push(props);
      } else {
        var label = stateNames[props.state] || props.state || "Unknown";
        if (!byState[label]) byState[label] = [];
        byState[label].push(props);
      }
    });

    var groups = [];
    var sortedStates = Object.keys(byState).sort();
    var sortedTerritories = Object.keys(byTerritory).sort();
    var sortedCountries = Object.keys(byCountry).sort();

    sortedStates.forEach(function (s) {
      groups.push({ label: s, camps: byState[s] });
    });
    if (sortedTerritories.length > 0) {
      groups.push({ divider: "U.S. Territories" });
      sortedTerritories.forEach(function (t) {
        groups.push({ label: t, camps: byTerritory[t] });
      });
    }
    if (sortedCountries.length > 0) {
      groups.push({ divider: "International" });
      sortedCountries.forEach(function (c) {
        groups.push({ label: c, camps: byCountry[c] });
      });
    }

    return {
      groups: groups,
      summary: buildSummary(allProps.length, sortedStates.length, sortedTerritories.length, sortedCountries.length),
      selectLabel: "Jump to state...",
    };
  }

  function groupByCouncil(allProps) {
    var byCouncil = {};
    allProps.forEach(function (props) {
      var council = props.council || "National / Unaffiliated";
      if (!byCouncil[council]) byCouncil[council] = [];
      byCouncil[council].push(props);
    });

    var sorted = Object.keys(byCouncil).sort();
    var groups = [];
    sorted.forEach(function (c) {
      groups.push({ label: c, camps: byCouncil[c] });
    });

    return {
      groups: groups,
      summary: allProps.length + " camps across " + sorted.length + " councils",
      selectLabel: "Jump to council...",
    };
  }

  function buildSummary(total, stateCount, territoryCount, countryCount) {
    var parts = [];
    parts.push(stateCount + " state" + (stateCount !== 1 ? "s" : ""));
    if (territoryCount > 0) {
      parts.push(
        territoryCount + " territor" + (territoryCount !== 1 ? "ies" : "y")
      );
    }
    if (countryCount > 0) {
      parts.push(
        countryCount +
          " international location" +
          (countryCount !== 1 ? "s" : "")
      );
    }
    return total + " camps across " + parts.join(", ");
  }

  function render(allProps, mode) {
    var result = mode === "council" ? groupByCouncil(allProps) : groupByState(allProps);
    var groups = result.groups;

    var html = '<div class="list-header">';
    html += "<h2>Camp Directory</h2>";
    html += '<p class="camp-count">' + result.summary + "</p>";
    html += "</div>";

    // Sort toggle + jump select
    html += '<nav class="state-nav">';
    html += '<div class="sort-toggle">';
    html += '<span class="sort-label">Group by:</span>';
    html +=
      '<button class="sort-btn' +
      (mode === "state" ? " active" : "") +
      '" data-sort="state">State</button>';
    html +=
      '<button class="sort-btn' +
      (mode === "council" ? " active" : "") +
      '" data-sort="council">Council</button>';
    html += "</div>";
    html += '<select id="state-select">';
    html += '<option value="">' + result.selectLabel + "</option>";
    groups.forEach(function (g) {
      if (g.divider) return;
      html +=
        '<option value="' +
        toId(g.label) +
        '">' +
        g.label +
        " (" +
        g.camps.length +
        ")</option>";
    });
    html += "</select>";
    html += "</nav>";

    // Sections
    groups.forEach(function (g) {
      if (g.divider) {
        html += '<div class="region-divider"><h2>' + g.divider + "</h2></div>";
      } else {
        html += buildSection(g.label, g.camps, mode !== "council");
      }
    });

    return html;
  }

  fetch("data/camps.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      var allProps = data.features.map(function (f) {
        return f.properties;
      });

      var currentMode = "state";
      var container = document.getElementById("camp-list");

      function update() {
        container.innerHTML = render(allProps, currentMode);
        container.scrollTop = 0;
        attachListeners();
      }

      function attachListeners() {
        var backToTop = document.getElementById("back-to-top");

        function checkScroll() {
          var scrolled =
            container.scrollTop > 400 ||
            window.scrollY > 400 ||
            document.documentElement.scrollTop > 400;
          backToTop.classList.toggle("visible", scrolled);
        }

        container.addEventListener("scroll", checkScroll);
        window.addEventListener("scroll", checkScroll);

        backToTop.addEventListener("click", function () {
          container.scrollTo({ top: 0, behavior: "smooth" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        });

        document
          .getElementById("state-select")
          .addEventListener("change", function () {
            var val = this.value;
            if (val) {
              var el = document.getElementById(val);
              if (el) el.scrollIntoView({ behavior: "smooth" });
              this.value = "";
            }
          });

        var buttons = document.querySelectorAll(".sort-btn");
        buttons.forEach(function (btn) {
          btn.addEventListener("click", function () {
            var newMode = this.getAttribute("data-sort");
            if (newMode !== currentMode) {
              currentMode = newMode;
              update();
            }
          });
        });
      }

      update();
    });
})();
