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


$cat = pg_query($dbconn, "SELECT * FROM cat_tipo_asen;");
if (!$cat) {
	echo "{\"Error\": 301}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}
$tipo_asen = array();
while ($reg = pg_fetch_assoc($cat)){
	$tipo_asen[ $reg['cve_tipo_asen'] ] =  $reg['nombre'];
}

$sql = "SELECT cve_asen, cve_tipo_asen, nom_asen FROM colonia WHERE".
"(cve_mun = '".$_GET["m"]."') AND (".
"(cve_mun_u = '".$_GET["m"]."' AND cve_loc_u = '".$_GET["l"]."')".
"OR (cve_mun_r = '".$_GET["m"]."' AND cve_loc_r = '".$_GET["l"]."' AND distancia < 1000)) ORDER BY nom_asen;";

$result = pg_query($dbconn, $sql);
if (!$result) {
	echo "{\"Error\": 302}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

$nada = 1;
echo "{\"\":\"\"";
while ($reg = pg_fetch_assoc($result)) {
	echo ",\"".($reg['cve_asen'])."\":\"".$tipo_asen[$reg['cve_tipo_asen']]." ".str_replace('"','\'',$reg['nom_asen'])."\"";
	$nada = 0;
}
if ($nada) {
	echo ",\"0\":\"Sin asentamientos\"";
}
echo "}";

if($jsonp_callback) {
	echo ")";
}