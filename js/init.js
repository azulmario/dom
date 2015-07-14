/*!
 * @summary Captura y localización de domicilios geográficos
 * @version 2.0
 * @author Mario Hernández Morales / 2014-2015
 * @copyrigh Instituto de Planeación, Estadística y Geografía del Estado de Guanaguato.
 * @license GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
 * @link http://seieg.iplaneg.net/indicadores/plugins/dom/
 */

/**
 * @description Captura y localización de domicilios geográficos es una
 *              aplicación demostrativa sobre las capacidades de captura,
 *              localización y visualización de domicilios geográficos,
 *              incluidos los dispositivos móviles.
 * 
 * Función de inicialización y definición de funcionalidad de los campos de
 * captura de manera dinámica. Se puenden seleccionar direcciones urbanas y
 * rurales. En cada selección se actualizan las listas en cascada. Los campos,
 * cuando están inhabilitados, cambian su apariencia. De contar con el Código
 * Postal en la base de datos, se llena en automático, una vez definido el
 * asentamiento (Inhabilitado hasta contar con una base integral de códigos
 * postales). El botón ver mapa muestra con una aproximación según los campos,
 * si los campos están vacios muestra la localización del equipo, si los campos
 * de coordenadas geográficas están llenos muestra esta localización usando
 * botón LatLon. El mapa muestra un botón para cerrarlo. Incluye controles para
 * borrar los campos, y en el mapa un menú contextual. Las claves de los datos
 * capturados se guardan al final en la base de datos. Incluye, en pie de
 * página, el aviso de privacidad, acerca de este sitio y ubicación de
 * domicilios capturados.
 * 
 * Si no se puede hacer conexión al servidor, al principio, envía un mensaje. Es
 * requisito que en todo momento se tenga conexión a Internet. Sino en cp.php se
 * queda pegado el mensaje; se daña cuando no puede descargar datos.
 * 
 * Si no tiene almacenamiento local, desde un principio, envía en mensaje.
 * 
 * 11/03/2015 Se eliminó el selector de tipo de localidad urbano/rural, ahora se
 * enlistan todas las localidades del municipio en el campo correspondiente.
 * Abajo se agregó un enlace al Visor, para ver un mapa de los puntos
 * capturados.
 * 
 * El mapa desplegado cuenta con un botón buscar que se comporta de manera
 * secuencial: así si tenemos seleccionado un municipio únicamente va al centro
 * del municipio, si tenemos seleccionada va la coordenada de la localidad, si
 * tenemos seleccionada la colonia va al centro de la colonia (proporcionado por
 * el INE). Cuando se seleccione una calle, va al 'centro' de la calle,
 * almacenado en base de datos, sin necesidad de usar el servicio de Google.
 * 
 * 12/03/2015 Se hicieron las correcciones pertinentes para que se actualizaran
 * los cambios en el mapa cada vez que se realice una captura, bajo un intervalo
 * de 10 segundos. Se quitó la alerta al ingresar un nuevo domicilio,
 * simplemente se limpian los campos de captura después de presionar el botón
 * listo. Es necesario borrar por completo el caché del navegador para que se
 * carguen los nuevos códigos.
 * 
 * En la base de datos se encuentran almacenadas las coordenadas de las calles.
 * 
 * 11/04/2015 Se remplaza el código para utilizar
 * http://brianreavis.github.io/selectize.js/ Esto mejora la captura, buscando
 * sin acentos, palabras aisladas, tabulador, dispositivos móviles incluso en un
 * Ipad.
 * 
 * Bibliografía:
 * 
 * David Sawyer McFarland. JavaScript & jQuery: The Missing Manual, Second
 * Edition. Ed. O'Reilly. 2011 Universidad Politécnica de Madrid.
 * 
 * Desarrollo de Aplicaciones en HTML5 y para Dispositivos Móviles Firefox O.S.
 * 2014.
 * 
 * https://code.jquery.com/								1.11.3
 * http://getbootstrap.com/getting-started/#download	3.3.4
 * http://brianreavis.github.io/selectize.js/			0.12.1
 * http://plugins.jquery.com/validate/					1.1.2
 * https://maps.google.com/maps/api/js					
 * http://hpneo.github.io/gmaps/						0.4.18
 */

// @alert Generar el archivo mini en producto final y utilizarlo:
// java -jar ~/Java/yuicompressor-2.4.8.jar init.js -o init.min.js --charset utf-8

// ---------------------------------------------------------------------------------

// Variables globales del objeto mapa y dirección del webservice de consulta de domicilios.
var map;
$.getScript("js/var.js");

/**
 * Función para dibujar la marca en el mapa principal
 * @param {lat} coordenada de lat 
 * @param {lng} coordenada de lng
 * @param {texto} zoom del mosaico
 * @return {} 
 */
function hace_marca(lat, lng, texto) {
	$('#cx').val(lat.toFixed(8));
	$('#cy').val(lng.toFixed(8));

	// Mover y cachar coordenadas.
	// Al mover la marca (ubicación en el mapa del globo) se obtienen las
	// coordenadas, i.e. actualiza las coordenadas geográficas en la captura.
	map.addMarker({
		lat: lat,
		lng: lng,
		title: texto,
		infoWindow: new google.maps.InfoWindow({
			content: '<p>'+texto+'</p>'
		}),
		icon: new google.maps.MarkerImage("img/marker-icon.png"),
		draggable: true, //@fix Solo en Firefox movil android al arrastrar la marca se mueve el fondo del mapa!
		dragend: function(e) {
			$('#cx').val(e.latLng.lat().toFixed(8));
			$('#cy').val(e.latLng.lng().toFixed(8));
		}
	});
}

