<?php
include("conectadb.php");
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
$etag = $_GET["m"].$_GET["l"];
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

$sql = "SELECT lat, lon FROM cat_localidad WHERE cve_mun = '".$_GET["m"]."' AND cve_loc = '".$_GET["l"]."';";
$result = pg_query($dbconn, $sql);
if (!$result) {
	echo "{\"Error\": 801}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

$reg = pg_fetch_assoc($result);

if($reg['lat'] == "") {
echo "{\"lat\":null,\"lng\":null}";
} else {
echo "{\"lat\":".round($reg['lat'],7).",\"lng\":".round($reg['lon'],7)."}";
}

if($jsonp_callback) {
	echo ")";
}