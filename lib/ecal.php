<?php
include("conectadb.php");
$jsonp_callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
$etag = $_GET["c"];
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

$sql = "SELECT via_unica AS cve FROM vialidad WHERE cve_via IN ".
	"(SELECT cve_via  FROM interseccion WHERE (cve_via0 IN (SELECT cve_via FROM vialidad WHERE via_unica = ".$_GET["c"].")) UNION ".
	" SELECT cve_via0 FROM interseccion WHERE (cve_via  IN (SELECT cve_via FROM vialidad WHERE via_unica = ".$_GET["c"]."))) ".
	"GROUP BY cve ORDER BY cve ASC;";

$result = pg_query($dbconn, $sql);
if (!$result) {
	echo "{\"Error\": 501}";
	if($jsonp_callback) {
		echo ")";
	}
	exit;
}

echo "[";
if($reg = pg_fetch_assoc($result)) {
	echo "\"".(substr($reg['cve'],-5))."\"";
	while ($reg = pg_fetch_assoc($result)){
		echo ",\"".(substr($reg['cve'],-5))."\"";
	}
}
echo "]";
if($jsonp_callback) {
	echo ")";
}