/**
 * Función para construir correctamente la consulta del mosaico de Bing
 * @param {x} coordenada de lat 
 * @param {y} coordenada de lng
 * @param {zoom} zoom del mosaico
 * @return {quad} cadena codificada
 */
function T2Q(x, y, zoom) {
	var quad = "";
	for ( var i = zoom; i > 0; i--) {
		var mask = 1 << (i - 1);
		var cell = 0;
		if ((x & mask) != 0)
			cell++;
		if ((y & mask) != 0)
			cell += 2;
		quad += cell;
	}
	return quad;
}

/**
 * Función que crea el mapa, si no existe; ubica las coordenadas y pone una marca.
 * El mapa se elabora con GMaps.js http://hpneo.github.com/gmaps/
 * Ejemplos http://www.paulund.co.uk/create-google-maps-with-gmaps-js
 * @param {Number} lat 
 * @param {Number} lng
 * @param {Text} texto
 * @return {}
 */
function hace_mapa(lat, lng, texto, esc) {
	esc = typeof esc !== 'undefined' ? esc : 8;
	if (typeof map === "undefined") {
		// @todo Colocar los créditos del Iplaneg en el mapa desplegable.
		map = new GMaps({
			div: '#map',
			lat: lat,
			lng: lng,
			zoom: 18,
			minZoom: 8,
			maxZoom: 21,
			mapTypeControlOptions: {
				mapTypeIds : ["hybrid", "roadmap", "satellite", "terrain", "osm", "aerial", "mapquest", "bing", "colonias"]
			}
		});
		map.addMapType("osm", {
			getTileUrl: function(coord, zoom) {
				return "http://"+"abc".charAt(Math.floor(Math.random()*3))+".tile.openstreetmap.org/"+zoom+"/"+coord.x+"/"+coord.y+".png";
			},
			tileSize: new google.maps.Size(256, 256),
			name: "OSM",
			maxZoom: 19
		});
		map.addMapType("aerial", {
			getTileUrl: function(coord, zoom) {
				return "http://"+"abc".charAt(Math.floor(Math.random()*3))+".tile.thunderforest.com/outdoors/"+zoom+"/"+coord.x+"/"+coord.y+".png";
			},
			tileSize: new google.maps.Size(256, 256),
			name: "Paisaje",
			maxZoom: 18
		});
		map.addMapType("mapquest", {
			getTileUrl: function(coord, zoom) {
				return "http://otile"+(1+Math.floor(Math.random()*4))+".mqcdn.com/tiles/1.0.0/map/"+zoom+"/"+coord.x+"/"+coord.y+".png";
			},
			tileSize: new google.maps.Size(256, 256),
			name: "Mapquest",
			maxZoom: 19
		});
		map.addMapType("bing", {
			getTileUrl: function(coord, zoom) {
				return "http://ecn.t"+(Math.floor(Math.random()*4))+".tiles.virtualearth.net/tiles/r"+T2Q(coord.x, coord.y, zoom)+".jpeg?g=45&mkt=es-E";
			},
			tileSize: new google.maps.Size(256, 256),
			name: "Bing",
			maxZoom: 19
		});
		var colonias = {
				index: 0,
				getTileUrl: function(coord, zoom) {	
					return "http://geoinfo.iplaneg.net/geoserver/gwc/service/gmaps?layers=geonode:colonias2014&zoom="+zoom+"&x="+coord.x+"&y="+coord.y+"&format=image/png8";
				},
				tileSize: new google.maps.Size(256, 256),
				name: "Colonias",
				isPng: true,
	            opacity: 0.9,
				maxZoom: 20
		};
		map.addMapType("colonias", colonias);

		//@todo Que la capa de colonias permanezca superpuesta con un fondo como Mapquest.
		/*https://developers.google.com/maps/documentation/javascript/examples/overlay-hideshow?hl=es*/
		/*https://developers.google.com/maps/documentation/javascript/examples/maptype-image-overlay?hl=es*/
		
		map.setMapTypeId("mapquest");

		map.addControl({
			position: 'right_top',
			content: 'Ubicar',
			style: {
				'direction': 'ltr',
				'overflow': 'hidden',
				'text-align': 'center',
				'position': 'relative',
				'font-family': 'Roboto,Arial,sans-serif',
				'-moz-user-select': 'none',
				'font-size': '11px',
				'padding': '1px 6px',
				'margin':'5px',
				'border-radius':'2px',
				'background-clip': 'padding-box',
				'border': '1px solid rgba(51, 51, 51, 0.25)',
				'box-shadow': '0px 1px 4px -1px rgba(0, 0, 0, 0.3)',
				'min-width': '23px',
				'-moz-box-sizing': 'border-box',
				'color': 'rgb(86, 86, 86)',
				'background': 'rgb(255, 255, 255)'
			},
			events: {
				click: ubicar_direccion,
				mouseover: function() {
					$(this).css({
						'color': 'rgb(0, 0, 0)',
						'background': 'rgb(235, 235, 235)'
					});
				},
				mouseout: function() {
					$(this).css({
						'color': 'rgb(86, 86, 86)',
						'background': 'rgb(255, 255, 255)'
					});
				}
			}
		});

		map.addControl({
			position: 'right_top',
			content: 'Latlon',
			style: {
				'direction': 'ltr',
				'overflow': 'hidden',
				'text-align': 'center',
				'position': 'relative',
				'font-family': 'Roboto,Arial,sans-serif',
				'-moz-user-select': 'none',
				'font-size': '11px',
				'padding': '1px 6px',
				'margin':'5px',
				'border-radius':'2px',
				'background-clip': 'padding-box',
				'border': '1px solid rgba(51, 51, 51, 0.25)',
				'box-shadow': '0px 1px 4px -1px rgba(0, 0, 0, 0.3)',
				'min-width': '23px',
				'-moz-box-sizing': 'border-box',
				'color': 'rgb(86, 86, 86)',
				'background': 'rgb(255, 255, 255)'
			},
			events: {
				click: ubicar_latlon,
				mouseover: function() {
					$(this).css({
						'color': 'rgb(0, 0, 0)',
						'background': 'rgb(235, 235, 235)'
					});
				},
				mouseout: function() {
					$(this).css({
						'color': 'rgb(86, 86, 86)',
						'background': 'rgb(255, 255, 255)'
					});
				}
			}
		});

		map.addControl({
			position: 'right_top',
			content: 'Cerrar',
			style: {
				'direction': 'ltr',
				'overflow': 'hidden',
				'text-align': 'center',
				'position': 'relative',
				'font-family': 'Roboto,Arial,sans-serif',
				'-moz-user-select': 'none',
				'font-size': '11px',
				'padding': '1px 6px',
				'margin':'5px',
				'border-radius':'2px',
				'background-clip': 'padding-box',
				'border': '1px solid rgba(51, 51, 51, 0.25)',
				'box-shadow': '0px 1px 4px -1px rgba(0, 0, 0, 0.3)',
				'min-width': '23px',
				'-moz-box-sizing': 'border-box',
				'color': 'rgb(86, 86, 86)',
				'background': 'rgb(255, 255, 255)'
			},
			events: {
				click: function() {
					$('#map').parent().fadeOut('slow');
					$('#vmap').show();
				},
				mouseover: function() {
					$(this).css({
						'color': 'rgb(0, 0, 0)',
						'background': 'rgb(235, 235, 235)'
					});
				},
				mouseout: function() {
					$(this).css({
						'color': 'rgb(86, 86, 86)',
						'background': 'rgb(255, 255, 255)'
					});
				}
			}
		});

		// Menú que mueva la marca y centra el mapa
		// Incluye acción para ir a la marca, es un caso especial de buscar.
		map.setContextMenu({
			control: 'map',
			options: [
			{
				title: 'Centrar',
				name: 'center_here',
				action: function(e) {
					this.setCenter(e.latLng.lat(), e.latLng.lng());
				}
			},
			{
				title: 'Mover',
				name: 'move_here',
				action: function(e) {
					this.removeMarkers();
					hace_marca(e.latLng.lat(), e.latLng.lng(), texto);
				}
			},
			{
				title: 'Ir',
				name: 'move_beyond',
				action: function(e) {
					// Referencia a las coordenadas de la marca actual.
					p = this.markers[0].getPosition();
					this.setCenter(Number(p.lat()), Number(p.lng()));
				}
			}
			]
		});
		
	} else {
		map.removeMarkers();
	}

	map.setCenter(lat, lng);
	map.setZoom(esc);
	hace_marca(lat, lng, texto);

	$('#map').parent().fadeIn('slow');
	$('#vmap').hide();
}	

