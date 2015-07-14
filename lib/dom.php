<?php
include("conectadb.php");
include("ip-addresses.php");

if (isset($_POST['i']) && $_POST["i"] != "" && isset($_POST['s']) && $_POST["s"] != "") {
	$sql = "SELECT count(*) FROM log_visitas WHERE id = ".$_POST["i"]." AND sd = MD5('".$_POST["s"]."');";
	$result = pg_query($dbconn, $sql);
	$reg = pg_fetch_assoc($result);
	if (!$reg['count'])
		exit;
} else
	exit;

$sql = "INSERT INTO dom (dnt, mun, loc, snt, cp, vld, num, ntr, ref1, ref2, ref3, ref4, lat, lon, ip, idu) VALUES ('" . $_POST ["id"] . "', " . $_POST ["mun"] . ", " . $_POST ["loc"] . ", " . $_POST ["snt"] . ", " . $_POST ["cp"] . ", " . $_POST ["vld"] . ", '" . $_POST ["num"] . "', '" . $_POST ["int"] . "', " . $_POST ["ref1"] . ", " . $_POST ["ref2"] . ", " . $_POST ["ref3"] . ", '" . $_POST ["ref4"] . "', " . $_POST ["cx"] . ", " . $_POST ["cy"] . ", '" . get_user_ip_address ( TRUE ) . "', " . $_POST ["i"] . ");";
$sql = str_replace(" ,", " NULL,", $sql);
$sql = str_replace("''", "NULL", $sql);
$result = pg_query($dbconn, $sql);