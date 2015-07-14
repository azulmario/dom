<?php
include("conectadb.php");
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
$etag = $_GET["a"];
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

$sql = "SELECT cp FROM colonia WHERE cve_asen = '".$_GET["a"]."';";
$result = pg_query($dbconn, $sql);

echo ($jsonp_callback ? jsonp_callback . '(' : '');
if (!$result) {
	echo "{\"Error\": 501}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

$reg = pg_fetch_assoc($result);
echo "[".$reg['cp']."]";
if($jsonp_callback) {
	echo ")";
}