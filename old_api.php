<?php

header("Access-Control-Allow-Origin: *");

print_r($_REQUEST);

$logins = [];
$logins['admin'] = 1;
$logins['user'] = 2;
$logins['papa'] = 3;

$response_data = [];
if(array_key_exists($_GET['login'], $logins)) {
    $response_data['status'] = 200;
} else {
    $response_data['status'] = 400;
}

echo json_encode($response_data);