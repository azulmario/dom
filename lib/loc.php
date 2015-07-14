<?php
include("conectadb.php");
$result = pg_query($dbconn, "SELECT cve_loc, nombre FROM localidad WHERE cve_mun = '".$_GET["m"]."' ORDER BY nombre;");
if (!$result) {
	echo "{\"Error\": \"#201\"}";
	exit;
}
if(!ob_start('ob_gzhandler')) ob_start();
header('Access-Control-Allow-Origin: *');
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
header('Content-Type: ' . ($jsonp_callback ? 'application/javascript' : 'application/json') . ';charset=UTF-8');
echo ($jsonp_callback ? jsonp_callback . '(' : '');
echo "{\"\":\"\"";
while ($reg = pg_fetch_assoc($result)){
	echo ",\"".($reg['cve_loc'])."\":\"".$reg['nombre']."\"";
}
echo "}";
if($jsonp_callback) {
	echo ")";
}