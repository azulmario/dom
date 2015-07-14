<?php
include("conectadb.php");
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
$etag = $_GET["c"].$_GET["e"];
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

$sql = "SELECT lat, lon FROM interseccion WHERE ".
	   "((cve_via  IN (SELECT cve_via FROM vialidad WHERE via_unica = '".$_GET["c"]."')) ".
	"AND (cve_via0 IN (SELECT cve_via FROM vialidad WHERE via_unica = '".$_GET["e"]."'))) OR ".
	   "((cve_via  IN (SELECT cve_via FROM vialidad WHERE via_unica = '".$_GET["e"]."')) ".
	"AND (cve_via0 IN (SELECT cve_via FROM vialidad WHERE via_unica = '".$_GET["c"]."'))) ".
	"ORDER BY lat DESC LIMIT 1;";
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