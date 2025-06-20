-- Crear la base de datos para el sistema de costeo
USE master;
GO

-- Eliminar la base de datos si existe (CUIDADO: esto borra todos los datos)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'SistemaCosteo')
BEGIN
    ALTER DATABASE SistemaCosteo SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SistemaCosteo;
END
GO

-- Crear nueva base de datos
CREATE DATABASE SistemaCosteo
ON 
( NAME = 'SistemaCosteo_Data',
  FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\SistemaCosteo.mdf',
  SIZE = 100MB,
  MAXSIZE = 1GB,
  FILEGROWTH = 10MB )
LOG ON 
( NAME = 'SistemaCosteo_Log',
  FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\SistemaCosteo.ldf',
  SIZE = 10MB,
  MAXSIZE = 100MB,
  FILEGROWTH = 1MB );
GO

USE SistemaCosteo;
GO
