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

$cat = pg_query($dbconn, "SELECT * FROM cat_vialidad;");
if (!$cat) {
	echo "{\"Error\": 401}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}
$tipo_vial = array();
while ($reg = pg_fetch_assoc($cat)){
	$tipo_vial[ $reg['cve_tipo_vial'] ] =  $reg['descripcion'];
}
$sql = "SELECT cve_via, cve_tipo_vial, nom_via FROM vialidad WHERE cve_mun = '".$_GET["m"]."' AND cve_loc = '".$_GET["l"]."' AND es_llave ORDER BY nom_via, cve_tipo_vial;";
$result = pg_query($dbconn, $sql);
if (!$result) {
	echo "{\"Error\": 402}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

$nada = 1;
echo "{\"\":\"\"";
while ($reg = pg_fetch_assoc($result)){
	echo ",\"".(substr($reg['cve_via'],-5))."\":\"".$tipo_vial[$reg['cve_tipo_vial']]." ".str_replace('"','\"',$reg['nom_via'])."\"";
	$nada = 0;
}
if ($nada) {
	echo ",\"0\":\"Sin calles\"";
}
echo "}";

if($jsonp_callback) {
	echo ")";
}
/** @alert
 * Acorta los códigos de vialidad, no en base de datos,
 * completar con la información de municipio y localidad.
 */