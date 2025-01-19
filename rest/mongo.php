<?php
require 'vendor/autoload.php';

class db {
    private $user = "2zviarko";
    private $pass = "pass2zviarko";
    private $host = "172.20.44.25";
    private $base = "2zviarko";
    private $coll = "users"; 
    private $conn;
    private $collection;

    function __construct() {
        $this->conn = new MongoDB\Client("mongodb://{$this->user}:{$this->pass}@{$this->host}/{$this->base}");
        $this->collection = $this->conn->{$this->base}->{$this->coll};
    }

    function register($username, $password) {
        $user = [
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
        ];
        $this->collection->insertOne($user);
    }

    function login($username, $password) {
        $user = $this->collection->findOne(['username' => $username]);
        if ($user && password_verify($password, $user['password'])) {
            return true;
        }
        return false;
    }

    function select() {
        return $this->collection->find()->toArray();
    }

    function insert($user) {
        return $this->collection->insertOne($user);
    }
}
?>
