$(function() {
var SEIEG = "http://seieg.iplaneg.net/indicadores/lib/"
// add a MapQuest OpenStreetMap tile layer
var mapquestUrl = 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg';
	mapquestAttribution = 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
	mapquestSubdomains = '1234';
var mapquest = L.tileLayer(mapquestUrl, {
	attribution : mapquestAttribution,
	subdomains : mapquestSubdomains
});

// Crear mapa en el div "map" y centrarlo en Guanajuato
var mapv = L.map('mapv', {
	center : new L.LatLng(20.85304, -100.94788),
	zoom : 8,
	layers : [ mapquest ]
});

var geojson;

// Agrega las marcas al mapa provenientes del geojson
function marcas() {
	$.getJSON(SEIEG+"visor.php?i=3&s=U9o46pafy", function(data) {
		geojson = L.geoJson(data, {
			onEachFeature : function(feature, layer) {
				if (typeof feature.properties.ds === "undefined"){
					layer.bindPopup(feature.properties.id);
				} else {
					layer.bindPopup(feature.properties.id+"<br>"+feature.properties.ds);
				}
			}
		});
		geojson.addTo(mapv);
	});
}

// Cada cierto tiempo, se actualizan las marcas
function refresh() {
	mapv.removeLayer(geojson);
	marcas();
}

// Coloca las marcas al inicio
marcas();
var refreshId = setInterval(refresh, 3600000);
});