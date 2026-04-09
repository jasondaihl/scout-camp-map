(function () {
  var isMobile = window.innerWidth <= 768;
  var defaultCenter = [39.8283, -98.5795];
  var defaultZoom = isMobile ? 3 : 4;
  var map = L.map("map").setView(defaultCenter, defaultZoom);
  var campData = null;
  var searchState = { lat: null, lng: null, radius: 50, displayName: null };
  var searchOverlays = { circle: null, centerDot: null };
  var campLayers = [];

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  /* ---- Location Search Utilities ---- */

  function haversineDistance(lat1, lon1, lat2, lon2) {
    var R = 3958.8;
    var dLat = ((lat2 - lat1) * Math.PI) / 180;
    var dLon = ((lon2 - lon1) * Math.PI) / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function countCampsInRadius(centerLat, centerLng, radiusMiles) {
    if (!campData) return 0;
    var count = 0;
    campData.features.forEach(function (f) {
      var coords = f.geometry.coordinates;
      var dist = haversineDistance(centerLat, centerLng, coords[1], coords[0]);
      if (dist <= radiusMiles) count++;
    });
    return count;
  }

  function geocode(query, callback) {
    var url =
      "https://nominatim.openstreetmap.org/search?" +
      "q=" +
      encodeURIComponent(query) +
      "&format=json&limit=1&countrycodes=us";
    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (results) {
        if (results && results.length > 0) {
          callback(null, {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon),
            displayName: results[0].display_name,
          });
        } else {
          callback("No location found");
        }
      })
      .catch(function () {
        callback("Search failed");
      });
  }

  function geolocate(callback) {
    if (!navigator.geolocation) {
      callback("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        callback(null, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          displayName: "Your Location",
        });
      },
      function (err) {
        var msg = "Unable to get location";
        if (err.code === 1) msg = "Location permission denied";
        if (err.code === 2) msg = "Location unavailable";
        if (err.code === 3) msg = "Location request timed out";
        callback(msg);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function zoomToRadius(lat, lng, radiusMiles) {
    var radiusMeters = radiusMiles * 1609.34;
    var center = L.latLng(lat, lng);
    map.fitBounds(center.toBounds(radiusMeters * 2), { padding: [20, 20] });
  }

  var dimStyle = { fillColor: "#aaa", fillOpacity: 0.2, color: "#999", weight: 1 };

  function updateSearchOverlays() {
    // Remove old overlays
    if (searchOverlays.circle) map.removeLayer(searchOverlays.circle);
    if (searchOverlays.centerDot) map.removeLayer(searchOverlays.centerDot);
    searchOverlays.circle = null;
    searchOverlays.centerDot = null;

    if (searchState.lat === null) {
      // Restore all markers
      campLayers.forEach(function (item) {
        item.layer.setStyle(markerStyles[item.type] || markerStyles.council_camp);
      });
      return;
    }

    var radiusMeters = searchState.radius * 1609.34;

    // Draw radius circle
    searchOverlays.circle = L.circle([searchState.lat, searchState.lng], {
      radius: radiusMeters,
      color: "#87a878",
      weight: 2,
      dashArray: "6 4",
      fillColor: "rgba(61, 122, 85, 0.08)",
      fillOpacity: 1,
      interactive: false,
      className: "search-radius-circle",
    }).addTo(map);

    // Draw center dot
    searchOverlays.centerDot = L.circleMarker([searchState.lat, searchState.lng], {
      radius: 6,
      fillColor: "#c45a2d",
      color: "#fff",
      weight: 2,
      fillOpacity: 0.9,
      interactive: false,
    }).addTo(map);

    // Dim/highlight markers
    campLayers.forEach(function (item) {
      var coords = item.feature.geometry.coordinates;
      var dist = haversineDistance(searchState.lat, searchState.lng, coords[1], coords[0]);
      if (dist <= searchState.radius) {
        item.layer.setStyle(markerStyles[item.type] || markerStyles.council_camp);
      } else {
        item.layer.setStyle(dimStyle);
      }
    });
  }

  /* ---- Location Search Control ---- */

  var SearchControl = L.Control.extend({
    options: { position: isMobile ? "bottomleft" : "topleft" },
    onAdd: function () {
      var container = L.DomUtil.create(
        "div",
        "leaflet-control-search leaflet-bar",
      );
      container.innerHTML =
        '<div class="search-input-row">' +
        '<input type="text" class="search-input" placeholder="City, state, or zip">' +
        '<button class="search-gps-btn" title="Use my location" aria-label="Use my location">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="4"/>' +
        '<line x1="12" y1="2" x2="12" y2="6"/>' +
        '<line x1="12" y1="18" x2="12" y2="22"/>' +
        '<line x1="2" y1="12" x2="6" y2="12"/>' +
        '<line x1="18" y1="12" x2="22" y2="12"/>' +
        "</svg>" +
        "</button>" +
        '<button class="search-go-btn">Search</button>' +
        "</div>" +
        '<div class="search-options-row">' +
        '<label class="search-radius-label">Radius:</label>' +
        '<select class="search-radius">' +
        '<option value="25">25 mi</option>' +
        '<option value="50" selected>50 mi</option>' +
        '<option value="100">100 mi</option>' +
        '<option value="200">200 mi</option>' +
        "</select>" +
        "</div>" +
        '<div class="search-result-row" style="display:none">' +
        '<span class="search-badge"></span>' +
        '<button class="search-clear-btn" title="Clear search" aria-label="Clear search">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
        '<line x1="18" y1="6" x2="6" y2="18"/>' +
        '<line x1="6" y1="6" x2="18" y2="18"/>' +
        "</svg>" +
        "</button>" +
        "</div>";

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      var input = container.querySelector(".search-input");
      var goBtn = container.querySelector(".search-go-btn");
      var gpsBtn = container.querySelector(".search-gps-btn");
      var radiusSelect = container.querySelector(".search-radius");
      var resultRow = container.querySelector(".search-result-row");
      var badge = container.querySelector(".search-badge");
      var clearBtn = container.querySelector(".search-clear-btn");
      var errorTimeout = null;

      function showResult(text, isError) {
        badge.textContent = text;
        badge.className = "search-badge" + (isError ? " search-error" : "");
        resultRow.style.display = "flex";
        if (errorTimeout) clearTimeout(errorTimeout);
        if (isError) {
          errorTimeout = setTimeout(function () {
            if (searchState.lat === null) resultRow.style.display = "none";
          }, 5000);
        }
      }

      function updateBadge() {
        if (searchState.lat === null) {
          resultRow.style.display = "none";
          return;
        }
        var count = countCampsInRadius(
          searchState.lat,
          searchState.lng,
          searchState.radius,
        );
        showResult(
          count +
            " camp" +
            (count !== 1 ? "s" : "") +
            " within " +
            searchState.radius +
            " mi",
          false,
        );
      }

      function handleLocation(err, result) {
        goBtn.disabled = false;
        gpsBtn.disabled = false;
        if (err) {
          showResult(err, true);
          return;
        }
        searchState.lat = result.lat;
        searchState.lng = result.lng;
        searchState.displayName = result.displayName;
        zoomToRadius(result.lat, result.lng, searchState.radius);
        updateBadge();
        updateSearchOverlays();
      }

      function doSearch() {
        var query = input.value.trim();
        if (!query) return;
        goBtn.disabled = true;
        geocode(query, handleLocation);
      }

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") doSearch();
      });

      goBtn.addEventListener("click", doSearch);

      gpsBtn.addEventListener("click", function () {
        gpsBtn.disabled = true;
        geolocate(handleLocation);
      });

      radiusSelect.addEventListener("change", function () {
        searchState.radius = parseInt(radiusSelect.value, 10);
        if (searchState.lat !== null) {
          zoomToRadius(searchState.lat, searchState.lng, searchState.radius);
          updateBadge();
          updateSearchOverlays();
        }
      });

      clearBtn.addEventListener("click", function () {
        searchState.lat = null;
        searchState.lng = null;
        searchState.displayName = null;
        input.value = "";
        resultRow.style.display = "none";
        map.setView(defaultCenter, defaultZoom);
        updateSearchOverlays();
      });

      return container;
    },
  });

  new SearchControl().addTo(map);

  var markerStyles = {
    high_adventure: {
      radius: 10,
      fillColor: "#D4A017",
      color: "#333",
      weight: 1,
      fillOpacity: 0.9,
    },
    council_high_adventure: {
      radius: 8,
      fillColor: "#8a7d6b",
      color: "#333",
      weight: 1,
      fillOpacity: 0.85,
    },
    council_camp: {
      radius: 7,
      fillColor: "#3d7a55",
      color: "#333",
      weight: 1,
      fillOpacity: 0.8,
    },
  };

  var typeLabels = {
    high_adventure: "National High Adventure",
    council_high_adventure: "Council High Adventure",
    council_camp: "Council Camp",
  };

  function buildPopupHTML(props) {
    var typeClass =
      props.type === "high_adventure"
        ? "high-adventure"
        : props.type === "council_high_adventure"
          ? "council-high-adventure"
          : "council-camp";
    var html = '<div class="camp-popup">';
    html += '<div class="camp-popup-header">';
    html += "<h3>" + props.name + "</h3>";
    html += "</div>";
    html +=
      '<span class="type-badge ' +
      typeClass +
      '">' +
      typeLabels[props.type] +
      "</span>";

    if (props.council) {
      html +=
        '<div class="detail"><strong> ' +
        props.council +
        " </strong>" +
        "</div>";
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

  var layerOrder = ["council_camp", "council_high_adventure", "high_adventure"];

  var overlayLabels = {
    high_adventure:
      '<span class="legend-circle" style="width:16px;height:16px;background:#D4A017;"></span> National High Adventure Base',
    council_high_adventure:
      '<span class="legend-circle" style="width:14px;height:14px;background:#8a7d6b;"></span> Council High Adventure Base',
    council_camp:
      '<span class="legend-circle" style="width:12px;height:12px;background:#3d7a55;"></span> Council Camp',
  };

  fetch("data/camps.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      campData = data;
      var overlays = {};
      var layersByType = {};
      layerOrder.forEach(function (type) {
        var filtered = {
          type: "FeatureCollection",
          features: data.features.filter(function (f) {
            return f.properties.type === type;
          }),
        };
        var layer = L.geoJSON(filtered, {
          pointToLayer: function (feature, latlng) {
            var style =
              markerStyles[feature.properties.type] ||
              markerStyles.council_camp;
            var marker = L.circleMarker(latlng, style);
            campLayers.push({ layer: marker, type: feature.properties.type, feature: feature });
            return marker;
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup(buildPopupHTML(feature.properties));
          },
        }).addTo(map);
        layersByType[type] = layer;
      });
      ["high_adventure", "council_high_adventure", "council_camp"].forEach(
        function (type) {
          overlays[overlayLabels[type]] = layersByType[type];
        },
      );
      L.control
        .layers(null, overlays, { collapsed: isMobile, position: "topright" })
        .addTo(map);
    });
})();
