(function () {
  var map = L.map('map').setView([39.8283, -98.5795], 5);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var markerStyles = {
    high_adventure: { radius: 10, fillColor: '#D4A017', color: '#333', weight: 1, fillOpacity: 0.9 },
    council_camp:   { radius: 7,  fillColor: '#2E7D32', color: '#333', weight: 1, fillOpacity: 0.8 }
  };

  var typeLabels = {
    high_adventure: 'High Adventure Base',
    council_camp: 'Council Camp'
  };

  function buildPopupHTML(props) {
    var typeClass = props.type === 'high_adventure' ? 'high-adventure' : 'council-camp';
    var html = '<div class="camp-popup">';
    html += '<h3>' + props.name + '</h3>';
    html += '<span class="type-badge ' + typeClass + '">' + typeLabels[props.type] + '</span>';

    if (props.council) {
      html += '<div class="detail"><strong>Council:</strong> ' + props.council + '</div>';
    }

    var location = [];
    if (props.city) location.push(props.city);
    if (props.state) location.push(props.state);
    if (location.length) {
      html += '<div class="detail">' + location.join(', ') + '</div>';
    }

    if (props.website) {
      html += '<div class="detail"><a href="' + props.website + '" target="_blank" rel="noopener">Visit Website</a></div>';
    }

    if (props.description) {
      html += '<p class="description">' + props.description + '</p>';
    }

    html += '</div>';
    return html;
  }

  fetch('data/camps.geojson')
    .then(function (response) { return response.json(); })
    .then(function (data) {
      L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          var style = markerStyles[feature.properties.type] || markerStyles.council_camp;
          return L.circleMarker(latlng, style);
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(buildPopupHTML(feature.properties));
        }
      }).addTo(map);
    });

  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML =
      '<h4>Camp Types</h4>' +
      '<div class="legend-item">' +
        '<span class="legend-circle" style="width:16px;height:16px;background:#D4A017;"></span>' +
        ' High Adventure Base' +
      '</div>' +
      '<div class="legend-item">' +
        '<span class="legend-circle" style="width:12px;height:12px;background:#2E7D32;"></span>' +
        ' Council Camp' +
      '</div>';
    return div;
  };
  legend.addTo(map);
})();
