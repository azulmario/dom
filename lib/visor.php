<?php
include("conectadb.php");
$sql = "SELECT count(*) FROM dom;";
$result = pg_query($dbconn, $sql);
if(!$result) {
	$etag = 'Error#10';
} else {
	$reg = pg_fetch_assoc($result);
	$etag = '2015v2.02m'.$reg['count'];
}
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
header('Access-Control-Allow-Origin: *');
header('Content-Type: ' . ($jsonp_callback ? 'application/javascript' : 'application/json') . ';charset=UTF-8');
header("Cache-Control: max-age=0, must-revalidate");
header("Last-Modified: ".gmdate("D, d M Y H:i:s", filemtime( __FILE__ ))." GMT");
header("Etag: $etag");
if((isset($_SERVER["HTTP_IF_NONE_MATCH"]) ? trim($_SERVER["HTTP_IF_NONE_MATCH"]) : false) === $etag) {
	header("HTTP/1.1 304 Not Modified");
	exit;
}
if(!ob_start('ob_gzhandler')) ob_start();
echo ($jsonp_callback ? jsonp_callback . '(' : '');

if (isset($_GET['i']) && $_GET["i"] != "" && isset($_GET['s']) && $_GET["s"] != ""){
	$sql = "SELECT count(*) FROM log_visitas WHERE id = ".$_GET["i"]." AND sd = MD5('".$_GET["s"]."');";
	$result = pg_query($dbconn, $sql);
	$reg = pg_fetch_assoc($result);
	if (!$reg['count']) {
		echo "{\"Error\":300}";
		if($jsonp_callback) {
			echo ")";
		}
		exit;
	}
} else {
	echo "{\"Error\":200}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

$sql = "SELECT lat, lon, dnt, ref4 FROM dom WHERE lat IS NOT NULL AND lon IS NOT NULL AND (idu = ". $_GET["i"]." OR idu IN (SELECT idx FROM log_view WHERE idu = ". $_GET["i"]." ) );";
$result = pg_query($dbconn, $sql);

if(!$result) {
	echo "{\"Error\":100}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

$mas = 0;
$id = 0;
echo "{\"type\":\"FeatureCollection\",\"features\":[";
if ($reg = pg_fetch_assoc($result)) {
	do {
		if($mas)
			echo ",";
		echo "{";
		
		echo "\"type\":\"Feature\",";
		
		echo "\"geometry\":{\"type\":\"Point\",\"coordinates\":";
		echo "[".round($reg['lon'], 5).",".round($reg['lat'], 5)."]},";

		echo "\"properties\":{";
			echo "\"id\":".$id.",";
			echo "\"dn\":\"".$reg['dnt']."\",";
			if($reg['ref4'] != "") {
				echo "\"ds\":\"".$reg['ref4']."\",";
			}
			echo "\"show_on_map\":true";
		echo "}";
		
		echo "}";
		$mas = 1;
		$id = $id + 1;
	} while ($reg = pg_fetch_assoc($result));
}
echo "]}";

if($jsonp_callback) {
	echo ")";
}

/*
	Utiliza el formato de GeoJSON
	http://leafletjs.com/examples/geojson.html

	Se verifica el uso correcto del formato con
	http://jsonlint.com/
	http://geojsonlint.com/
*/