/**
 * Función para comprobar la conexión con el servidor del SEIEG
 * Regresa el identificador del usuario, válido mientras se conserve.
 * @returns {integer}
 */
function chkCon() {
	var ip;
	
    //Recupera ip privada

	// NOTE: window.RTCPeerConnection is "not a constructor" in FF22/23
	var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

	if (RTCPeerConnection) (function () {
	    var rtc = new RTCPeerConnection({iceServers:[]});
	    if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
	        rtc.createDataChannel('', {reliable:false});
	    };
	    
	    rtc.onicecandidate = function (evt) {
	        // convert the candidate to SDP so we can run it through our general parser
	        // see https://twitter.com/lancestout/status/525796175425720320 for details
	        if (evt.candidate) grepSDP("a="+evt.candidate.candidate);
	    };
	    rtc.createOffer(function (offerDesc) {
	        grepSDP(offerDesc.sdp);
	        rtc.setLocalDescription(offerDesc);
	    }, function (e) { console.warn("offer failed", e); });
	    
	    
	    var addrs = Object.create(null);
	    addrs["0.0.0.0"] = false;
	    function updateDisplay(newAddr) {
	        if (newAddr in addrs) return;
	        else addrs[newAddr] = true;
	        var displayAddrs = Object.keys(addrs).filter(function (k) { return addrs[k]; });
	        ip = displayAddrs.join(" or perhaps ") || "n/a";
	    }
	    
	    function grepSDP(sdp) {
	        var hosts = [];
	        sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
	            if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
	                var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
	                    addr = parts[4],
	                    type = parts[7];
	                if (type === 'host') updateDisplay(addr);
	            } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
	                var parts = line.split(' '),
	                    addr = parts[2];
	                updateDisplay(addr);
	            }
	        });
	    }
	})();	

	//Recupera ip pública
	if (window.XMLHttpRequest)
		xmlhttp = new XMLHttpRequest();
	else
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	xmlhttp.open("GET", "http://api.hostip.info/get_html.php", false);
	xmlhttp.send();
	var hostipInfo = xmlhttp.responseText.split("\n");
	for (i = 0; hostipInfo.length > i; i++) {
		ipAddress = hostipInfo[i].split(":");
		if (ipAddress[0] == "IP")
			ip = ip +","+ $.trim(ipAddress[1]);
	}

	var n;
	$.ajax({
		url : SEIEG+"n.php",
		async : false,
		data : {
			'tg' : 'yhteys',
			'ip' : ip
		}
	}).done(function(dta) {
		if (dta.suc === 'oikea')
			n = {"0": dta.idu, '1': dta.sdu};
	});
	return n;
}

