<?php
include("conectadb.php");
$sql = "INSERT INTO geocode0 VALUES (".$_POST ["c"].", '".$_POST ["n"]."', ".$_POST ["x"].", ".$_POST ["y"]." );";
$result = pg_query($dbconn, $sql);