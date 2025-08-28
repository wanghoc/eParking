-- Create database if not exists
CREATE DATABASE IF NOT EXISTS eParking_db;
USE eParking_db;

-- Create user with proper privileges
CREATE USER IF NOT EXISTS 'eparking_user'@'%' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON eParking_db.* TO 'eparking_user'@'%';
FLUSH PRIVILEGES;

-- Import schema if exists
-- Source /docker-entrypoint-initdb.d/schema.sql;