/**
 * Inicialización y declaración de eventos
 * @constructor
 * Las siguientes variables son variables globales para acceder a la selección del usuario
 */
var s_mun, s_loc, s_snt, s_cp, s_vld, s_ref1, s_ref2, s_ref3;
$(function() {	
	// Si no hay almacenamiento local.
	if(typeof localStorage == 'undefined') {
		$(document.body).empty();
	    $(document.body).append(
	    '<p></p><div class="container">'+
	    '<div class="alert alert-danger alert-dismissible fade in" role="alert">'+
	    '<h4>¡Error en función crítica!</h4>'+
	    '<p>No es posible utilizar el almacenamiento local.</p>'+
	    '<p>Con el almacenamiento local, las aplicaciones web pueden almacenar datos localmente en el navegador del usuario. '+
	    'Antes de HTML5, los datos de las aplicaciones tenían que ser almacenada en las cookies, incluidos en cada petición de servidor. El almacenamiento local es más seguro, y grandes cantidades de datos pueden ser almacenados localmente, sin afectar el rendimiento web.</p>'+
	    '<p>A diferencia de las cookies, el límite de almacenamiento es mucho mayor (al menos 5 MB) y la información nunca se transfiere al servidor. '+
	    'El almacenamiento local es por dominio. Todas las páginas, de un dominio, pueden almacenar y acceder a los mismos datos.</p>'+
	    '<p>Favor de inhabilitar el modo incógnito o equivalente. También es posible que el navegador no esté actualizado.</p>'+
	    '</div></div>');
	    return;
	}
 
	// Verifica el almacenamiento
	if((typeof localStorage.idu == 'undefined') || (typeof localStorage.sdu == 'undefined')) {
		try {
			// Limpia el caché, solo en este caso
			localStorage.clear();
			var n = chkCon();
			localStorage.setItem( "idu", n[0].toString());
			localStorage.setItem( "sdu", n[1].toString());
		}
		catch(e) {
			$(document.body).empty();
			$(document.body).append(
		    '<p></p><div class="container">'+
		    '<div class="alert alert-danger alert-dismissible fade in" role="alert">'+
		    '<h4>¡Almacenamiento fallido!</h4>'+
		    '<p>Desactive la navegación privada.</p>'+
		    '</div></div>');
			return;
		}
	} else {
		if(localStorage.idu === "0" || localStorage.idu === "") {
			var n = chkCon();
			localStorage.setItem( "idu", n[0].toString());
			localStorage.setItem( "sdu", n[1].toString());
		}
	}
	
	// Si no ha habido conexión con el servidor del SEIEG.
	if( parseInt(localStorage.idu) === 0 ) {
		$(document.body).empty();
	    $(document.body).append(
	    '<p></p><div class="container">'+
	    '<div class="alert alert-danger alert-dismissible fade in" role="alert">'+
	    '<h4>¡Error en conexión!</h4>'+
	    '<p>No hay conexión con la base de datos.</p>'+
	    '</div></div>');
	    return;
	}

	// Localidad
	localStorage.loc  = (localStorage.loc  || "");
	localStorage.locm = (localStorage.locm || "");

	// Asentamiento y Vialidad
	localStorage.vld  = (localStorage.vld  || "");
	localStorage.snt  = (localStorage.snt  || "");
	localStorage.sntvldm = (localStorage.sntvldm || "");
	localStorage.sntvldl = (localStorage.sntvldl || "");

	// Desabilita los campos
	$("#num").attr('disabled', 'disabled');
	$("#int").attr('disabled', 'disabled');

	/* Nuevo código con facilidades de búsqueda y disponible en Ipad y otros dispositivos móviles */
	// Las listas se elaboran con
	// selectize.js (v0.12.0) 
	// http://brianreavis.github.io/selectize.js/
	var $s_mun, $s_loc, $s_snt, $s_vld, $s_ref1, $s_ref2, $s_ref3;

	$s_mun = $('#mun').selectize({
		// Toma los valores de localidad, una vez elegido el municipio.
		onChange: function(value) {
			if (!value.length) return;

			// Limpiando campos...
			s_loc.disable();
			s_loc.clearOptions();
			s_snt.disable();
			s_snt.clearOptions();
			s_vld.disable();
			s_vld.clearOptions();
			s_ref1.disable();
			s_ref1.clearOptions();
			s_ref2.disable();
			s_ref2.clearOptions();
			s_ref3.disable();
			s_ref3.clearOptions();
			$('#ref4').val([]);
			s_cp.clearOptions();
			$('#num').val([]);
			$('#int').val([]);
			s_cp.disable();
			$("#num").attr('disabled', 'disabled');
			$("#int").attr('disabled', 'disabled');

			if($('#map').is(":visible"))
				ubicar_direccion();

			s_loc.load(function(callback) {				
				if (localStorage.loc === "" || !(JSON.parse(localStorage.locm) === value)) {
					cmsg_crgd('Cargando datos del servidor...', false);
					setTimeout(function() {
						$.getJSON(SEIEG+"loc.php?m="+value, function(datos) {
							$.each(datos, function(key, value) {
								s_loc.addOption({value:key,text:value});
							});
		
							localStorage.loc  = JSON.stringify(datos);
							localStorage.locm = JSON.stringify(value);
		
							s_loc.refreshOptions();
							s_loc.enable();
							$('#crgd').hide();
						});
					}, 1);
				} else {
					//Cargando datos localmente...
					$.each(JSON.parse(localStorage.loc), function(key, value) {
						s_loc.addOption({value:key,text:value});
					});
					s_loc.refreshOptions();
					s_loc.enable();
				}
			});
		}
	});
	s_mun = $s_mun[0].selectize;

	// Una vez elegida la ciudad, se procede a llenar la calle y la colonia
	$s_loc = $('#loc').selectize({
		onChange: function(value) {
			if (!value.length) return;
			// Limpiando campos...

			//Limpia algun valor seleccionado anteriormente
			s_snt.clearOptions();
			s_vld.clearOptions();
			s_ref1.clearOptions();
			s_ref2.clearOptions();
			s_ref3.clearOptions();
			// Limpia los campos cp y num
			s_cp.clearOptions();
			$('#num').val([]);
			$('#int').val([]);
			$('#ref4').val([]);
			// Deshabilita los campos
			s_snt.disable();
			s_vld.disable();
			s_ref1.disable();
			s_ref2.disable();
			s_ref3.disable();
			s_cp.disable();
			$("#num").attr('disabled', 'disabled');
			$("#int").attr('disabled', 'disabled');

			if($('#map').is(":visible"))
				ubicar_direccion();

			//LLena con las nuevas opciones
			s_snt.load(function(callback) {
				if (localStorage.snt === "" || localStorage.vld === "" ||
						!(JSON.parse(localStorage.sntvldm) === s_mun.getValue()) ||
						!(JSON.parse(localStorage.sntvldl) === s_loc.getValue()) ) {
					cmsg_crgd('Cargando datos del servidor...', false);
					setTimeout(function() {
						var k = 0;
						$.getJSON(SEIEG+"col.php?m="+s_mun.getValue()+"&l="+s_loc.getValue(), function(datos) {
							$.each(datos, function(key, value) {
								s_snt.addOption({value:key,text:value});
							});
							s_snt.refreshOptions();
							s_snt.enable();
							
							localStorage.snt  = JSON.stringify(datos);
							localStorage.sntvldl = JSON.stringify(s_loc.getValue());
							localStorage.sntvldm = JSON.stringify(s_mun.getValue());
							
							if(++k === 2)
								$('#crgd').hide();
						});
						// Las localidades rurales en general no tienen calles, las cuales vienen con 0 por default.
						// Aún así muestra la caja de selección, aunque sin opción de cambiar la selección.
						$.getJSON(SEIEG+"cal.php?m="+s_mun.getValue()+"&l="+s_loc.getValue(), function(datos) {
							$.each(datos, function(key, value) {
								s_vld.addOption({value:key,text:value});
								s_ref1.addOption({value:key,text:value,tipo:'z'});
								s_ref2.addOption({value:key,text:value,tipo:'z'});
								s_ref3.addOption({value:key,text:value});
							});
							s_vld.refreshOptions();
							s_vld.enable();
							s_ref1.refreshOptions();
							s_ref1.enable();
							s_ref2.refreshOptions();
							s_ref2.enable();
							s_ref3.refreshOptions();
							s_ref3.enable();
							
							localStorage.vld  = JSON.stringify(datos);

							if(++k === 2)
								$('#crgd').hide();
						});
					}, 1);
				} else {
					//Cargando datos localmente...

					// Aprovecha los datos desde el cache, útil cuando se selecciona varias veces la misma localidad
					var ldsnt = $.parseJSON(localStorage.snt);
					$.each(ldsnt, function(key, value) {
						s_snt.addOption({value:key,text:value});
					});
	
					var ldvld = $.parseJSON(localStorage.vld);
					$.each(ldvld, function(key, value) {
						s_vld.addOption({value:key,text:value});
						s_ref1.addOption({value:key,text:value,tipo:'z'});
						s_ref2.addOption({value:key,text:value,tipo:'z'});
						s_ref3.addOption({value:key,text:value});
					});

					s_snt.refreshOptions();
					s_snt.enable();
					s_vld.refreshOptions();
					s_vld.enable();
					s_ref1.refreshOptions();
					s_ref1.enable();
					s_ref2.refreshOptions();
					s_ref2.enable();
					s_ref3.refreshOptions();
					s_ref3.enable();
				}
			});
		}
	});
	s_loc  = $s_loc[0].selectize;

	$s_cp = $('#cp').selectize({
	    create: true,
	    sortField: 'text',
	    createFilter: function(input) {
	        var match, regex;
	        regex = new RegExp('^[3][678][0-9][0-9][0-9]$');
	        match = input.match(regex);
	        if (match)
	        	return !this.options.hasOwnProperty(match[0]);
	        return false;
	    }
	});
	s_cp = $s_cp[0].selectize;

	$s_snt = $('#snt').selectize({
		onChange: function(value) {
			if (!value.length) return;
			// @todo agregar el caso de los códigos postales para localidades rurales (que no tienen asentamientos).
			// implica que en la base de datos se de el alta de los asentamientos y de sus códigos postales.

			s_cp.clearOptions();
			s_cp.enable();
			//s_cp.refreshOptions();
			// Despliega los códigos postales con las colonias del INE.
			$.getJSON(SEIEG+"cp.php?a="+s_snt.getValue(),function(dat) {
				if(dat.length > 0) {
					// Uno o varios códigos postales asociados
					$.each(dat, function(key, value) {
						s_cp.addOption({value:value,text:value});
					});
				}
			});

			if($('#map').is(":visible")) {
				ubicar_direccion();
			}

		}
	});
	s_snt  = $s_snt[0].selectize;

	$s_vld = $('#vld').selectize({
		onChange: function(value) {
			if (!value.length) return;
			$('#num').removeAttr('disabled');
			$('#int').removeAttr('disabled');
			$("#num").val('');
			$("#int").val('');
			$('#ref4').val('');

			s_ref1.enable();
			s_ref2.enable();
			s_ref3.enable();
			s_ref1.clear();
			s_ref2.clear();
			s_ref3.clear();

			if(value !== '0' && (($('#vld option:selected').html()).indexOf('NINGUNO') === -1) ) { 
				// Resalta las calles que intersectan con la calle seleccionada
				$.getJSON(SEIEG+"ecal.php?c="+s_mun.getValue()+s_loc.getValue()+s_vld.getValue(),function(dat) {
					if(dat.length > 0) {
						// Limpia
						s_ref1.clearOptions();
						s_ref2.clearOptions();
						// Llena con cache
						var ldvld = $.parseJSON(localStorage.vld);
						$.each(ldvld, function(key, value) {
							if( $.inArray(key, dat) !== -1 ) {
								s_ref1.addOption({value:key,text:value,tipo:'e'});
								s_ref2.addOption({value:key,text:value,tipo:'e'});
							}
						});
						s_ref1.refreshItems();
						s_ref2.refreshItems();
					}
				});
				$('#infad').show();
			}

			if($('#map').is(":visible"))
				ubicar_direccion();
		}
	});
	s_vld  = $s_vld[0].selectize;
	
  $s_ref1 = $('#ref1').selectize({
    labelField: 'text',
    valueField: 'value',
    searchField: ['text'],
    optgroups: [
      {id: 'e', name: 'Entre calles'},
      {id: 'z', name: 'Vialidades'}
    ],
    optgroupField: 'tipo',
    optgroupLabelField: 'name',
    optgroupValueField: 'id',
    optgroupOrder: ['e', 'z'],
    plugins: ['optgroup_columns'],
    openOnFocus: false,
    onChange: function(value) {
		if (!value.length)
			return;
		s_ref2.clear();
		if($('#map').is(":visible"))
			ubicar_direccion();
    }
  });
	s_ref1  = $s_ref1[0].selectize;

	$s_ref2 = $('#ref2').selectize({
    labelField: 'text',
    valueField: 'value',
    searchField: ['text'],
    optgroups: [
      {id: 'e', name: 'Entre calles'},
      {id: 'z', name: 'Vialidades'}
    ],
    optgroupField: 'tipo',
    optgroupLabelField: 'name',
    optgroupValueField: 'id',
    optgroupOrder: ['e', 'z'],
    plugins: ['optgroup_columns'],
    openOnFocus: false,
    onChange: function(value) {
		if (!value.length)
			return;
		if($('#map').is(":visible"))
			ubicar_direccion();
    }
  });
	s_ref2  = $s_ref2[0].selectize;

	$s_ref3 = $('#ref3').selectize();
	s_ref3  = $s_ref3[0].selectize;

	$('#num').change(function(){
		if($('#map').is(":visible"))
			ubicar_direccion();
	});

	$('#cx').change(function(value){
		if($('#map').is(":visible"))
			ubicar_latlon();
	});

	$('#cy').change(function(){
		if($('#map').is(":visible"))
			ubicar_latlon();
	});

	s_loc.disable();
	s_snt.disable();
	s_vld.disable();
	s_cp.disable();
	s_ref1.disable();
	s_ref2.disable();
	s_ref3.disable();

	/* Termina de inicializar los campos de captura */

	// Para una dirección capturada localiza su ubicación geográfica
	$('#vmap').on('click', ubicar_direccion);

	$('form').validate({
		onKeyup : true,
		onChange : true,
		onBlur : true,
		sendForm : false,
		/*eachField : function() {
			// Vacío
		},*/
		eachValidField : function() {
			$(this).closest('div').removeClass('has-error');
			$(this).parent().popover('destroy');
		},
		eachInvalidField : function() {
			$(this).closest('div').addClass('has-error');
			$(this).parent().popover({content: 'Verifique', trigger : 'hover', delay: { show: 100, hide: 3000 }});
		},
		invalid : function() {
			alert("Verifique los datos");
		},
		valid : function() {
			var data = $(this).serialize();

			$('form fieldset').attr('disabled', true);
			$('button[type=submit]').text('Guardando...');

			// Gestor propio de base de datos
			$.post(SEIEG+"dom.php", data+"&i="+localStorage.idu+"&s="+localStorage.sdu)
				.always(function() {
					$('button[type=submit]').text('Listo');
					$('form fieldset').attr('disabled', false);

					// Limpia los campos para iniciar una nueva captura
					limpiar_campos();
				});
			//@NOTA Falta hacer validación de datos, correspondencia calle-número, entrecalles, coordenadas dentro del estado.
		}
	});

	// Evita que se lance el formulario al presionar enter en un campo de entrada (antes de completar los campos).
	$('form :text').keypress(function(e){
		if ((e.keyCode || e.which) == 13) {			
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	});

	// Cuando presiona el botón de reset se limpian los campos
	$('button[type=reset]').click(function(e){
		//e.preventDefault();
		limpiar_campos();
	});

	// Punto de inicio de captura
	$('form :text:first').focus();
	
	// Coloca el logo y footer, si no está embebido en frame.
	if (parent.frames.length !== 0) {
		$(document.body).prepend('<div class="header hidden-print"><div class="img-logo2"></div><div class="barra-titulo2">Instituto de Planeación, Estadística y Geografía del Estado de Guanajuato</div></div>');
	}

	$('.bs-aviso').modal({
		backdrop: 'static',
		keyboard: false,
		show: true
	});
	
	$('.bs-visor').modal({
		backdrop: 'static',
		keyboard: false,
		show: false
	});
	$('#vvis').on('click', function() {
		$('#vis').attr('src', 'visor.html');
	});
	$('#hvis').on('click', function() {
		$('#vis').attr('src', '');
	});
	
	// Esta parte se visibiliza cuando se ha llenado la calle, de otra manera no es necesaria
	$('#infad').hide();

});

//Limpia los campos para iniciar una captura nueva.
function limpiar_campos(){
	// Limpia algún valor seleccionado anteriormente en los campos
	$('form :input').val('');	// Limpia los campos cp y num
	s_mun.clear();
	s_loc.clear();
	s_snt.clear();
	s_cp.clear();
	s_vld.clear();
	s_ref1.clear();
	s_ref2.clear();
	s_ref3.clear();

    // En caché se encuentra un respaldo de la última selección
	// Limpia el contenido de la lista
	s_loc.clearOptions();
	s_snt.clearOptions();
	s_cp.clearOptions();
	s_vld.clearOptions();
	s_ref1.clearOptions();
	s_ref2.clearOptions();
	s_ref3.clearOptions();

	// Deshabilita los campos
	s_loc.disable();
	s_snt.disable();
	s_vld.disable();
	s_ref1.disable();
	s_ref2.disable();
	s_ref3.disable();
	s_cp.disable();
	$("#num").attr('disabled', 'disabled');
	$("#int").attr('disabled', 'disabled');
	
	// Cerrar el mapa
	if($('#map').is(":visible")){
		$('#map').parent().fadeOut('slow');
		$('#vmap').show();
	}
	
	$('#infad').hide();

	// Posiciona la captura
	$('form :text:first').focus();
}

/*
 * Función que muestra un mensaje informativo de lo que está realizando
 */
function cmsg_crgd(msg, tipo) {
	tipo = typeof tipo !== 'undefined' ? tipo : true;
	$('#crgd').show();
	$('#cmsg').html(msg);
	if(tipo) {
		setTimeout(function() {
			$('#crgd').hide();
		}, 1500);
	}
}

/*
 * Función para, según la coordenada capturada, establece la ubicación y el zoom del mapa. 
 */
function ubicar_latlon() {
	//Ubicando coordenada...
	var sel_x = $('#cx').val(),
		sel_y = $('#cy').val();
	//Si están llenos los campos de coordenadas geográficas, hace el mapa (utilizando estas coordenadas)
	if ((sel_x !== null) && (sel_x !== '') && (sel_y !== null) && (sel_y !== '') && 
			//Verificar si son válidos los campos de coordenadas geográficas
			RegExp($('#cy').attr('data-pattern')).test(sel_y) && RegExp($('#cx').attr('data-pattern')).test(sel_x)) {			
		hace_mapa(Number(sel_x),Number(sel_y),"Ubicación latitud y longitud", 19);
	}
}

/*
 * Función para, según los campos capturados, establece la ubicación y el zoom del mapa.
 * Se minimiza el uso de Google como buscador de direcciones.
 */
function ubicar_direccion() {
	//Ubicando dirección...
	var sel_a = s_mun.getValue();

	//Si están llenos los campos de coordenadas geográficas, hace el mapa (utilizando estas coordenadas)
	//incluye la información de la altitud, si está disponible, y fija el zoom adecuado a la precisión.
	if ((sel_a === '') || (sel_a === null)) {
		// Si están definidas las coordenadas
		if (($('#cx').val() !== '') && ($('#cy').val() !== '')) {
			ubicar_latlon();
			// TODO: Llenar los campos con la dirección aproximada según las coordenadas.
		} else {
			cmsg_crgd('Localización según dispositivo...');
			GMaps.geolocate({
				success: function(position) {
					hace_mapa(position.coords.latitude, position.coords.longitude,
							'Ubicación actual ('+
							((position.coords.altitude>0)?('altitud: '+position.coords.altitude+', '):'')+
							'exactitud: '+position.coords.accuracy+' m.)',
							Math.floor(18-Math.log2(3.2892*position.coords.accuracy/Math.sqrt(2*540*540)))
							);
					// TODO: Llenar los campos con la dirección aproximada según las coordenadas.
				},
				error: function(error) {
					alert('Geolocalización falla: '+error.message);
				},
				not_supported: function() {
					alert('Su navegador no soporta geolocalización');
				}
			});
		}
	} // En este caso se ha seleccionado un razgo geográfico, sin especificar las coordenadas.
	else {
		var sel_b = s_loc.getValue(),
			sel_c = s_snt.getValue(),
			sel_d = s_vld.getValue(),
			sel_e = s_ref1.getValue(),
			sel_i = s_ref2.getValue(),
			sel_f = $('#num').val(),
			d_geo = "", d_loc = "", d_txt = "";

		/* Dependiendo de las condiciones de captura, procede a generar el centro del mapa. */
		// Si proporciona el número exterior 
		if ((sel_f !== null) && (sel_f !== '') && (sel_f !== '0') && (sel_f !== 'SN') &&
				//Verificar si es un número válido
				RegExp($('#num').attr('data-pattern')).test(sel_f)) {
			// Primero buscar en las direcciones almacenadas.
			$.getJSON(SEIEG+"gn.php", { c: sel_a+sel_b+sel_d, n: sel_f }, function(datos) {
				d_geo = $('#vld option:selected').html()+' '+sel_f+', '+$('#loc option:selected').html()+', '+$('#mun option:selected').html()+', GTO, México';
				if(datos["lat"] != null) {
					hace_mapa(datos["lat"], datos["lng"], d_geo, 19);
				} else {
					cmsg_crgd('Buscando dirección en Google...');					
					GMaps.geocode({
						address: d_geo,
						callback: function(results, status) {
							if (status == 'OK') {
								var latlng = results[0].geometry.location;
								hace_mapa(latlng.lat(), latlng.lng(), d_geo+' [Google]', 19);
								// Guardar el resultado para considerarlo en una consulta posterior.
								$.post(SEIEG+"dn.php", { c: sel_a+sel_b+sel_d, n: sel_f, x: latlng.lat(), y: latlng.lng() } );
							} else {
								$('#map').parent().fadeOut('slow');
								$('#vmap').show();
								alert('Dirección no localizada: '+d_geo+' ('+status+')');
							}
						}
					});
				}
			});
		} // Si proporciona la segunda entrecalle, descartado el caso CALLE NINGUNO o similares
		else if ((sel_i !== null) && (sel_i !== '') && (sel_i !== '0') &&
				(($('#ref2 option:selected').html()).indexOf('NINGUNO') === -1)) {
			// Primero busca en el Seieg
			$.getJSON(SEIEG+"gecal.php?c="+sel_a+sel_b+sel_d+"&e="+sel_a+sel_b+sel_i, function(datos) {
				if(datos["lat"] != null) {
					hace_mapa(datos["lat"], datos["lng"], $('#vld option:selected').html()+" y "+$('#ref2 option:selected').html(), 18);
				}
			});
		}// Si proporciona la primera entrecalle, descartado el caso CALLE NINGUNO o similares
		else if ((sel_e !== null) && (sel_e !== '') && (sel_e !== '0') &&
				(($('#ref1 option:selected').html()).indexOf('NINGUNO') === -1)) {
			// Primero busca en el Seieg
			$.getJSON(SEIEG+"gecal.php?c="+sel_a+sel_b+sel_d+"&e="+sel_a+sel_b+sel_e, function(datos) {
				if(datos["lat"] != null) {
					hace_mapa(datos["lat"], datos["lng"], $('#vld option:selected').html()+" y "+$('#ref1 option:selected').html(), 18);
				}
			});
		} // Si proporciona la calle, descartado el caso CALLE NINGUNO o similares
		else if ((sel_d !== null) && (sel_d !== '') && (sel_d !== '0') &&
				(($('#vld option:selected').html()).indexOf('NINGUNO') === -1)) {
			// Primero busca en el Seieg
			$.getJSON(SEIEG+"gcal.php?c="+sel_a+sel_b+sel_d, function(datos) {
				if(datos["lat"] != null) {
					hace_mapa(datos["lat"], datos["lng"], $('#vld option:selected').html(), 17);
				}
				else {
					cmsg_crgd('Buscando dirección en Google...');
					// Construlle la consulta para google
					d_geo = $('#vld option:selected').html()+', '+$('#loc option:selected').html()+', '+$('#mun option:selected').html()+', GTO, México';
					GMaps.geocode({
						address: d_geo,
						callback: function(results, status) {
							if (status == 'OK') {
								var latlng = results[0].geometry.location;
								hace_mapa(latlng.lat(), latlng.lng(), d_geo+' [Google]', 17);
								$.post(SEIEG+"dn.php", { c: sel_a+sel_b+sel_d, n: '-', x: latlng.lat(), y: latlng.lng() } );
							} else {
								$('#map').parent().fadeOut('slow');
								$('#vmap').show();
								alert('Dirección no localizada: '+d_geo+' ('+status+')');
							}
						}
					});
				}
			});
		} // Construlle la consulta para consultarlo en seieg
		else if ((sel_c !== null) && (sel_c !== '') && (sel_c !== '0')) {
			$.getJSON(SEIEG+"gcol.php?c="+sel_c, function(datos) {
				if(datos["lat"] != null)
					hace_mapa(datos["lat"], datos["lng"], $('#snt option:selected').html(), 15);
				else
					alert("No se cuenta con su ubicación.");
			});
		} else if ((sel_b !== null) && (sel_b !== '')) {
			d_loc = sel_b;
			d_txt = $('#loc option:selected').html()+', '+$('#mun option:selected').html();
			$.getJSON(SEIEG+"gloc.php?m="+sel_a+"&l="+d_loc, function(datos) {
				if(datos["lat"] != null)
					hace_mapa(datos["lat"], datos["lng"], d_txt, 13);
				else
					alert("No se cuenta con su ubicación.");
			});
		} else {			
			d_loc = "0001";
			d_txt = $('#mun option:selected').html();
			$.getJSON(SEIEG+"gloc.php?m="+sel_a+"&l="+d_loc, function(datos) {
				if(datos["lat"] != null)
					hace_mapa(datos["lat"], datos["lng"], d_txt, 11);
				else
					alert("No se cuenta con su ubicación.");
			});
		}
	}
}
