-- Run in SQL Server Management Studio (SSMS)
-- Server: localhost\SQLEXPRESS or localhost
-- Authentication: Windows Authentication

CREATE DATABASE WowWedDB;
GO

USE WowWedDB;
GO

CREATE TABLE Users (
  UserID INT PRIMARY KEY IDENTITY,
  Username NVARCHAR(50) NOT NULL UNIQUE,
  Email NVARCHAR(100) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  CreatedAt DATETIME DEFAULT GETDATE()
);
GO
