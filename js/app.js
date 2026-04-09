(function () {
  var isMobile = window.innerWidth <= 768;
  var map = L.map("map").setView([39.8283, -98.5795], isMobile ? 3 : 4);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

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
            return L.circleMarker(latlng, style);
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
        .layers(null, overlays, { collapsed: false, position: "topright" })
        .addTo(map);
    });
})();
