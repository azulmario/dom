<?php
$host = "10.0.2.2";
$port = "15432";
$dbnm = "observa";
$user = "mario";
$pass = "hola";

$conn_string = "host='". $host . "' port='" . $port . "' dbname='" . $dbnm . "' user='" . $user . "' password='" . $pass . "' ";
if (!function_exists('pg_connect')) {
	echo "La funcion NO esta disponible.<br />\n";
	exit;
}
$dbconn = pg_connect($conn_string) or die("{\"Error\": \"".pg_last_error()."\"}");