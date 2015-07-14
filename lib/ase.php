<?php
include("conectadb.php");
$cat = pg_query($dbconn, "SELECT * FROM cat_tipo_asen;");
if (!$cat) {
	echo "{\"Error\": \"#301\"}";
	exit;
}
$tipo_asen = array();
while ($reg = pg_fetch_assoc($cat)){
	$tipo_asen[ $reg['cve_tipo_asen'] ] =  $reg['nombre'];
}
$sql = "SELECT cve_asen, cve_tipo_asen, nom_asen FROM asentamiento WHERE cve_mun = '".$_GET["m"]."' AND cve_loc = '".$_GET["l"]."' ORDER BY nom_asen;";
$result = pg_query($dbconn, $sql);
if (!$result) {
	echo "{\"Error\": \"#302\"}";
	exit;
}
if(!ob_start('ob_gzhandler')) ob_start();
header('Access-Control-Allow-Origin: *');
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
header('Content-Type: ' . ($jsonp_callback ? 'application/javascript' : 'application/json') . ';charset=UTF-8');
echo ($jsonp_callback ? jsonp_callback . '(' : '');

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