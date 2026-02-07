CREATE DATABASE dish_app;
USE dish_app;

-- 1. Organizations Table (New)
CREATE TABLE Orgs (
    orgID INT AUTO_INCREMENT PRIMARY KEY,
    orgName VARCHAR(100) NOT NULL,
    latCoord DECIMAL(10, 8),
    longCoord DECIMAL(11, 8), 
    org_email VARCHAR(100)
);

-- 2. Users Table (Linked to Org)
CREATE TABLE Users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    hashed_pwd VARCHAR(255) NOT NULL,
    orgID INT,
    uRole VARCHAR(20),
    email VARCHAR(100),
    FOREIGN KEY (orgID) REFERENCES Orgs(orgID)
);

-- 3. Master Ingredients (Linked to Org)
CREATE TABLE Ing (
    ingID INT AUTO_INCREMENT PRIMARY KEY,
    ingName VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    expiry DATE,
    batchNum VARCHAR(50),
    orgID INT,
    FOREIGN KEY (orgID) REFERENCES Orgs(orgID)
);

-- 4. Dishes Table (Linked to Org)
CREATE TABLE Dishes (
    dishID INT AUTO_INCREMENT PRIMARY KEY,
    dishName VARCHAR(100) NOT NULL,
    orgID INT,
    FOREIGN KEY (orgID) REFERENCES Orgs(orgID)
);

-- 5. Dish_Ing (The Bridge)
CREATE TABLE Dish_Ing (
    dishID INT,
    ingID INT,
    qty DECIMAL(10, 2),
    unit VARCHAR(20),
    PRIMARY KEY (dishID, ingID),
    FOREIGN KEY (dishID) REFERENCES Dishes(dishID) ON DELETE CASCADE,
    FOREIGN KEY (ingID) REFERENCES Ing(ingID) ON DELETE CASCADE
);