<?php
include("conectadb.php");
$result = pg_query($dbconn, "SELECT * FROM municipio;");
header('Access-Control-Allow-Origin: *');
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
header('Content-Type: ' . ($jsonp_callback ? 'application/javascript' : 'application/json') . ';charset=UTF-8');
$last_modified_time = filemtime( __FILE__ );
$etag = '2014v0.0';
if(!$result) {
	$etag = $etag . 'Error#101';
}
header("Cache-Control: max-age=2419200");
header("Last-Modified: ".gmdate("D, d M Y H:i:s", $last_modified_time)." GMT");
header("Etag: $etag");
if((int)(isset($_SERVER["HTTP_IF_MODIFIED_SINCE"]) ? strtotime($_SERVER["HTTP_IF_MODIFIED_SINCE"]) : false) === (int)$last_modified_time 
	  && (isset($_SERVER["HTTP_IF_NONE_MATCH"]) ? trim($_SERVER["HTTP_IF_NONE_MATCH"]) : false) === $etag) {
	header("HTTP/1.1 304 Not Modified");
	exit;
}
if(!ob_start('ob_gzhandler')) ob_start();
echo ($jsonp_callback ? jsonp_callback . '(' : '');
if(!$result) {
	echo "{\"Error\":\"#101\"}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}
echo "[";
echo "{\"c\":\"\",\"m\":\"\"}";
while($reg = pg_fetch_assoc($result)){
	echo ",{\"c\":\"".($reg['cve_mun'])."\",\"m\":\"".$reg['nombre']."\"}";
}
echo "]";
if($jsonp_callback) {
	echo ")";
}